import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ensureSeedRuntime } from "@/lib/runtime/seed";
import { analyzeScene, mutateCharacters, mutateWorld } from "@/lib/runtime/engine";
import type { RuntimeCharacter, RuntimeWorld } from "@/lib/runtime/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projectId = await ensureSeedRuntime();
    const state = await loadRuntimeState(projectId);

    return NextResponse.json({
      ok: true,
      state
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown runtime error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sceneText = String(body.sceneText || "").trim();

    if (!sceneText) {
      return NextResponse.json(
        { ok: false, error: "sceneText is required" },
        { status: 400 }
      );
    }

    const projectId = await ensureSeedRuntime();
    const supabase = getSupabaseAdmin().schema("solaceframe");
    const state = await loadRuntimeState(projectId);

    const analysis = analyzeScene(sceneText, state.world, state.characters);
    const beforeState = {
      world: state.world,
      characters: state.characters
    };

    const nextWorld = mutateWorld(state.world, analysis);
    const nextCharacters = mutateCharacters(state.characters, sceneText, analysis);

    const { data: scene, error: sceneError } = await supabase
      .from("scenes")
      .insert({
        project_id: projectId,
        branch_id: state.activeBranch.id,
        title: analysis.title,
        scene_text: sceneText,
        admissibility: analysis.admissibility,
        drift_risk: analysis.driftRisk,
        compiled_packet: analysis.packet
      })
      .select("*")
      .single();

    if (sceneError) throw sceneError;

    const { error: worldError } = await supabase
      .from("worlds")
      .update({
        state: nextWorld.state,
        pressure: nextWorld.pressure
      })
      .eq("id", state.world.id);

    if (worldError) throw worldError;

    for (const character of nextCharacters) {
      const { error: characterError } = await supabase
        .from("characters")
        .update({
          state: character.state,
          continuity_score: character.continuity_score,
          pressure: character.pressure
        })
        .eq("id", character.id);

      if (characterError) throw characterError;
    }

    const { data: renderJob, error: renderError } = await supabase
      .from("render_jobs")
      .insert({
        project_id: projectId,
        scene_id: scene.id,
        branch_id: state.activeBranch.id,
        status: analysis.admissibility === "blocked" ? "blocked" : "queued",
        model_route: "vercel-ai-gateway:pending",
        prompt: buildCanonicalPrompt(sceneText, analysis.packet),
        packet: analysis.packet
      })
      .select("*")
      .single();

    if (renderError) throw renderError;

    const afterState = {
      world: nextWorld,
      characters: nextCharacters
    };

    const { error: diffError } = await supabase
      .from("continuity_diffs")
      .insert({
        project_id: projectId,
        scene_id: scene.id,
        before_state: beforeState,
        after_state: afterState,
        preserved: analysis.preserve,
        mutated: analysis.mutated,
        violations: analysis.violations
      });

    if (diffError) throw diffError;

    const { error: lineageError } = await supabase
      .from("lineage_events")
      .insert({
        project_id: projectId,
        scene_id: scene.id,
        render_job_id: renderJob.id,
        event_type: "scene-compiled",
        summary: `Scene compiled: ${analysis.title}`,
        payload: {
          admissibility: analysis.admissibility,
          driftRisk: analysis.driftRisk,
          renderJobId: renderJob.id
        }
      });

    if (lineageError) throw lineageError;

    const nextState = await loadRuntimeState(projectId);

    return NextResponse.json({
      ok: true,
      analysis,
      state: nextState
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown runtime mutation error"
      },
      { status: 500 }
    );
  }
}

async function loadRuntimeState(projectId: string) {
  const supabase = getSupabaseAdmin().schema("solaceframe");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) throw projectError;

  const { data: world, error: worldError } = await supabase
    .from("worlds")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (worldError) throw worldError;

  const { data: activeBranch, error: branchError } = await supabase
    .from("branches")
    .select("*")
    .eq("id", project.active_branch_id)
    .single();

  if (branchError) throw branchError;

  const [{ data: characters, error: charactersError }, { data: scenes, error: scenesError }, { data: renderJobs, error: jobsError }, { data: lineageEvents, error: lineageError }, { data: continuityDiffs, error: diffsError }] =
    await Promise.all([
      supabase.from("characters").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
      supabase.from("scenes").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
      supabase.from("render_jobs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
      supabase.from("lineage_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
      supabase.from("continuity_diffs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20)
    ]);

  if (charactersError) throw charactersError;
  if (scenesError) throw scenesError;
  if (jobsError) throw jobsError;
  if (lineageError) throw lineageError;
  if (diffsError) throw diffsError;

  return {
    project,
    world,
    activeBranch,
    characters: (characters ?? []) as RuntimeCharacter[],
    scenes: scenes ?? [],
    renderJobs: renderJobs ?? [],
    lineageEvents: lineageEvents ?? [],
    continuityDiffs: continuityDiffs ?? []
  };
}

function buildCanonicalPrompt(sceneText: string, packet: Record<string, unknown>) {
  return [
    "Governed synthetic media render.",
    `Scene: ${sceneText}`,
    "Preserve all continuity constraints in the packet.",
    `Packet: ${JSON.stringify(packet)}`
  ].join("\n");
}

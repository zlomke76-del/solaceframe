import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ensureSeedRuntime } from "@/lib/runtime/seed";
import { analyzeScene, computeBranchDelta, mutateCharacters, mutateWorld } from "@/lib/runtime/engine";
import type {
  RuntimeCausalEvent,
  RuntimeCharacter,
  RuntimeContradiction,
  RuntimeWorld
} from "@/lib/runtime/types";

export const dynamic = "force-dynamic";

function normalizeRuntimeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, raw: { name: error.name, stack: error.stack } };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      message:
        typeof record.message === "string"
          ? record.message
          : typeof record.error === "string"
          ? record.error
          : "Non-Error runtime failure",
      code: typeof record.code === "string" ? record.code : undefined,
      details: typeof record.details === "string" ? record.details : undefined,
      hint: typeof record.hint === "string" ? record.hint : undefined,
      raw: record
    };
  }

  return { message: String(error || "Unknown runtime error"), raw: error };
}

function jsonError(error: unknown, status = 500) {
  const normalized = normalizeRuntimeError(error);
  console.error("SolaceFrame runtime error:", normalized);
  return NextResponse.json({ ok: false, ...normalized }, { status });
}

export async function GET() {
  try {
    const projectId = await ensureSeedRuntime();
    const state = await loadRuntimeState(projectId);
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sceneText = String(body.sceneText || "").trim();

    if (!sceneText) {
      return NextResponse.json({ ok: false, error: "sceneText is required" }, { status: 400 });
    }

    const projectId = await ensureSeedRuntime();
    const supabase = getSupabaseAdmin().schema("solaceframe");
    const state = await loadRuntimeState(projectId);

    const unresolvedContradictions = state.contradictions.filter((item) => !item.resolved);
    const analysis = analyzeScene(
      sceneText,
      state.world,
      state.characters,
      state.causalEvents,
      unresolvedContradictions
    );

    const beforeState = {
      world: state.world,
      characters: state.characters,
      causalEvents: state.causalEvents.slice(0, 20),
      unresolvedContradictions
    };

    const nextWorld = mutateWorld(state.world, analysis);
    const nextCharacters = mutateCharacters(state.characters, sceneText, analysis);
    const branchDelta = computeBranchDelta(analysis);

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

    if (analysis.causalEvents.length > 0) {
      const { error: causalError } = await supabase
        .from("causal_events")
        .insert(
          analysis.causalEvents.map((event) => ({
            project_id: projectId,
            branch_id: state.activeBranch.id,
            scene_id: scene.id,
            event_key: event.event_key,
            event_type: event.event_type,
            subject: event.subject,
            predicate: event.predicate,
            object_ref: event.object_ref,
            severity: event.severity,
            payload: event.payload
          }))
        );

      if (causalError) throw causalError;
    }

    if (analysis.contradictions.length > 0) {
      const { error: contradictionError } = await supabase
        .from("contradictions")
        .insert(
          analysis.contradictions.map((contradiction) => ({
            project_id: projectId,
            branch_id: state.activeBranch.id,
            scene_id: scene.id,
            contradiction_type: contradiction.contradiction_type,
            summary: contradiction.summary,
            severity: contradiction.severity,
            resolved: false,
            payload: contradiction.payload
          }))
        );

      if (contradictionError) throw contradictionError;
    }

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

    const nextDivergence = Math.min(
      100,
      state.activeBranch.divergence_score + branchDelta.divergenceDelta
    );

    const { error: branchError } = await supabase
      .from("branches")
      .update({
        divergence_score: nextDivergence,
        status: analysis.admissibility === "blocked" ? "blocked-review" : state.activeBranch.status
      })
      .eq("id", state.activeBranch.id);

    if (branchError) throw branchError;

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
      characters: nextCharacters,
      causalEvents: analysis.causalEvents,
      contradictions: analysis.contradictions,
      branch: {
        ...state.activeBranch,
        divergence_score: nextDivergence
      }
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
        event_type: "causal-scene-compiled",
        summary: `Causal scene compiled: ${analysis.title}`,
        payload: {
          admissibility: analysis.admissibility,
          driftRisk: analysis.driftRisk,
          renderJobId: renderJob.id,
          causalEvents: analysis.causalEvents,
          contradictions: analysis.contradictions,
          renderConstraints: analysis.renderConstraints
        }
      });

    if (lineageError) throw lineageError;

    const nextState = await loadRuntimeState(projectId);
    return NextResponse.json({ ok: true, analysis, state: nextState });
  } catch (error) {
    return jsonError(error);
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
  if (!project) throw new Error("Runtime project not found after seed.");

  const { data: world, error: worldError } = await supabase
    .from("worlds")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (worldError) throw worldError;
  if (!world) throw new Error("Runtime world missing after seed.");

  let activeBranchId = project.active_branch_id as string | null;

  if (!activeBranchId) {
    const { data: fallbackBranch, error: fallbackBranchError } = await supabase
      .from("branches")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackBranchError) throw fallbackBranchError;
    if (!fallbackBranch) throw new Error("Runtime branch missing after seed.");

    activeBranchId = fallbackBranch.id as string;

    const { error: projectBranchUpdateError } = await supabase
      .from("projects")
      .update({ active_branch_id: activeBranchId })
      .eq("id", projectId);

    if (projectBranchUpdateError) throw projectBranchUpdateError;
  }

  const { data: activeBranch, error: branchError } = await supabase
    .from("branches")
    .select("*")
    .eq("id", activeBranchId)
    .maybeSingle();

  if (branchError) throw branchError;
  if (!activeBranch) throw new Error("Active branch not found.");

  const [
    charactersResult,
    scenesResult,
    renderJobsResult,
    lineageEventsResult,
    continuityDiffsResult,
    causalEventsResult,
    contradictionsResult
  ] = await Promise.all([
    supabase.from("characters").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("scenes").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
    supabase.from("render_jobs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
    supabase.from("lineage_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
    supabase.from("continuity_diffs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
    supabase.from("causal_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(40),
    supabase.from("contradictions").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(40)
  ]);

  if (charactersResult.error) throw charactersResult.error;
  if (scenesResult.error) throw scenesResult.error;
  if (renderJobsResult.error) throw renderJobsResult.error;
  if (lineageEventsResult.error) throw lineageEventsResult.error;
  if (continuityDiffsResult.error) throw continuityDiffsResult.error;
  if (causalEventsResult.error) throw causalEventsResult.error;
  if (contradictionsResult.error) throw contradictionsResult.error;

  return {
    project,
    world,
    activeBranch,
    characters: (charactersResult.data ?? []) as RuntimeCharacter[],
    scenes: scenesResult.data ?? [],
    renderJobs: renderJobsResult.data ?? [],
    lineageEvents: lineageEventsResult.data ?? [],
    continuityDiffs: continuityDiffsResult.data ?? [],
    causalEvents: (causalEventsResult.data ?? []) as RuntimeCausalEvent[],
    contradictions: (contradictionsResult.data ?? []) as RuntimeContradiction[]
  };
}

function buildCanonicalPrompt(sceneText: string, packet: Record<string, unknown>) {
  return [
    "Governed synthetic media render.",
    `Scene: ${sceneText}`,
    "The render must obey causal constraints, continuity diffs, persistent object lineage, and unresolved contradictions.",
    `Packet: ${JSON.stringify(packet)}`
  ].join("\n");
}

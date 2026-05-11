import { getSupabaseAdmin } from "../supabase-admin";

export async function ensureSeedRuntime() {
  const supabase = getSupabaseAdmin().schema("solaceframe");

  const { data: existingProject, error: existingError } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingProject?.id) {
    return existingProject.id as string;
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: "Prime SolaceFrame Runtime",
      description: "Default governed synthetic continuity project."
    })
    .select("*")
    .single();

  if (projectError) throw projectError;

  const projectId = project.id as string;

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .insert({
      project_id: projectId,
      name: "Prime Continuity",
      divergence_score: 0,
      status: "active"
    })
    .select("*")
    .single();

  if (branchError) throw branchError;

  await supabase
    .from("projects")
    .update({ active_branch_id: branch.id })
    .eq("id", projectId);

  const { error: worldError } = await supabase
    .from("worlds")
    .insert({
      project_id: projectId,
      name: "Neon District 7",
      pressure: 38,
      state: {
        weather: "cold rain",
        damagedLocations: ["eastern bridge"],
        persistentObjects: ["yellow courier case"],
        unresolvedTensions: ["source authority unresolved"]
      }
    });

  if (worldError) throw worldError;

  const { error: charactersError } = await supabase
    .from("characters")
    .insert([
      {
        project_id: projectId,
        name: "Elena Voss",
        role: "Primary continuity anchor",
        appearance_anchor: {
          hair: "dark",
          wardrobe: "weathered jacket",
          visualLock: "active"
        },
        state: {
          emotionalState: "guarded",
          injury: "left-arm injury",
          carriedObjects: ["yellow courier case"]
        },
        continuity_score: 94,
        pressure: 22
      },
      {
        project_id: projectId,
        name: "Ren Kaito",
        role: "Unverified source holder",
        appearance_anchor: {
          wardrobe: "dark transit coat",
          visualLock: "active"
        },
        state: {
          emotionalState: "withholding",
          injury: "none",
          carriedObjects: ["encrypted source file"]
        },
        continuity_score: 87,
        pressure: 31
      }
    ]);

  if (charactersError) throw charactersError;

  const { error: lineageError } = await supabase
    .from("lineage_events")
    .insert({
      project_id: projectId,
      event_type: "runtime-seeded",
      summary: "Initial SolaceFrame runtime state created.",
      payload: {
        branchId: branch.id
      }
    });

  if (lineageError) throw lineageError;

  return projectId;
}

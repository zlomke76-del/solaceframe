export type Admissibility = "allow" | "conditional" | "blocked";
export type DriftRisk = "low" | "medium" | "high";

export type RuntimeProject = {
  id: string;
  name: string;
  description: string | null;
  active_branch_id: string | null;
};

export type RuntimeWorld = {
  id: string;
  project_id: string;
  name: string;
  state: Record<string, unknown>;
  pressure: number;
};

export type RuntimeBranch = {
  id: string;
  project_id: string;
  parent_branch_id: string | null;
  name: string;
  divergence_score: number;
  status: string;
};

export type RuntimeCharacter = {
  id: string;
  project_id: string;
  name: string;
  role: string | null;
  appearance_anchor: Record<string, unknown>;
  state: Record<string, unknown>;
  continuity_score: number;
  pressure: number;
};

export type RuntimeScene = {
  id: string;
  project_id: string;
  branch_id: string;
  title: string;
  scene_text: string;
  admissibility: Admissibility;
  drift_risk: DriftRisk;
  compiled_packet: Record<string, unknown>;
  created_at: string;
};

export type RuntimeRenderJob = {
  id: string;
  project_id: string;
  scene_id: string | null;
  branch_id: string | null;
  status: string;
  model_route: string | null;
  prompt: string;
  packet: Record<string, unknown>;
  error: string | null;
  created_at: string;
};

export type RuntimeLineageEvent = {
  id: string;
  project_id: string;
  scene_id: string | null;
  render_job_id: string | null;
  event_type: string;
  summary: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type RuntimeContinuityDiff = {
  id: string;
  project_id: string;
  scene_id: string | null;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  preserved: string[];
  mutated: string[];
  violations: string[];
  created_at: string;
};

export type RuntimeCausalEvent = {
  id: string;
  project_id: string;
  branch_id: string | null;
  scene_id: string | null;
  event_key: string;
  event_type: string;
  subject: string;
  predicate: string;
  object_ref: string | null;
  severity: number;
  payload: Record<string, unknown>;
  created_at: string;
};

export type RuntimeContradiction = {
  id: string;
  project_id: string;
  branch_id: string | null;
  scene_id: string | null;
  contradiction_type: string;
  summary: string;
  severity: string;
  resolved: boolean;
  payload: Record<string, unknown>;
  created_at: string;
};

export type RuntimeState = {
  project: RuntimeProject;
  world: RuntimeWorld;
  activeBranch: RuntimeBranch;
  characters: RuntimeCharacter[];
  scenes: RuntimeScene[];
  renderJobs: RuntimeRenderJob[];
  lineageEvents: RuntimeLineageEvent[];
  continuityDiffs: RuntimeContinuityDiff[];
  causalEvents: RuntimeCausalEvent[];
  contradictions: RuntimeContradiction[];
};

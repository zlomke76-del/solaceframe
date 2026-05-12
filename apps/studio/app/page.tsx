"use client";

import { useEffect, useMemo, useState } from "react";
import type { RuntimeContradiction, RuntimeState } from "@/lib/runtime/types";

type ApiRuntimeResponse = {
  ok: boolean;
  state?: RuntimeState;
  error?: string;
  message?: string;
};

function decisionLabel(decision?: string) {
  if (!decision) return "loading";
  return decision.toUpperCase();
}

export default function Page() {
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [sceneText, setSceneText] = useState(
    "Elena crosses the damaged eastern bridge while hiding her left-arm injury and protecting the yellow courier case."
  );
  const [forkName, setForkName] = useState("Continuity Repair Fork");
  const [repairNote, setRepairNote] = useState("Resolved through governed repair lineage; prior state remains visible in ancestry.");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRuntime() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/runtime", { cache: "no-store" });
      const data = (await response.json()) as ApiRuntimeResponse;

      if (!data.ok || !data.state) {
        throw new Error(data.error || data.message || "Unable to load runtime");
      }

      setRuntime(data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown load error");
    } finally {
      setLoading(false);
    }
  }

  async function runRuntimeAction(body: Record<string, unknown>, busyState: string) {
    setBusy(busyState);
    setError(null);

    try {
      const response = await fetch("/api/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = (await response.json()) as ApiRuntimeResponse;

      if (!data.ok || !data.state) {
        throw new Error(data.error || data.message || "Runtime action failed");
      }

      setRuntime(data.state);
      if (body.action === "compile_scene") setSceneText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown runtime action error");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    void loadRuntime();
  }, []);

  const worldState = useMemo(() => runtime?.world?.state ?? {}, [runtime]);
  const latestDiff = runtime?.continuityDiffs?.[0] ?? null;
  const latestJob = runtime?.renderJobs?.[0] ?? null;
  const unresolvedContradictions = runtime?.contradictions?.filter((item) => !item.resolved) ?? [];
  const report = runtime?.admissibilityReport;
  const activeBranch = runtime?.activeBranch;

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>
        <p className="sf-muted">Governed synthetic continuity runtime backed by the solaceframe schema.</p>

        <nav className="sf-nav">
          {[
            "Admissibility",
            "Scene Compile",
            "Branch Forking",
            "Contradiction Repair",
            "Causal Graph",
            "Render Packet",
            "Execution Artifacts"
          ].map((item, index) => (
            <div className="sf-nav-item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </nav>

        <button className="sf-secondary" onClick={() => void loadRuntime()} disabled={Boolean(busy)}>
          Refresh Runtime
        </button>
      </aside>

      <section className="sf-main">
        <header className="sf-top">
          <div>
            <div className="sf-eyebrow">SolaceFrame V15 · Execution Layer Delta</div>
            <h1 className="sf-title">
              Governed runtime packets can now execute into image, video, or storyboard artifacts.
            </h1>
          </div>

          <div className={`sf-status decision-${report?.decision ?? "loading"}`}>
            {loading ? "Loading runtime" : `Runtime ${decisionLabel(report?.decision)}`}
          </div>
        </header>

        {error ? <div className="sf-error">{error}</div> : null}

        {runtime ? (
          <>
            <section className="sf-card sf-admissibility-card">
              <div className="sf-card-head">
                <div>
                  <div className="sf-eyebrow">Runtime Admissibility</div>
                  <h2>{decisionLabel(report?.decision)} · {report?.score ?? 0}% survivability</h2>
                </div>
                <div className="sf-branch-pill">{activeBranch?.name} · {activeBranch?.status}</div>
              </div>

              <div className="sf-meter">
                <div className="sf-meter-fill" style={{ width: `${report?.score ?? 0}%` }} />
              </div>

              <div className="sf-factor-grid">
                <Metric label="World pressure" value={`${report?.factors.worldPressure ?? 0}%`} />
                <Metric label="Branch divergence" value={`${report?.factors.branchDivergence ?? 0}%`} />
                <Metric label="Open contradictions" value={String(report?.factors.unresolvedContradictions ?? 0)} />
                <Metric label="Irreversible events" value={String(report?.factors.irreversibleOpenEvents ?? 0)} />
              </div>

              <div className="sf-stack compact">
                {report?.reasons.map((reason) => (
                  <div className="sf-row-card" key={reason}>{reason}</div>
                ))}
                {report?.requiredRepairs.map((repair) => (
                  <div className="sf-row-card warning" key={repair}>{repair}</div>
                ))}
              </div>
            </section>

            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Causal Scene Compiler</div>
                <textarea
                  className="sf-textarea"
                  value={sceneText}
                  onChange={(event) => setSceneText(event.target.value)}
                  placeholder="Describe the next scene..."
                />

                <button
                  className="sf-primary"
                  onClick={() => void runRuntimeAction({ action: "compile_scene", sceneText: sceneText.trim() }, "compile")}
                  disabled={Boolean(busy) || !sceneText.trim()}
                >
                  {busy === "compile" ? "Compiling Runtime..." : "Compile Governed Scene"}
                </button>

                <p className="sf-muted">
                  Persists scene state, causal events, contradictions, continuity diffs, branch pressure,
                  lineage, admissibility and a V15-ready render execution packet.
                </p>
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">Branch Forking</div>
                <input
                  className="sf-input"
                  value={forkName}
                  onChange={(event) => setForkName(event.target.value)}
                  placeholder="Fork name"
                />
                <button
                  className="sf-primary"
                  onClick={() =>
                    void runRuntimeAction(
                      {
                        action: "fork_branch",
                        name: forkName.trim() || "Continuity Repair Fork",
                        reason: "Operator forked branch from active runtime state."
                      },
                      "fork"
                    )
                  }
                  disabled={Boolean(busy)}
                >
                  {busy === "fork" ? "Forking Branch..." : "Fork Active Branch"}
                </button>
                <div className="sf-stack compact">
                  {runtime.branches.map((branch) => (
                    <div className="sf-row-card" key={branch.id}>
                      <div className="sf-row">
                        <strong>{branch.name}</strong>
                        <span>{branch.divergence_score}%</span>
                      </div>
                      <p>{branch.parent_branch_id ? `forked from ${branch.parent_branch_id}` : "prime branch"}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Contradiction Repair</div>
                <textarea
                  className="sf-textarea short"
                  value={repairNote}
                  onChange={(event) => setRepairNote(event.target.value)}
                  placeholder="Repair note..."
                />
                <div className="sf-stack">
                  {unresolvedContradictions.map((item) => (
                    <ContradictionCard
                      key={item.id}
                      item={item}
                      busy={busy}
                      onResolve={() =>
                        void runRuntimeAction(
                          {
                            action: "resolve_contradiction",
                            contradictionId: item.id,
                            repairNote
                          },
                          `repair:${item.id}`
                        )
                      }
                    />
                  ))}
                  {unresolvedContradictions.length === 0 ? <p className="sf-muted">No unresolved contradictions.</p> : null}
                </div>
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">World / Branch State</div>
                <h2>{runtime.world.name}</h2>
                <div className="sf-meter">
                  <div className="sf-meter-fill" style={{ width: `${runtime.world.pressure}%` }} />
                </div>
                <div className="sf-big">{runtime.world.pressure}% world pressure</div>
                <div className="sf-muted">Branch divergence: {runtime.activeBranch.divergence_score}%</div>
                <pre className="sf-code">{JSON.stringify(worldState, null, 2)}</pre>
              </section>
            </div>

            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Causal Graph</div>
                <div className="sf-stack">
                  {runtime.causalEvents.map((event) => (
                    <div className="sf-row-card" key={event.id}>
                      <div className="sf-row">
                        <strong>{event.event_type}</strong>
                        <span>{event.reversibility ?? "unclassified"} · severity {event.severity}</span>
                      </div>
                      <p>{event.subject} → {event.predicate} {event.object_ref ? `→ ${event.object_ref}` : ""}</p>
                      {event.parent_event_id ? <p className="sf-muted">parent: {event.parent_event_id}</p> : null}
                    </div>
                  ))}
                  {runtime.causalEvents.length === 0 ? <p className="sf-muted">No causal events yet.</p> : null}
                </div>
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">Character State</div>
                <div className="sf-stack">
                  {runtime.characters.map((character) => (
                    <div className="sf-row-card" key={character.id}>
                      <div className="sf-row">
                        <strong>{character.name}</strong>
                        <span>{character.continuity_score}% continuity</span>
                      </div>
                      <pre className="sf-code small">{JSON.stringify(character.state, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Latest Continuity Diff</div>
                {latestDiff ? (
                  <>
                    <div className="sf-chip-wrap">
                      {latestDiff.preserved.map((item) => (
                        <span className="sf-chip green" key={item}>{item}</span>
                      ))}
                      {latestDiff.mutated.map((item) => (
                        <span className="sf-chip blue" key={item}>{item}</span>
                      ))}
                      {latestDiff.violations.map((item) => (
                        <span className="sf-chip red" key={item}>{item}</span>
                      ))}
                    </div>
                    <pre className="sf-code">{JSON.stringify(latestDiff.after_state, null, 2)}</pre>
                  </>
                ) : (
                  <p className="sf-muted">No continuity diff has been created yet.</p>
                )}
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">Latest Render Packet</div>
                {latestJob ? (
                  <>
                    <div className="sf-row-card">
                      <div className="sf-row">
                        <strong>{latestJob.status}</strong>
                        <span>{latestJob.model_route ?? "pending route"}</span>
                      </div>
                      {latestJob.output_url ? (
                        <p>Artifact URL persisted.</p>
                      ) : (
                        <p>Queued packet awaiting governed execution.</p>
                      )}
                    </div>

                    <div className="sf-action-row">
                      <button
                        className="sf-primary"
                        onClick={() =>
                          void runRuntimeAction(
                            { action: "execute_render_job", renderJobId: latestJob.id, outputKind: "image" },
                            "execute:image"
                          )
                        }
                        disabled={Boolean(busy) || latestJob.status === "blocked"}
                      >
                        {busy === "execute:image" ? "Executing Image..." : "Execute Image"}
                      </button>

                      <button
                        className="sf-primary subtle"
                        onClick={() =>
                          void runRuntimeAction(
                            { action: "execute_render_job", renderJobId: latestJob.id, outputKind: "storyboard" },
                            "execute:storyboard"
                          )
                        }
                        disabled={Boolean(busy) || latestJob.status === "blocked"}
                      >
                        {busy === "execute:storyboard" ? "Executing Storyboard..." : "Execute Storyboard"}
                      </button>

                      <button
                        className="sf-primary subtle"
                        onClick={() =>
                          void runRuntimeAction(
                            { action: "execute_render_job", renderJobId: latestJob.id, outputKind: "video" },
                            "execute:video"
                          )
                        }
                        disabled={Boolean(busy) || latestJob.status === "blocked"}
                      >
                        {busy === "execute:video" ? "Executing Video..." : "Execute Video"}
                      </button>
                    </div>

                    <pre className="sf-code">{JSON.stringify(latestJob.packet, null, 2)}</pre>
                  </>
                ) : (
                  <p className="sf-muted">No packet queued yet.</p>
                )}
              </section>
            </div>


            <section className="sf-card">
              <div className="sf-card-head">
                <div>
                  <div className="sf-eyebrow">Execution Artifacts</div>
                  <h2>Generated outputs and external renderer returns</h2>
                </div>
                <div className="sf-branch-pill">{runtime.artifacts.length} artifacts</div>
              </div>

              <div className="sf-stack">
                {runtime.artifacts.map((artifact) => {
                  const publicUrl = artifact.public_url ?? "";
                  const mimeType = artifact.mime_type ?? "metadata";
                  const isImage = mimeType.startsWith("image/");
                  const isVideo = mimeType.startsWith("video/");
                  const isDataUrl = publicUrl.startsWith("data:");

                  return (
                    <div className="sf-row-card artifact-card" key={artifact.id}>
                      <div className="sf-row">
                        <strong>{artifact.artifact_type}</strong>
                        <span>{mimeType}</span>
                      </div>

                      {publicUrl ? (
                        <>
                          {isImage ? (
                            <div className="sf-artifact-preview">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={publicUrl}
                                alt={`${artifact.artifact_type} artifact`}
                                className="sf-artifact-image"
                              />
                            </div>
                          ) : null}

                          {isVideo ? (
                            <div className="sf-artifact-preview">
                              <video
                                src={publicUrl}
                                controls
                                playsInline
                                className="sf-artifact-video"
                              />
                            </div>
                          ) : null}

                          {!isImage && !isVideo ? (
                            <div className="sf-artifact-meta">
                              <p className="sf-break">
                                {isDataUrl ? "Inline artifact payload persisted." : publicUrl}
                              </p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p>Execution packet persisted without a public media URL.</p>
                      )}
                    </div>
                  );
                })}

                {runtime.artifacts.length === 0 ? (
                  <p className="sf-muted">No execution artifacts yet. Execute the latest render packet to create one.</p>
                ) : null}
              </div>
            </section>

          </>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="sf-metric">
      <div className="sf-metric-value">{value}</div>
      <div className="sf-metric-label">{label}</div>
    </div>
  );
}

function ContradictionCard({
  item,
  busy,
  onResolve
}: {
  item: RuntimeContradiction;
  busy: string | null;
  onResolve: () => void;
}) {
  return (
    <div className="sf-row-card danger">
      <div className="sf-row">
        <strong>{item.contradiction_type}</strong>
        <span>{item.severity}</span>
      </div>
      <p>{item.summary}</p>
      <button className="sf-mini" onClick={onResolve} disabled={Boolean(busy)}>
        {busy === `repair:${item.id}` ? "Repairing..." : "Resolve with Repair Lineage"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { RuntimeState } from "@/lib/runtime/types";

type ApiRuntimeResponse = {
  ok: boolean;
  state?: RuntimeState;
  error?: string;
};

export default function Page() {
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [sceneText, setSceneText] = useState(
    "Elena enters the flooded transit corridor while protecting the yellow courier case."
  );
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRuntime() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/runtime", {
        cache: "no-store"
      });

      const data = (await response.json()) as ApiRuntimeResponse;

      if (!data.ok || !data.state) {
        throw new Error(data.error || "Unable to load runtime");
      }

      setRuntime(data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown load error");
    } finally {
      setLoading(false);
    }
  }

  async function compileScene() {
    const clean = sceneText.trim();
    if (!clean) return;

    setCompiling(true);
    setError(null);

    try {
      const response = await fetch("/api/runtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sceneText: clean })
      });

      const data = (await response.json()) as ApiRuntimeResponse;

      if (!data.ok || !data.state) {
        throw new Error(data.error || "Unable to compile scene");
      }

      setRuntime(data.state);
      setSceneText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown compile error");
    } finally {
      setCompiling(false);
    }
  }

  useEffect(() => {
    void loadRuntime();
  }, []);

  const latestDiff = runtime?.continuityDiffs?.[0] ?? null;
  const latestJob = runtime?.renderJobs?.[0] ?? null;

  const worldState = useMemo(() => {
    if (!runtime?.world?.state) return {};
    return runtime.world.state;
  }, [runtime]);

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>
        <p className="sf-muted">Supabase-backed governed synthetic runtime.</p>

        <nav className="sf-nav">
          {[
            "Runtime",
            "Scene Mutation",
            "Continuity Diff",
            "Render Jobs",
            "Characters",
            "Lineage"
          ].map((item, index) => (
            <div className="sf-nav-item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </nav>

        <button className="sf-secondary" onClick={() => void loadRuntime()}>
          Refresh Runtime
        </button>
      </aside>

      <section className="sf-main">
        <header className="sf-top">
          <div>
            <div className="sf-eyebrow">SolaceFrame V12 · Supabase Runtime</div>
            <h1 className="sf-title">
              State, mutation, lineage, and render jobs now exist in the database.
            </h1>
          </div>

          <div className="sf-status">
            {loading ? "Loading runtime" : "Runtime backed by solaceframe schema"}
          </div>
        </header>

        {error ? <div className="sf-error">{error}</div> : null}

        {!runtime && !loading ? (
          <section className="sf-card">
            <h2>Runtime unavailable</h2>
            <p className="sf-muted">
              Confirm the Supabase migration has been run and the Vercel environment variables are set.
            </p>
          </section>
        ) : null}

        {runtime ? (
          <>
            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Scene Mutation Engine</div>
                <textarea
                  className="sf-textarea"
                  value={sceneText}
                  onChange={(event) => setSceneText(event.target.value)}
                  placeholder="Describe the next scene..."
                />

                <button className="sf-primary" onClick={() => void compileScene()} disabled={compiling}>
                  {compiling ? "Compiling..." : "Compile Scene Into Runtime"}
                </button>

                <div className="sf-muted">
                  This writes a scene, mutates world and character state, creates a continuity diff,
                  appends lineage, and queues a render job.
                </div>
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">World State</div>
                <h2>{runtime.world.name}</h2>
                <div className="sf-meter">
                  <div className="sf-meter-fill" style={{ width: `${runtime.world.pressure}%` }} />
                </div>
                <div className="sf-big">{runtime.world.pressure}%</div>
                <pre className="sf-code">{JSON.stringify(worldState, null, 2)}</pre>
              </section>
            </div>

            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Character Runtime Memory</div>
                <div className="sf-stack">
                  {runtime.characters.map((character) => (
                    <div className="sf-row-card" key={character.id}>
                      <div className="sf-row">
                        <strong>{character.name}</strong>
                        <span>{character.continuity_score}% continuity</span>
                      </div>
                      <div className="sf-muted">{character.role}</div>
                      <pre className="sf-code small">{JSON.stringify(character.state, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </section>

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
            </div>

            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Render Jobs</div>
                <div className="sf-stack">
                  {runtime.renderJobs.map((job) => (
                    <div className="sf-row-card" key={job.id}>
                      <div className="sf-row">
                        <strong>{job.status}</strong>
                        <span>{new Date(job.created_at).toLocaleString()}</span>
                      </div>
                      <p>{job.prompt}</p>
                    </div>
                  ))}
                  {runtime.renderJobs.length === 0 ? <p className="sf-muted">No render jobs yet.</p> : null}
                </div>
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">Lineage Events</div>
                <div className="sf-stack">
                  {runtime.lineageEvents.map((event) => (
                    <div className="sf-row-card" key={event.id}>
                      <div className="sf-row">
                        <strong>{event.event_type}</strong>
                        <span>{new Date(event.created_at).toLocaleString()}</span>
                      </div>
                      <p>{event.summary}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="sf-card">
              <div className="sf-eyebrow">Latest Render Packet</div>
              {latestJob ? (
                <pre className="sf-code">{JSON.stringify(latestJob.packet, null, 2)}</pre>
              ) : (
                <p className="sf-muted">No packet queued yet.</p>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

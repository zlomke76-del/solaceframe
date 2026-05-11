"use client";

import { useEffect, useMemo, useState } from "react";
import type { RuntimeState } from "@/lib/runtime/types";

type ApiRuntimeResponse = {
  ok: boolean;
  state?: RuntimeState;
  error?: string;
  message?: string;
};

export default function Page() {
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [sceneText, setSceneText] = useState(
    "Elena crosses the damaged eastern bridge while hiding her left-arm injury and protecting the yellow courier case."
  );
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
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

  async function compileScene() {
    const clean = sceneText.trim();
    if (!clean) return;

    setCompiling(true);
    setError(null);

    try {
      const response = await fetch("/api/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneText: clean })
      });

      const data = (await response.json()) as ApiRuntimeResponse;

      if (!data.ok || !data.state) {
        throw new Error(data.error || data.message || "Unable to compile scene");
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

  const worldState = useMemo(() => runtime?.world?.state ?? {}, [runtime]);
  const latestDiff = runtime?.continuityDiffs?.[0] ?? null;
  const latestJob = runtime?.renderJobs?.[0] ?? null;
  const unresolvedContradictions = runtime?.contradictions?.filter((item) => !item.resolved) ?? [];

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>
        <p className="sf-muted">Causal continuity runtime backed by Supabase.</p>

        <nav className="sf-nav">
          {[
            "Runtime",
            "Causality",
            "Contradictions",
            "World State",
            "Characters",
            "Render Packet"
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
            <div className="sf-eyebrow">SolaceFrame V13 · Causal Runtime</div>
            <h1 className="sf-title">
              Scenes now create causal events that constrain future renders.
            </h1>
          </div>

          <div className="sf-status">
            {loading ? "Loading runtime" : "Causality layer active"}
          </div>
        </header>

        {error ? <div className="sf-error">{error}</div> : null}

        {runtime ? (
          <>
            <div className="sf-grid">
              <section className="sf-card">
                <div className="sf-eyebrow">Causal Scene Compiler</div>
                <textarea
                  className="sf-textarea"
                  value={sceneText}
                  onChange={(event) => setSceneText(event.target.value)}
                  placeholder="Describe the next scene..."
                />

                <button className="sf-primary" onClick={() => void compileScene()} disabled={compiling}>
                  {compiling ? "Compiling Causality..." : "Compile Causal Scene"}
                </button>

                <p className="sf-muted">
                  This creates scene state, causal events, contradictions, continuity diffs,
                  branch divergence, lineage, and a render job packet.
                </p>
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">World / Branch Pressure</div>
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
                <div className="sf-eyebrow">Causal Events</div>
                <div className="sf-stack">
                  {runtime.causalEvents.map((event) => (
                    <div className="sf-row-card" key={event.id}>
                      <div className="sf-row">
                        <strong>{event.event_type}</strong>
                        <span>severity {event.severity}</span>
                      </div>
                      <p>{event.subject} → {event.predicate} {event.object_ref ? `→ ${event.object_ref}` : ""}</p>
                    </div>
                  ))}
                  {runtime.causalEvents.length === 0 ? <p className="sf-muted">No causal events yet.</p> : null}
                </div>
              </section>

              <section className="sf-card">
                <div className="sf-eyebrow">Unresolved Contradictions</div>
                <div className="sf-stack">
                  {unresolvedContradictions.map((item) => (
                    <div className="sf-row-card danger" key={item.id}>
                      <div className="sf-row">
                        <strong>{item.contradiction_type}</strong>
                        <span>{item.severity}</span>
                      </div>
                      <p>{item.summary}</p>
                    </div>
                  ))}
                  {unresolvedContradictions.length === 0 ? <p className="sf-muted">No unresolved contradictions.</p> : null}
                </div>
              </section>
            </div>

            <div className="sf-grid">
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

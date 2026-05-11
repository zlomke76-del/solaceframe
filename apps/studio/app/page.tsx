import { realityBranches } from "../lib/branches/branch-engine";
import { activeDriftReport } from "../lib/continuity/drift-detector";
import { activeMemorySummary } from "../lib/continuity/memory-compression";
import { sceneStates } from "../lib/scenes/scene-state-engine";
import { timeline } from "../lib/timeline/timeline-engine";

const navItems = [
  "Scene State",
  "Characters",
  "Worlds",
  "Timeline",
  "Branches",
  "Drift",
  "Memory",
  "Provenance"
];

const metrics = [
  {
    label: "Continuity score",
    value: `${Math.round(activeDriftReport.score * 100)}%`
  },
  {
    label: "Active scenes",
    value: String(sceneStates.length)
  },
  {
    label: "Timeline events",
    value: String(timeline.length)
  },
  {
    label: "Reality branches",
    value: String(realityBranches.length)
  }
];

export default function Page() {
  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>
        <p className="sf-muted">
          Governed synthetic media with persistent causal continuity.
        </p>

        <nav className="sf-nav">
          {navItems.map((item, index) => (
            <div className="sf-nav-item" key={item}>
              <span className="sf-nav-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </nav>
      </aside>

      <section className="sf-main">
        <div className="sf-topbar">
          <div>
            <div className="sf-eyebrow">SolaceFrame V5 · Living Continuity Engine</div>
            <h1 className="sf-title">
              Persistent synthetic worlds where consequences survive the next render.
            </h1>
          </div>

          <div className="sf-status-pill">
            <span className="sf-pulse" />
            <span>State evolution active</span>
          </div>
        </div>

        <div className="sf-grid">
          <section className="sf-card sf-card-pad">
            <div className="sf-eyebrow">Scene State Engine</div>
            <h2 className="sf-card-title">Causal persistence is now part of the generation context.</h2>
            <p className="sf-muted">
              V5 tracks scene consequences, unresolved tensions, branch state, and next-generation constraints before future renders are prepared.
            </p>

            <div className="sf-metrics">
              {metrics.map((metric) => (
                <div className="sf-metric" key={metric.label}>
                  <div className="sf-metric-value">{metric.value}</div>
                  <div className="sf-metric-label">{metric.label}</div>
                </div>
              ))}
            </div>

            <div className="sf-scene-stack">
              {sceneStates.map((scene) => (
                <div className="sf-scene-row" key={scene.id}>
                  <strong>{scene.title}</strong>
                  <div>
                    <div>{scene.summary}</div>
                    <div className="sf-consequence">
                      Consequences: {scene.consequences.join(", ")}
                    </div>
                  </div>
                  <span className="sf-tag">{scene.admissibility}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="sf-side-stack">
            <section className="sf-card sf-card-pad">
              <div className="sf-eyebrow">Continuity Drift</div>
              <h2 className="sf-card-title">
                {activeDriftReport.status.replace("-", " ")}
              </h2>
              <div className="sf-bar">
                <div
                  className="sf-bar-fill"
                  style={{ width: `${Math.round(activeDriftReport.score * 100)}%` }}
                />
              </div>

              <div className="sf-branch-list">
                {activeDriftReport.signals.map((signal) => (
                  <div className="sf-branch" key={signal.message}>
                    <div className="sf-branch-top">
                      <strong>{signal.type}</strong>
                      <span className="sf-muted">{signal.severity}</span>
                    </div>
                    <div className="sf-muted">{signal.message}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="sf-card sf-card-pad">
              <div className="sf-eyebrow">Reality Branches</div>
              <div className="sf-branch-list">
                {realityBranches.map((branch) => (
                  <div className="sf-branch" key={branch.id}>
                    <div className="sf-branch-top">
                      <strong>{branch.name}</strong>
                      <span className="sf-muted">
                        {Math.round(branch.continuityIntegrity * 100)}%
                      </span>
                    </div>
                    <div className="sf-muted">{branch.status}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="sf-card sf-card-pad">
              <div className="sf-eyebrow">Compressed Memory</div>
              <div className="sf-memory-box">
                {activeMemorySummary.summary}
                <br />
                <br />
                <strong>Next constraints:</strong>
                <br />
                {activeMemorySummary.nextGenerationConstraints.join(" ")}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";

const relationshipGraph = [
  { from: "Elena", to: "Ren", state: "trust degraded", weight: 72 },
  { from: "Ren", to: "Courier Network", state: "unverified authority", weight: 54 },
  { from: "Elena", to: "Bridge Incident", state: "survivor linkage", weight: 81 }
];

const unresolved = [
  "Origin file authenticity unresolved",
  "Bridge sabotage actor unidentified",
  "Timeline repair request pending",
  "Courier chain integrity degraded"
];

const renderQueue = [
  {
    id: "RQ-1042",
    scene: "Bridge traversal sequence",
    status: "Awaiting governance review",
    admissibility: "conditional"
  },
  {
    id: "RQ-1043",
    scene: "Safehouse dialogue continuity pass",
    status: "Ready for render",
    admissibility: "allow"
  }
];

const branchStates = [
  { branch: "Prime", divergence: 8, pressure: 32 },
  { branch: "Alternate", divergence: 46, pressure: 67 },
  { branch: "Review", divergence: 21, pressure: 58 }
];

const objectLineage = [
  {
    object: "Yellow Courier Case",
    ancestry: "market-transfer → bridge-event → safehouse-chain"
  },
  {
    object: "Encrypted Source File",
    ancestry: "unknown-origin → Ren custody → withheld-state"
  }
];

export default function Page() {
  const [scene, setScene] = useState(
    "Elena requests a continuity repair while attempting to preserve the courier chain."
  );

  const governance = useMemo(() => {
    const lower = scene.toLowerCase();

    const preserved = [];
    const violations = [];
    const tensions = [];

    if (lower.includes("repair")) {
      tensions.push("timeline repair requested");
    }

    if (lower.includes("reset")) {
      violations.push("relationship reset violates persistent continuity");
    }

    if (lower.includes("kill") || lower.includes("destroy")) {
      violations.push("irreversible branch mutation detected");
    }

    if (lower.includes("courier")) {
      preserved.push("persistent courier lineage preserved");
    }

    if (lower.includes("elena")) {
      preserved.push("identity anchor retained");
    }

    return {
      admissible: violations.length === 0,
      preserved,
      violations,
      tensions,
      drift:
        violations.length > 0
          ? "high"
          : tensions.length > 0
          ? "medium"
          : "low"
    };
  }, [scene]);

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>

        <div className="sf-nav">
          {[
            "Living World",
            "Governance",
            "Relationship Graph",
            "Render Queue",
            "Branches",
            "Lineage"
          ].map((item, index) => (
            <div key={item} className="sf-nav-item">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="sf-main">
        <div className="sf-top">
          <div>
            <div className="sf-eyebrow">SolaceFrame V8 · Governance Native Creation</div>
            <h1 className="sf-title">
              Synthetic worlds that explain why continuity survives.
            </h1>
          </div>

          <div className="sf-status">Governance reasoning active</div>
        </div>

        <div className="sf-grid">
          <section className="sf-card">
            <div className="sf-eyebrow">Continuity Input</div>

            <textarea
              className="sf-textarea"
              value={scene}
              onChange={(e) => setScene(e.target.value)}
            />

            <div className="sf-governance">
              <div className="sf-governance-block">
                <h3>Preserved Constraints</h3>
                {governance.preserved.map((item) => (
                  <div key={item} className="sf-chip green">{item}</div>
                ))}
              </div>

              <div className="sf-governance-block">
                <h3>Violations</h3>
                {governance.violations.length === 0 ? (
                  <div className="sf-chip">No violations detected</div>
                ) : (
                  governance.violations.map((item) => (
                    <div key={item} className="sf-chip red">{item}</div>
                  ))
                )}
              </div>

              <div className="sf-governance-block">
                <h3>Unresolved Tensions</h3>
                {governance.tensions.length === 0 ? (
                  <div className="sf-chip">Stable continuity</div>
                ) : (
                  governance.tensions.map((item) => (
                    <div key={item} className="sf-chip yellow">{item}</div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="sf-card">
            <div className="sf-eyebrow">Relationship Graph</div>

            <div className="sf-list">
              {relationshipGraph.map((edge) => (
                <div key={edge.from + edge.to} className="sf-row">
                  <div>
                    <strong>{edge.from}</strong> → <strong>{edge.to}</strong>
                    <p>{edge.state}</p>
                  </div>
                  <span>{edge.weight}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sf-grid lower">
          <section className="sf-card">
            <div className="sf-eyebrow">Branch Divergence</div>

            {branchStates.map((branch) => (
              <div key={branch.branch} className="sf-branch">
                <div className="sf-row">
                  <strong>{branch.branch}</strong>
                  <span>{branch.divergence}% divergence</span>
                </div>

                <div className="sf-bar">
                  <div
                    className="sf-fill"
                    style={{ width: `${branch.divergence}%` }}
                  />
                </div>

                <small>Pressure: {branch.pressure}%</small>
              </div>
            ))}
          </section>

          <section className="sf-card">
            <div className="sf-eyebrow">Render Queue</div>

            <div className="sf-list">
              {renderQueue.map((item) => (
                <div key={item.id} className="sf-row">
                  <div>
                    <strong>{item.scene}</strong>
                    <p>{item.status}</p>
                  </div>
                  <span>{item.admissibility}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="sf-card">
          <div className="sf-eyebrow">Object Lineage</div>

          <div className="sf-list">
            {objectLineage.map((item) => (
              <div key={item.object} className="sf-row">
                <div>
                  <strong>{item.object}</strong>
                  <p>{item.ancestry}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sf-card">
          <div className="sf-eyebrow">Unresolved Contradictions</div>

          <div className="sf-chip-wrap">
            {unresolved.map((item) => (
              <div key={item} className="sf-chip red">{item}</div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

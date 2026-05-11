"use client";

import { useMemo, useState } from "react";

const worldNodes = [
  { name: "Safehouse", status: "stable", x: "18%", y: "28%" },
  { name: "Eastern Bridge", status: "damaged", x: "58%", y: "42%" },
  { name: "Blackout Zone", status: "restricted", x: "76%", y: "24%" },
  { name: "Transit Hub", status: "active", x: "42%", y: "70%" }
];

const dependencyGraph = [
  {
    id: "scene-001",
    title: "Bridge Collapse",
    dependsOn: [],
    impact: "irreversible"
  },
  {
    id: "scene-002",
    title: "Courier Transfer",
    dependsOn: ["scene-001"],
    impact: "persistent-object"
  },
  {
    id: "scene-003",
    title: "Source File Withheld",
    dependsOn: ["scene-002"],
    impact: "relationship-fracture"
  }
];

const cameraContinuity = [
  {
    category: "Lighting continuity",
    state: "stable",
    note: "Cold rain + blue ambient preserved"
  },
  {
    category: "Wardrobe continuity",
    state: "warning",
    note: "Elena sleeve damage mismatch detected"
  },
  {
    category: "Object placement",
    state: "stable",
    note: "Courier case retained across shots"
  },
  {
    category: "Emotional continuity",
    state: "conditional",
    note: "Trust degradation unresolved"
  }
];

export default function Page() {
  const [repairRequest, setRepairRequest] = useState(
    "Repair timeline contradiction while preserving Elena's injury continuity."
  );

  const repairAnalysis = useMemo(() => {
    const lower = repairRequest.toLowerCase();

    const repairs = [];
    const risks = [];
    const preserved = [];

    if (lower.includes("repair")) {
      repairs.push("Timeline repair pathway generated");
    }

    if (lower.includes("preserve")) {
      preserved.push("Identity continuity retained");
    }

    if (lower.includes("injury")) {
      preserved.push("Physical state continuity maintained");
    }

    if (lower.includes("reset")) {
      risks.push("State reset would invalidate causal continuity");
    }

    if (lower.includes("merge")) {
      risks.push("Branch merge requires admissibility recomputation");
    }

    return {
      repairs,
      risks,
      preserved,
      admissible: risks.length === 0
    };
  }, [repairRequest]);

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>

        <div className="sf-nav">
          {[
            "Spatial Continuity",
            "Timeline Repair",
            "Scene Dependencies",
            "Camera Memory",
            "Branch Merge",
            "World Map"
          ].map((item, index) => (
            <div className="sf-nav-item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="sf-note">
          V9 introduces spatial + temporal continuity infrastructure.
        </div>
      </aside>

      <section className="sf-main">
        <div className="sf-top">
          <div>
            <div className="sf-eyebrow">SolaceFrame V9 · Spatial + Temporal Continuity</div>
            <h1 className="sf-title">
              Govern worlds across time, space, and consequence propagation.
            </h1>
          </div>

          <div className="sf-status">
            Timeline integrity synchronized
          </div>
        </div>

        <div className="sf-grid">
          <section className="sf-card">
            <div className="sf-eyebrow">World State Map</div>

            <div className="sf-map">
              {worldNodes.map((node) => (
                <div
                  key={node.name}
                  className={`sf-map-node ${node.status}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <span>{node.name}</span>
                </div>
              ))}
            </div>

            <div className="sf-map-legend">
              <div><span className="dot stable" /> Stable</div>
              <div><span className="dot damaged" /> Damaged</div>
              <div><span className="dot restricted" /> Restricted</div>
            </div>
          </section>

          <section className="sf-card">
            <div className="sf-eyebrow">Scene Dependency Graph</div>

            <div className="sf-stack">
              {dependencyGraph.map((scene) => (
                <div key={scene.id} className="sf-dependency">
                  <div className="sf-row">
                    <strong>{scene.title}</strong>
                    <span>{scene.impact}</span>
                  </div>

                  <div className="sf-dep-id">{scene.id}</div>

                  {scene.dependsOn.length > 0 && (
                    <div className="sf-chip-wrap">
                      {scene.dependsOn.map((dep) => (
                        <div key={dep} className="sf-chip">
                          depends on {dep}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sf-grid lower">
          <section className="sf-card">
            <div className="sf-eyebrow">Camera Continuity Memory</div>

            <div className="sf-stack">
              {cameraContinuity.map((item) => (
                <div className="sf-camera-row" key={item.category}>
                  <div>
                    <strong>{item.category}</strong>
                    <p>{item.note}</p>
                  </div>

                  <div className={`sf-badge ${item.state}`}>
                    {item.state}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sf-card">
            <div className="sf-eyebrow">Timeline Repair Engine</div>

            <textarea
              className="sf-textarea"
              value={repairRequest}
              onChange={(e) => setRepairRequest(e.target.value)}
            />

            <div className="sf-analysis-grid">
              <div>
                <h3>Repair Actions</h3>

                <div className="sf-chip-wrap">
                  {repairAnalysis.repairs.map((item) => (
                    <div key={item} className="sf-chip green">{item}</div>
                  ))}
                </div>
              </div>

              <div>
                <h3>Preserved State</h3>

                <div className="sf-chip-wrap">
                  {repairAnalysis.preserved.map((item) => (
                    <div key={item} className="sf-chip blue">{item}</div>
                  ))}
                </div>
              </div>

              <div>
                <h3>Governance Risks</h3>

                <div className="sf-chip-wrap">
                  {repairAnalysis.risks.length === 0 ? (
                    <div className="sf-chip">No critical violations</div>
                  ) : (
                    repairAnalysis.risks.map((item) => (
                      <div key={item} className="sf-chip red">{item}</div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="sf-footer-status">
              {repairAnalysis.admissible
                ? "Repair pathway admissible"
                : "Repair requires operator arbitration"}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

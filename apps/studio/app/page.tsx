"use client";

import { useMemo, useState } from "react";

type BranchMode = "prime" | "alternate" | "review";

type SceneEvent = {
  id: string;
  text: string;
  branch: BranchMode;
  timestamp: string;
  admissibility: "allow" | "conditional" | "blocked";
  driftRisk: "low" | "medium" | "high";
  affectedCharacters: string[];
  affectedWorldState: string[];
  consequences: string[];
  preserve: string[];
};

const seedEvents: SceneEvent[] = [
  {
    id: "scene-001",
    text: "Elena exits the lower market while the eastern bridge fails behind her.",
    branch: "prime",
    timestamp: "T+00:01",
    admissibility: "allow",
    driftRisk: "low",
    affectedCharacters: ["Elena Voss"],
    affectedWorldState: ["Eastern bridge damaged", "Cold rain begins"],
    consequences: ["left-arm injury", "transit reroute"],
    preserve: ["yellow courier case", "damaged bridge", "left-arm injury"]
  },
  {
    id: "scene-002",
    text: "Ren withholds the origin file from Elena before the safehouse transfer.",
    branch: "prime",
    timestamp: "T+00:02",
    admissibility: "conditional",
    driftRisk: "medium",
    affectedCharacters: ["Elena Voss", "Ren Kaito"],
    affectedWorldState: ["Trust state degraded"],
    consequences: ["trust fracture with Ren", "source authority unresolved"],
    preserve: ["withheld file", "degraded trust", "yellow courier case"]
  }
];

const basePreservation = [
  "Elena must retain her left-arm injury until explicitly healed.",
  "Eastern bridge damage must remain visible or be narratively repaired.",
  "Ren and Elena cannot reset to neutral trust.",
  "The yellow courier case remains a persistent object."
];

function analyzeScene(text: string, branch: BranchMode, index: number): SceneEvent {
  const normalized = text.toLowerCase();

  const affectedCharacters = new Set<string>();
  const affectedWorldState = new Set<string>();
  const consequences = new Set<string>();
  const preserve = new Set<string>(basePreservation);

  if (normalized.includes("elena")) affectedCharacters.add("Elena Voss");
  if (normalized.includes("ren")) affectedCharacters.add("Ren Kaito");
  if (normalized.includes("bridge")) {
    affectedWorldState.add("Eastern bridge state referenced");
    consequences.add("bridge continuity must be preserved");
    preserve.add("damaged bridge");
  }
  if (normalized.includes("injury") || normalized.includes("arm")) {
    affectedCharacters.add("Elena Voss");
    consequences.add("injury continuity active");
    preserve.add("left-arm injury");
  }
  if (normalized.includes("case") || normalized.includes("courier")) {
    affectedWorldState.add("Persistent object referenced");
    preserve.add("yellow courier case");
  }
  if (normalized.includes("trust") || normalized.includes("withhold") || normalized.includes("betray")) {
    affectedCharacters.add("Elena Voss");
    affectedCharacters.add("Ren Kaito");
    consequences.add("relationship state changes");
    preserve.add("degraded trust with Ren");
  }
  if (normalized.includes("heal") || normalized.includes("repair")) {
    consequences.add("state repair requested");
  }
  if (normalized.includes("kill") || normalized.includes("death") || normalized.includes("destroy")) {
    consequences.add("irreversible consequence requested");
  }

  if (affectedCharacters.size === 0) affectedCharacters.add("Elena Voss");
  if (affectedWorldState.size === 0) affectedWorldState.add("Prime world state referenced");
  if (consequences.size === 0) consequences.add("new scene memory added");

  const hasIrreversible = normalized.includes("kill") || normalized.includes("death") || normalized.includes("destroy");
  const hasRepair = normalized.includes("heal") || normalized.includes("repair") || normalized.includes("reset");
  const admissibility = hasIrreversible || branch === "review" ? "conditional" : hasRepair ? "conditional" : "allow";
  const driftRisk = hasIrreversible || normalized.includes("reset") ? "high" : branch === "alternate" || hasRepair ? "medium" : "low";

  return {
    id: `scene-${String(index).padStart(3, "0")}`,
    text,
    branch,
    timestamp: `T+00:${String(index).padStart(2, "0")}`,
    admissibility,
    driftRisk,
    affectedCharacters: Array.from(affectedCharacters),
    affectedWorldState: Array.from(affectedWorldState),
    consequences: Array.from(consequences),
    preserve: Array.from(preserve)
  };
}

export default function Page() {
  const [sceneText, setSceneText] = useState("Elena enters the damaged bridge after the explosion, carrying the yellow courier case while hiding her left-arm injury from Ren.");
  const [branch, setBranch] = useState<BranchMode>("prime");
  const [events, setEvents] = useState<SceneEvent[]>(seedEvents);
  const [selectedId, setSelectedId] = useState(seedEvents[seedEvents.length - 1].id);

  const preview = useMemo(
    () => analyzeScene(sceneText, branch, events.length + 1),
    [sceneText, branch, events.length]
  );

  const selectedEvent = events.find((event) => event.id === selectedId) ?? events[events.length - 1];

  const activePacket = {
    mode: "video_scene",
    branch: preview.branch,
    scene: preview.text,
    preserve: preview.preserve,
    affectedCharacters: preview.affectedCharacters,
    affectedWorldState: preview.affectedWorldState,
    consequences: preview.consequences,
    admissibility: preview.admissibility,
    driftRisk: preview.driftRisk,
    nextAction:
      preview.admissibility === "allow"
        ? "prepare_render_packet"
        : "operator_review_required"
  };

  function submitScene() {
    const cleanText = sceneText.trim();
    if (!cleanText) return;

    const next = analyzeScene(cleanText, branch, events.length + 1);
    setEvents((current) => [...current, next]);
    setSelectedId(next.id);
    setSceneText("");
  }

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>
        <p className="sf-muted">
          Describe a scene. SolaceFrame preserves the world.
        </p>

        <nav className="sf-nav">
          {[
            "Continuity Compiler",
            "Scene Impact",
            "Generation Packet",
            "Timeline",
            "Branches",
            "Provenance"
          ].map((item, index) => (
            <div className="sf-nav-item" key={item}>
              <span className="sf-nav-index">{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </nav>

        <div className="sf-side-note">
          <strong>V6 shift:</strong>
          <span>
            State no longer just displays. It responds to user-authored scene events.
          </span>
        </div>
      </aside>

      <section className="sf-main">
        <div className="sf-topbar">
          <div>
            <div className="sf-eyebrow">SolaceFrame V6 · Continuity Compiler</div>
            <h1 className="sf-title">
              Interactive scene events that carry consequences forward.
            </h1>
          </div>

          <div className="sf-status-pill">
            <span className="sf-pulse" />
            <span>Interactive state active</span>
          </div>
        </div>

        <div className="sf-grid">
          <section className="sf-card sf-card-pad sf-compiler">
            <div className="sf-eyebrow">Create Scene Event</div>
            <h2 className="sf-card-title">Enter a scene. The continuity engine compiles its impact.</h2>

            <textarea
              className="sf-textarea"
              value={sceneText}
              onChange={(event) => setSceneText(event.target.value)}
              placeholder="Describe what happens next..."
            />

            <div className="sf-control-row">
              <label className="sf-select-label">
                Branch mode
                <select
                  className="sf-select"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value as BranchMode)}
                >
                  <option value="prime">Prime continuity</option>
                  <option value="alternate">Alternate branch</option>
                  <option value="review">Operator review branch</option>
                </select>
              </label>

              <button className="sf-button" onClick={submitScene}>
                Compile scene into continuity
              </button>
            </div>

            <div className="sf-metrics">
              <div className="sf-metric">
                <div className="sf-metric-value">{preview.admissibility}</div>
                <div className="sf-metric-label">Admissibility</div>
              </div>
              <div className="sf-metric">
                <div className="sf-metric-value">{preview.driftRisk}</div>
                <div className="sf-metric-label">Drift risk</div>
              </div>
              <div className="sf-metric">
                <div className="sf-metric-value">{preview.affectedCharacters.length}</div>
                <div className="sf-metric-label">Characters affected</div>
              </div>
              <div className="sf-metric">
                <div className="sf-metric-value">{preview.consequences.length}</div>
                <div className="sf-metric-label">Consequences</div>
              </div>
            </div>

            <div className="sf-impact-grid">
              <div className="sf-mini-card">
                <div className="sf-eyebrow">Affected Characters</div>
                {preview.affectedCharacters.map((item) => (
                  <span className="sf-chip" key={item}>{item}</span>
                ))}
              </div>

              <div className="sf-mini-card">
                <div className="sf-eyebrow">World Impact</div>
                {preview.affectedWorldState.map((item) => (
                  <span className="sf-chip" key={item}>{item}</span>
                ))}
              </div>

              <div className="sf-mini-card">
                <div className="sf-eyebrow">Preserve</div>
                {preview.preserve.slice(0, 5).map((item) => (
                  <span className="sf-chip" key={item}>{item}</span>
                ))}
              </div>

              <div className="sf-mini-card">
                <div className="sf-eyebrow">Consequences</div>
                {preview.consequences.map((item) => (
                  <span className="sf-chip" key={item}>{item}</span>
                ))}
              </div>
            </div>
          </section>

          <aside className="sf-side-stack">
            <section className="sf-card sf-card-pad">
              <div className="sf-eyebrow">Generation Packet Preview</div>
              <pre className="sf-code">{JSON.stringify(activePacket, null, 2)}</pre>
            </section>

            <section className="sf-card sf-card-pad">
              <div className="sf-eyebrow">Selected Scene State</div>
              <h3 className="sf-card-title sf-small-title">{selectedEvent.title ?? selectedEvent.id}</h3>
              <p className="sf-muted">{selectedEvent.text}</p>

              <div className="sf-scene-stack">
                <div className="sf-scene-row compact">
                  <strong>{selectedEvent.admissibility}</strong>
                  <span className="sf-muted">admissibility</span>
                  <span className="sf-tag">{selectedEvent.driftRisk}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="sf-card sf-card-pad sf-timeline">
          <div className="sf-eyebrow">Scene State Timeline</div>

          <div className="sf-timeline-grid">
            {events.map((event) => (
              <button
                key={event.id}
                className={`sf-timeline-card ${selectedId === event.id ? "active" : ""}`}
                onClick={() => setSelectedId(event.id)}
              >
                <div className="sf-timeline-top">
                  <strong>{event.id}</strong>
                  <span>{event.timestamp}</span>
                </div>
                <p>{event.text}</p>
                <div className="sf-timeline-tags">
                  <span>{event.branch}</span>
                  <span>{event.admissibility}</span>
                  <span>{event.driftRisk}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";

type BranchMode = "prime" | "alternate" | "review";
type Admissibility = "allow" | "conditional" | "blocked";
type DriftRisk = "low" | "medium" | "high";

type SceneEvent = {
  id: string;
  text: string;
  branch: BranchMode;
  timestamp: string;
  admissibility: Admissibility;
  driftRisk: DriftRisk;
  affectedCharacters: string[];
  affectedWorldState: string[];
  consequences: string[];
  preserve: string[];
};

type CharacterState = {
  id: string;
  name: string;
  role: string;
  condition: string[];
  carriedObjects: string[];
  relationships: Record<string, string>;
  continuity: number;
  pressure: number;
};

type WorldState = {
  name: string;
  weather: string;
  damagedLocations: string[];
  persistentObjects: string[];
  unresolvedTensions: string[];
  continuityPressure: number;
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

const baseCharacters: CharacterState[] = [
  {
    id: "elena",
    name: "Elena Voss",
    role: "Primary continuity anchor",
    condition: ["left-arm injury"],
    carriedObjects: ["yellow courier case"],
    relationships: { "Ren Kaito": "trust degraded" },
    continuity: 96,
    pressure: 22
  },
  {
    id: "ren",
    name: "Ren Kaito",
    role: "Unverified source holder",
    condition: ["withholding origin file"],
    carriedObjects: ["encrypted source file"],
    relationships: { "Elena Voss": "withholding information" },
    continuity: 91,
    pressure: 36
  }
];

const baseWorld: WorldState = {
  name: "Neon District 7",
  weather: "cold rain",
  damagedLocations: ["eastern bridge"],
  persistentObjects: ["yellow courier case", "encrypted source file"],
  unresolvedTensions: ["source authority unresolved", "unknown actor triggered bridge failure"],
  continuityPressure: 28
};

const basePreservation = [
  "Elena must retain her left-arm injury until explicitly healed.",
  "Eastern bridge damage must remain visible or be narratively repaired.",
  "Ren and Elena cannot reset to neutral trust.",
  "The yellow courier case remains a persistent object."
];

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

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

  if (normalized.includes("file") || normalized.includes("source")) {
    affectedWorldState.add("Source file referenced");
    consequences.add("source authority remains unresolved");
    preserve.add("encrypted source file");
  }

  if (normalized.includes("trust") || normalized.includes("withhold") || normalized.includes("betray") || normalized.includes("hide")) {
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

  if (normalized.includes("rain") || normalized.includes("storm")) {
    affectedWorldState.add("Weather state intensified");
    consequences.add("weather continuity updated");
  }

  if (affectedCharacters.size === 0) affectedCharacters.add("Elena Voss");
  if (affectedWorldState.size === 0) affectedWorldState.add("Prime world state referenced");
  if (consequences.size === 0) consequences.add("new scene memory added");

  const hasIrreversible = normalized.includes("kill") || normalized.includes("death") || normalized.includes("destroy");
  const hasRepair = normalized.includes("heal") || normalized.includes("repair") || normalized.includes("reset");

  const admissibility: Admissibility = hasIrreversible || branch === "review" ? "conditional" : hasRepair ? "conditional" : "allow";
  const driftRisk: DriftRisk = hasIrreversible || normalized.includes("reset") ? "high" : branch === "alternate" || hasRepair ? "medium" : "low";

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

function evolveCharacters(events: SceneEvent[]): CharacterState[] {
  return baseCharacters.map((character) => {
    const condition = [...character.condition];
    const carriedObjects = [...character.carriedObjects];
    const relationships = { ...character.relationships };
    let pressure = character.pressure;
    let continuity = character.continuity;

    for (const event of events) {
      const text = event.text.toLowerCase();

      if (character.name === "Elena Voss") {
        if (text.includes("injury") || text.includes("arm")) condition.push("left-arm injury active");
        if (text.includes("case") || text.includes("courier")) carriedObjects.push("yellow courier case");
        if (text.includes("hide") || text.includes("withhold") || text.includes("trust")) {
          relationships["Ren Kaito"] = "trust degraded";
          pressure += 8;
        }
      }

      if (character.name === "Ren Kaito") {
        if (text.includes("file") || text.includes("source")) carriedObjects.push("encrypted source file");
        if (text.includes("withhold") || text.includes("hide") || text.includes("trust")) {
          relationships["Elena Voss"] = "withholding / review required";
          pressure += 10;
        }
      }

      if (event.driftRisk === "medium") {
        pressure += 4;
        continuity -= 2;
      }

      if (event.driftRisk === "high") {
        pressure += 12;
        continuity -= 8;
      }
    }

    return {
      ...character,
      condition: unique(condition),
      carriedObjects: unique(carriedObjects),
      relationships,
      pressure: Math.min(100, pressure),
      continuity: Math.max(0, continuity)
    };
  });
}

function evolveWorld(events: SceneEvent[]): WorldState {
  const world: WorldState = {
    ...baseWorld,
    damagedLocations: [...baseWorld.damagedLocations],
    persistentObjects: [...baseWorld.persistentObjects],
    unresolvedTensions: [...baseWorld.unresolvedTensions]
  };

  for (const event of events) {
    const text = event.text.toLowerCase();

    if (text.includes("bridge")) world.damagedLocations.push("eastern bridge");
    if (text.includes("case") || text.includes("courier")) world.persistentObjects.push("yellow courier case");
    if (text.includes("file") || text.includes("source")) world.persistentObjects.push("encrypted source file");
    if (text.includes("rain") || text.includes("storm")) world.weather = "intensified rain";
    if (text.includes("destroy")) world.damagedLocations.push("newly destroyed structure");
    if (text.includes("unknown") || text.includes("source") || text.includes("withhold")) {
      world.unresolvedTensions.push("authority gap remains unresolved");
    }

    if (event.driftRisk === "medium") world.continuityPressure += 6;
    if (event.driftRisk === "high") world.continuityPressure += 16;
  }

  return {
    ...world,
    damagedLocations: unique(world.damagedLocations),
    persistentObjects: unique(world.persistentObjects),
    unresolvedTensions: unique(world.unresolvedTensions),
    continuityPressure: Math.min(100, world.continuityPressure)
  };
}

export default function Page() {
  const [sceneText, setSceneText] = useState(
    "Elena enters the damaged bridge after the explosion, carrying the yellow courier case while hiding her left-arm injury from Ren."
  );
  const [branch, setBranch] = useState<BranchMode>("prime");
  const [events, setEvents] = useState<SceneEvent[]>(seedEvents);
  const [selectedId, setSelectedId] = useState(seedEvents[seedEvents.length - 1].id);

  const preview = useMemo(
    () => analyzeScene(sceneText, branch, events.length + 1),
    [sceneText, branch, events.length]
  );

  const characters = useMemo(() => evolveCharacters(events), [events]);
  const world = useMemo(() => evolveWorld(events), [events]);

  const selectedEvent = events.find((event) => event.id === selectedId) ?? events[events.length - 1];

  const packet = {
    mode: "video_scene",
    branch: preview.branch,
    scene: preview.text,
    preserve: preview.preserve,
    affectedCharacters: preview.affectedCharacters,
    affectedWorldState: preview.affectedWorldState,
    consequences: preview.consequences,
    currentWorldState: {
      weather: world.weather,
      damagedLocations: world.damagedLocations,
      persistentObjects: world.persistentObjects,
      unresolvedTensions: world.unresolvedTensions
    },
    characterContinuity: characters.map((character) => ({
      name: character.name,
      condition: character.condition,
      carriedObjects: character.carriedObjects,
      relationships: character.relationships,
      continuity: character.continuity
    })),
    admissibility: preview.admissibility,
    driftRisk: preview.driftRisk,
    nextAction:
      preview.admissibility === "allow"
        ? "prepare_render_packet"
        : "operator_review_required"
  };

  function compileScene() {
    const clean = sceneText.trim();
    if (!clean) return;

    const next = analyzeScene(clean, branch, events.length + 1);
    setEvents((current) => [...current, next]);
    setSelectedId(next.id);
    setSceneText("");
  }

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>
        <p className="sf-muted">Living world state for governed synthetic media.</p>

        <nav className="sf-nav">
          {["Continuity Compiler", "Living World", "Characters", "Objects", "Timeline", "Packet"].map((item, index) => (
            <div className="sf-nav-item" key={item}>
              <span className="sf-nav-index">{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </nav>

        <div className="sf-side-note">
          <strong>V7 shift:</strong>
          <span>The world visibly evolves after scene compilation.</span>
        </div>
      </aside>

      <section className="sf-main">
        <div className="sf-topbar">
          <div>
            <div className="sf-eyebrow">SolaceFrame V7 · Living World State</div>
            <h1 className="sf-title">Change the scene. Watch the world remember.</h1>
          </div>

          <div className="sf-status-pill">
            <span className="sf-pulse" />
            <span>World evolution active</span>
          </div>
        </div>

        <div className="sf-grid">
          <section className="sf-card sf-card-pad">
            <div className="sf-eyebrow">Continuity Compiler</div>
            <h2 className="sf-card-title">Scene input becomes persistent world state.</h2>

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

              <button className="sf-button" onClick={compileScene}>
                Compile and evolve world
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
                <div className="sf-metric-value">{world.continuityPressure}%</div>
                <div className="sf-metric-label">World pressure</div>
              </div>
              <div className="sf-metric">
                <div className="sf-metric-value">{events.length}</div>
                <div className="sf-metric-label">Compiled scenes</div>
              </div>
            </div>
          </section>

          <aside className="sf-side-stack">
            <section className="sf-card sf-card-pad">
              <div className="sf-eyebrow">World State</div>
              <h3 className="sf-card-title sf-small-title">{world.name}</h3>
              <div className="sf-world-row">
                <span>Weather</span>
                <strong>{world.weather}</strong>
              </div>
              <div className="sf-world-row">
                <span>Continuity pressure</span>
                <strong>{world.continuityPressure}%</strong>
              </div>
              <div className="sf-bar">
                <div className="sf-bar-fill" style={{ width: `${world.continuityPressure}%` }} />
              </div>

              <div className="sf-chip-cloud">
                {world.damagedLocations.map((item) => <span className="sf-chip danger" key={item}>{item}</span>)}
                {world.persistentObjects.map((item) => <span className="sf-chip" key={item}>{item}</span>)}
              </div>
            </section>

            <section className="sf-card sf-card-pad">
              <div className="sf-eyebrow">Generation Packet</div>
              <pre className="sf-code">{JSON.stringify(packet, null, 2)}</pre>
            </section>
          </aside>
        </div>

        <div className="sf-lower-grid">
          <section className="sf-card sf-card-pad">
            <div className="sf-eyebrow">Character Persistence</div>
            <div className="sf-character-grid">
              {characters.map((character) => (
                <div className="sf-character-card" key={character.id}>
                  <div className="sf-character-top">
                    <div>
                      <h3>{character.name}</h3>
                      <p>{character.role}</p>
                    </div>
                    <strong>{character.continuity}%</strong>
                  </div>

                  <div className="sf-bar">
                    <div className="sf-bar-fill" style={{ width: `${character.continuity}%` }} />
                  </div>

                  <div className="sf-chip-cloud">
                    {character.condition.map((item) => <span className="sf-chip danger" key={item}>{item}</span>)}
                    {character.carriedObjects.map((item) => <span className="sf-chip" key={item}>{item}</span>)}
                    {Object.entries(character.relationships).map(([name, state]) => (
                      <span className="sf-chip warn" key={name}>{name}: {state}</span>
                    ))}
                  </div>

                  <div className="sf-world-row">
                    <span>Pressure</span>
                    <strong>{character.pressure}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sf-card sf-card-pad">
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

            <div className="sf-selected">
              <div className="sf-eyebrow">Selected Event</div>
              <p>{selectedEvent.text}</p>
              <div className="sf-chip-cloud">
                {selectedEvent.consequences.map((item) => <span className="sf-chip" key={item}>{item}</span>)}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

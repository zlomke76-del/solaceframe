"use client";

import { useEffect, useMemo, useState } from "react";

type BranchMode = "prime" | "alternate" | "review";
type Admissibility = "allow" | "conditional" | "blocked";
type DriftRisk = "low" | "medium" | "high";
type QueueStatus = "queued" | "review" | "approved" | "blocked";

type Character = {
  id: string;
  name: string;
  role: string;
  conditions: string[];
  objects: string[];
  relationships: Record<string, string>;
  continuity: number;
  pressure: number;
};

type LocationState = {
  id: string;
  name: string;
  status: "stable" | "damaged" | "restricted" | "unknown";
  notes: string[];
};

type WorldState = {
  name: string;
  weather: string;
  continuityPressure: number;
  persistentObjects: string[];
  unresolvedTensions: string[];
  locations: LocationState[];
};

type SceneEvent = {
  id: string;
  text: string;
  branch: BranchMode;
  timestamp: string;
  admissibility: Admissibility;
  driftRisk: DriftRisk;
  affectedCharacters: string[];
  affectedLocations: string[];
  consequences: string[];
  preserve: string[];
};

type RenderPacket = {
  id: string;
  createdAt: string;
  sceneId: string;
  mode: "image" | "video";
  status: QueueStatus;
  prompt: string;
  preserve: string[];
  governance: {
    admissibility: Admissibility;
    driftRisk: DriftRisk;
    reason: string;
  };
  worldSnapshot: WorldState;
  charactersSnapshot: Character[];
};

type ProjectState = {
  projectName: string;
  branch: BranchMode;
  world: WorldState;
  characters: Character[];
  scenes: SceneEvent[];
  queue: RenderPacket[];
  activeSceneId: string | null;
};

const STORAGE_KEY = "solaceframe-v10-project";

const initialProject: ProjectState = {
  projectName: "Neon District 7 Continuity Test",
  branch: "prime",
  world: {
    name: "Neon District 7",
    weather: "cold rain",
    continuityPressure: 28,
    persistentObjects: ["yellow courier case", "encrypted source file"],
    unresolvedTensions: [
      "source authority unresolved",
      "unknown actor triggered bridge failure"
    ],
    locations: [
      {
        id: "safehouse",
        name: "Safehouse",
        status: "stable",
        notes: ["temporary refuge", "low visibility"]
      },
      {
        id: "eastern-bridge",
        name: "Eastern Bridge",
        status: "damaged",
        notes: ["partial collapse", "transit rerouted"]
      },
      {
        id: "blackout-zone",
        name: "Blackout Zone",
        status: "restricted",
        notes: ["signal loss", "authority uncertain"]
      }
    ]
  },
  characters: [
    {
      id: "elena",
      name: "Elena Voss",
      role: "Primary continuity anchor",
      conditions: ["left-arm injury"],
      objects: ["yellow courier case"],
      relationships: {
        "Ren Kaito": "trust degraded"
      },
      continuity: 96,
      pressure: 22
    },
    {
      id: "ren",
      name: "Ren Kaito",
      role: "Unverified source holder",
      conditions: ["withholding origin file"],
      objects: ["encrypted source file"],
      relationships: {
        "Elena Voss": "withholding information"
      },
      continuity: 91,
      pressure: 36
    }
  ],
  scenes: [
    {
      id: "scene-001",
      text: "Elena exits the lower market while the eastern bridge fails behind her.",
      branch: "prime",
      timestamp: "T+00:01",
      admissibility: "allow",
      driftRisk: "low",
      affectedCharacters: ["Elena Voss"],
      affectedLocations: ["Eastern Bridge"],
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
      affectedLocations: ["Safehouse"],
      consequences: ["trust fracture with Ren", "source authority unresolved"],
      preserve: ["withheld file", "degraded trust", "yellow courier case"]
    }
  ],
  queue: [],
  activeSceneId: "scene-002"
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function analyzeScene(text: string, branch: BranchMode, index: number): SceneEvent {
  const lower = text.toLowerCase();
  const affectedCharacters = new Set<string>();
  const affectedLocations = new Set<string>();
  const consequences = new Set<string>();
  const preserve = new Set<string>([
    "character identity locks",
    "persistent object lineage",
    "prior relationship state",
    "known location damage"
  ]);

  if (lower.includes("elena")) affectedCharacters.add("Elena Voss");
  if (lower.includes("ren")) affectedCharacters.add("Ren Kaito");
  if (lower.includes("bridge")) {
    affectedLocations.add("Eastern Bridge");
    consequences.add("bridge continuity updated");
    preserve.add("damaged bridge");
  }
  if (lower.includes("safehouse")) affectedLocations.add("Safehouse");
  if (lower.includes("blackout")) affectedLocations.add("Blackout Zone");
  if (includesAny(lower, ["injury", "injured", "arm", "wound"])) {
    affectedCharacters.add("Elena Voss");
    consequences.add("physical condition continuity active");
    preserve.add("left-arm injury");
  }
  if (includesAny(lower, ["case", "courier"])) {
    consequences.add("courier chain referenced");
    preserve.add("yellow courier case");
  }
  if (includesAny(lower, ["file", "source"])) {
    consequences.add("source authority remains unresolved");
    preserve.add("encrypted source file");
  }
  if (includesAny(lower, ["trust", "withhold", "betray", "hide", "lied"])) {
    affectedCharacters.add("Elena Voss");
    affectedCharacters.add("Ren Kaito");
    consequences.add("relationship pressure increased");
    preserve.add("degraded trust with Ren");
  }
  if (includesAny(lower, ["heal", "repair", "merge"])) {
    consequences.add("continuity repair requested");
  }
  if (includesAny(lower, ["kill", "death", "destroy", "erase", "reset"])) {
    consequences.add("irreversible or invalidating mutation requested");
  }
  if (includesAny(lower, ["rain", "storm", "flood"])) {
    consequences.add("weather continuity updated");
  }

  if (affectedCharacters.size === 0) affectedCharacters.add("Elena Voss");
  if (affectedLocations.size === 0) affectedLocations.add("Neon District 7");
  if (consequences.size === 0) consequences.add("new scene memory added");

  const invalidating = includesAny(lower, ["erase", "reset"]);
  const irreversible = includesAny(lower, ["kill", "death", "destroy"]);
  const repair = includesAny(lower, ["heal", "repair", "merge"]);

  const admissibility: Admissibility = invalidating
    ? "blocked"
    : irreversible || repair || branch === "review"
      ? "conditional"
      : "allow";

  const driftRisk: DriftRisk = invalidating || irreversible
    ? "high"
    : repair || branch === "alternate" || branch === "review"
      ? "medium"
      : "low";

  return {
    id: `scene-${String(index).padStart(3, "0")}`,
    text,
    branch,
    timestamp: `T+00:${String(index).padStart(2, "0")}`,
    admissibility,
    driftRisk,
    affectedCharacters: Array.from(affectedCharacters),
    affectedLocations: Array.from(affectedLocations),
    consequences: Array.from(consequences),
    preserve: Array.from(preserve)
  };
}

function evolveProject(project: ProjectState, scene: SceneEvent): ProjectState {
  const lower = scene.text.toLowerCase();
  const pressureDelta = scene.driftRisk === "high" ? 18 : scene.driftRisk === "medium" ? 8 : 3;

  const world: WorldState = {
    ...project.world,
    weather: includesAny(lower, ["storm", "flood"]) ? "intensified storm" : project.world.weather,
    continuityPressure: clamp(project.world.continuityPressure + pressureDelta, 0, 100),
    persistentObjects: unique([
      ...project.world.persistentObjects,
      ...(lower.includes("case") || lower.includes("courier") ? ["yellow courier case"] : []),
      ...(lower.includes("file") || lower.includes("source") ? ["encrypted source file"] : [])
    ]),
    unresolvedTensions: unique([
      ...project.world.unresolvedTensions,
      ...(scene.admissibility !== "allow" ? ["operator review required"] : []),
      ...(lower.includes("source") || lower.includes("file") ? ["source authority unresolved"] : []),
      ...(lower.includes("merge") ? ["branch merge requires recomputation"] : [])
    ]),
    locations: project.world.locations.map((location) => {
      if (location.name === "Eastern Bridge" && lower.includes("bridge")) {
        return {
          ...location,
          status: lower.includes("repair") ? "damaged" : "damaged",
          notes: unique([...location.notes, "referenced in latest scene"])
        };
      }
      if (location.name === "Blackout Zone" && lower.includes("blackout")) {
        return {
          ...location,
          status: "restricted",
          notes: unique([...location.notes, "active continuity risk"])
        };
      }
      return location;
    })
  };

  const characters = project.characters.map((character) => {
    const conditions = [...character.conditions];
    const objects = [...character.objects];
    const relationships = { ...character.relationships };
    let pressure = character.pressure;
    let continuity = character.continuity;

    if (character.name === "Elena Voss") {
      if (includesAny(lower, ["injury", "injured", "arm", "wound"])) {
        conditions.push("left-arm injury active");
      }
      if (includesAny(lower, ["case", "courier"])) objects.push("yellow courier case");
      if (includesAny(lower, ["hide", "withhold", "trust", "betray"])) {
        relationships["Ren Kaito"] = "trust degraded / review required";
        pressure += 9;
      }
    }

    if (character.name === "Ren Kaito") {
      if (includesAny(lower, ["file", "source"])) objects.push("encrypted source file");
      if (includesAny(lower, ["hide", "withhold", "trust", "betray"])) {
        relationships["Elena Voss"] = "withholding / contested authority";
        pressure += 11;
      }
    }

    if (scene.driftRisk === "medium") {
      pressure += 4;
      continuity -= 2;
    }
    if (scene.driftRisk === "high") {
      pressure += 13;
      continuity -= 10;
    }

    return {
      ...character,
      conditions: unique(conditions),
      objects: unique(objects),
      relationships,
      pressure: clamp(pressure, 0, 100),
      continuity: clamp(continuity, 0, 100)
    };
  });

  return {
    ...project,
    world,
    characters,
    scenes: [...project.scenes, scene],
    activeSceneId: scene.id
  };
}

function buildPacket(project: ProjectState, scene: SceneEvent, mode: "image" | "video"): RenderPacket {
  return {
    id: `packet-${String(project.queue.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    sceneId: scene.id,
    mode,
    status: scene.admissibility === "allow" ? "queued" : scene.admissibility === "conditional" ? "review" : "blocked",
    prompt: scene.text,
    preserve: scene.preserve,
    governance: {
      admissibility: scene.admissibility,
      driftRisk: scene.driftRisk,
      reason:
        scene.admissibility === "allow"
          ? "All known continuity constraints preserved."
          : scene.admissibility === "conditional"
            ? "Scene touches repair, irreversible change, or review branch conditions."
            : "Scene attempts to reset or erase persistent state."
    },
    worldSnapshot: project.world,
    charactersSnapshot: project.characters
  };
}

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [project, setProject] = useState<ProjectState>(initialProject);
  const [sceneText, setSceneText] = useState(
    "Elena enters the damaged bridge carrying the yellow courier case while hiding her left-arm injury from Ren."
  );
  const [mode, setMode] = useState<"image" | "video">("video");
  const [message, setMessage] = useState("Local continuity state ready.");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProject(JSON.parse(stored) as ProjectState);
      } catch {
        setProject(initialProject);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [loaded, project]);

  const preview = useMemo(
    () => analyzeScene(sceneText, project.branch, project.scenes.length + 1),
    [sceneText, project.branch, project.scenes.length]
  );

  const activeScene = project.scenes.find((scene) => scene.id === project.activeSceneId) ?? project.scenes[project.scenes.length - 1];
  const latestPacket = project.queue[project.queue.length - 1] ?? null;

  function compileScene() {
    const clean = sceneText.trim();
    if (!clean) return;
    const next = analyzeScene(clean, project.branch, project.scenes.length + 1);
    setProject((current) => evolveProject(current, next));
    setSceneText("");
    setMessage(`${next.id} compiled into continuity state.`);
  }

  function enqueuePacket() {
    const sourceScene = activeScene ?? preview;
    const packet = buildPacket(project, sourceScene, mode);
    setProject((current) => ({ ...current, queue: [...current.queue, packet] }));
    setMessage(`${packet.id} created and added to render queue.`);
  }

  function updatePacketStatus(id: string, status: QueueStatus) {
    setProject((current) => ({
      ...current,
      queue: current.queue.map((packet) => packet.id === id ? { ...packet, status } : packet)
    }));
  }

  function exportState() {
    const payload = JSON.stringify(project, null, 2);
    void navigator.clipboard.writeText(payload);
    setMessage("Project JSON copied to clipboard.");
  }

  function importState(value: string) {
    try {
      const parsed = JSON.parse(value) as ProjectState;
      setProject(parsed);
      setMessage("Project state imported.");
    } catch {
      setMessage("Import failed: invalid JSON.");
    }
  }

  function resetState() {
    setProject(initialProject);
    setSceneText("Elena enters the damaged bridge carrying the yellow courier case while hiding her left-arm injury from Ren.");
    setMessage("Project reset to seed state.");
  }

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>
        <p className="sf-muted">Working continuity prototype with local persistence.</p>

        <nav className="sf-nav">
          {["Compiler", "World", "Characters", "Queue", "Import / Export"].map((item, index) => (
            <a href={`#${item.toLowerCase().replaceAll(" ", "-").replace("/", "")}`} className="sf-nav-item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </a>
          ))}
        </nav>

        <div className="sf-note">{message}</div>
      </aside>

      <section className="sf-main">
        <header className="sf-top">
          <div>
            <div className="sf-eyebrow">SolaceFrame V10 · Working Continuity Engine</div>
            <h1 className="sf-title">A scene compiler that actually mutates persistent world state.</h1>
          </div>
          <button className="sf-pill" onClick={resetState}>Reset seed</button>
        </header>

        <section className="sf-grid" id="compiler">
          <div className="sf-card">
            <div className="sf-eyebrow">Scene Compiler</div>
            <h2>Write a scene. Compile it into memory.</h2>
            <textarea className="sf-textarea" value={sceneText} onChange={(event) => setSceneText(event.target.value)} />

            <div className="sf-controls">
              <label>
                Branch
                <select value={project.branch} onChange={(event) => setProject({ ...project, branch: event.target.value as BranchMode })}>
                  <option value="prime">Prime continuity</option>
                  <option value="alternate">Alternate branch</option>
                  <option value="review">Operator review</option>
                </select>
              </label>
              <label>
                Packet mode
                <select value={mode} onChange={(event) => setMode(event.target.value as "image" | "video")}>
                  <option value="video">Video scene</option>
                  <option value="image">Image keyframe</option>
                </select>
              </label>
              <button onClick={compileScene}>Compile scene</button>
              <button onClick={enqueuePacket}>Create render packet</button>
            </div>

            <div className="sf-metrics">
              <div><strong>{preview.admissibility}</strong><span>Admissibility</span></div>
              <div><strong>{preview.driftRisk}</strong><span>Drift risk</span></div>
              <div><strong>{preview.consequences.length}</strong><span>Consequences</span></div>
              <div><strong>{project.scenes.length}</strong><span>Stored scenes</span></div>
            </div>
          </div>

          <div className="sf-card" id="world">
            <div className="sf-eyebrow">Live World State</div>
            <h2>{project.world.name}</h2>
            <div className="sf-row"><span>Weather</span><strong>{project.world.weather}</strong></div>
            <div className="sf-row"><span>Continuity pressure</span><strong>{project.world.continuityPressure}%</strong></div>
            <div className="sf-bar"><div style={{ width: `${project.world.continuityPressure}%` }} /></div>
            <div className="sf-chip-cloud">
              {project.world.persistentObjects.map((item) => <span className="sf-chip" key={item}>{item}</span>)}
              {project.world.unresolvedTensions.map((item) => <span className="sf-chip warn" key={item}>{item}</span>)}
            </div>
          </div>
        </section>

        <section className="sf-grid" id="characters">
          <div className="sf-card wide">
            <div className="sf-eyebrow">Character Memory</div>
            <div className="sf-character-grid">
              {project.characters.map((character) => (
                <article className="sf-character" key={character.id}>
                  <div className="sf-character-head"><h3>{character.name}</h3><strong>{character.continuity}%</strong></div>
                  <p>{character.role}</p>
                  <div className="sf-bar"><div style={{ width: `${character.continuity}%` }} /></div>
                  <div className="sf-chip-cloud">
                    {character.conditions.map((item) => <span className="sf-chip danger" key={item}>{item}</span>)}
                    {character.objects.map((item) => <span className="sf-chip" key={item}>{item}</span>)}
                    {Object.entries(character.relationships).map(([name, state]) => <span className="sf-chip warn" key={name}>{name}: {state}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="sf-card">
            <div className="sf-eyebrow">Locations</div>
            <div className="sf-list">
              {project.world.locations.map((location) => (
                <div className="sf-list-row" key={location.id}>
                  <strong>{location.name}</strong>
                  <span>{location.status}</span>
                  <p>{location.notes.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sf-grid" id="queue">
          <div className="sf-card">
            <div className="sf-eyebrow">Scene Timeline</div>
            <div className="sf-list timeline">
              {project.scenes.map((scene) => (
                <button className={`sf-list-row ${project.activeSceneId === scene.id ? "active" : ""}`} key={scene.id} onClick={() => setProject({ ...project, activeSceneId: scene.id })}>
                  <strong>{scene.id} · {scene.admissibility}</strong>
                  <span>{scene.branch} · {scene.driftRisk}</span>
                  <p>{scene.text}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="sf-card">
            <div className="sf-eyebrow">Render Queue</div>
            <div className="sf-list">
              {project.queue.length === 0 ? <p className="sf-muted">No render packets yet.</p> : project.queue.map((packet) => (
                <div className="sf-list-row" key={packet.id}>
                  <strong>{packet.id} · {packet.mode}</strong>
                  <span>{packet.status}</span>
                  <p>{packet.prompt}</p>
                  <div className="sf-actions">
                    <button onClick={() => updatePacketStatus(packet.id, "approved")}>Approve</button>
                    <button onClick={() => updatePacketStatus(packet.id, "review")}>Review</button>
                    <button onClick={() => updatePacketStatus(packet.id, "blocked")}>Block</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sf-grid" id="import-export">
          <div className="sf-card">
            <div className="sf-eyebrow">Latest Packet JSON</div>
            <pre className="sf-code">{JSON.stringify(latestPacket ?? buildPacket(project, activeScene ?? preview, mode), null, 2)}</pre>
          </div>
          <div className="sf-card">
            <div className="sf-eyebrow">Import / Export</div>
            <button onClick={exportState}>Copy full project JSON</button>
            <textarea className="sf-textarea small" placeholder="Paste exported project JSON here..." onBlur={(event) => event.currentTarget.value.trim() && importState(event.currentTarget.value)} />
          </div>
        </section>
      </section>
    </main>
  );
}

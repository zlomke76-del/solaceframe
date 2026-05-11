"use client";

import { useEffect, useMemo, useState } from "react";

type Character = {
  id: string;
  name: string;
  emotionalState: string;
  injury: string;
  continuity: number;
};

type RenderItem = {
  id: string;
  scene: string;
  status: string;
  branch: string;
  timestamp: string;
};

const defaultCharacters: Character[] = [
  {
    id: "char-001",
    name: "Elena Voss",
    emotionalState: "guarded",
    injury: "left-arm injury",
    continuity: 94
  },
  {
    id: "char-002",
    name: "Ren Kaito",
    emotionalState: "withholding",
    injury: "none",
    continuity: 87
  }
];

const initialRenders: RenderItem[] = [
  {
    id: "render-001",
    scene: "Bridge traversal continuity render",
    status: "queued",
    branch: "prime",
    timestamp: "T+00:12"
  }
];

export default function Page() {
  const [sceneInput, setSceneInput] = useState(
    "Elena enters the flooded transit corridor while protecting the yellow courier case."
  );

  const [characters, setCharacters] = useState<Character[]>(defaultCharacters);
  const [renderQueue, setRenderQueue] = useState<RenderItem[]>(initialRenders);
  const [worldPressure, setWorldPressure] = useState(38);

  useEffect(() => {
    const saved = localStorage.getItem("solaceframe-v11-state");

    if (saved) {
      const parsed = JSON.parse(saved);

      setCharacters(parsed.characters || defaultCharacters);
      setRenderQueue(parsed.renderQueue || initialRenders);
      setWorldPressure(parsed.worldPressure || 38);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "solaceframe-v11-state",
      JSON.stringify({
        characters,
        renderQueue,
        worldPressure
      })
    );
  }, [characters, renderQueue, worldPressure]);

  const continuityPacket = useMemo(() => {
    const lower = sceneInput.toLowerCase();

    const preserve = [];
    const risks = [];
    const mutations = [];

    if (lower.includes("courier")) {
      preserve.push("persistent courier lineage");
    }

    if (lower.includes("flood")) {
      mutations.push("environment pressure increased");
    }

    if (lower.includes("injury")) {
      preserve.push("physical continuity retained");
    }

    if (lower.includes("reset")) {
      risks.push("invalid continuity reset detected");
    }

    return {
      preserve,
      risks,
      mutations,
      admissible: risks.length === 0
    };
  }, [sceneInput]);

  function compileScene() {
    const id = `render-${Date.now()}`;

    const nextRender = {
      id,
      scene: sceneInput,
      status: continuityPacket.admissible ? "approved" : "review",
      branch: "prime",
      timestamp: new Date().toLocaleTimeString()
    };

    setRenderQueue((prev) => [nextRender, ...prev]);

    if (sceneInput.toLowerCase().includes("flood")) {
      setWorldPressure((prev) => Math.min(prev + 7, 100));
    }

    setCharacters((prev) =>
      prev.map((char) => {
        if (sceneInput.toLowerCase().includes("elena") && char.name.includes("Elena")) {
          return {
            ...char,
            emotionalState: "stressed",
            continuity: Math.max(char.continuity - 2, 0)
          };
        }

        return char;
      })
    );
  }

  function exportState() {
    const payload = JSON.stringify(
      {
        characters,
        renderQueue,
        worldPressure
      },
      null,
      2
    );

    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "solaceframe-state.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  function resetState() {
    localStorage.removeItem("solaceframe-v11-state");
    setCharacters(defaultCharacters);
    setRenderQueue(initialRenders);
    setWorldPressure(38);
  }

  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-eyebrow">Moral Clarity AI</div>
        <div className="sf-logo">SolaceFrame</div>

        <div className="sf-nav">
          {[
            "Runtime",
            "Continuity",
            "Characters",
            "World State",
            "Render Queue",
            "Lineage"
          ].map((item, i) => (
            <div className="sf-nav-item" key={item}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="sf-actions">
          <button onClick={exportState}>Export State</button>
          <button onClick={resetState}>Reset Runtime</button>
        </div>
      </aside>

      <section className="sf-main">
        <div className="sf-top">
          <div>
            <div className="sf-eyebrow">SolaceFrame V11 · Governed Runtime</div>

            <h1 className="sf-title">
              Continuity becomes a living system, not a static prompt.
            </h1>
          </div>

          <div className="sf-status">
            Runtime state active
          </div>
        </div>

        <div className="sf-grid">
          <section className="sf-card">
            <div className="sf-eyebrow">Scene Compiler</div>

            <textarea
              className="sf-textarea"
              value={sceneInput}
              onChange={(e) => setSceneInput(e.target.value)}
            />

            <button className="sf-primary" onClick={compileScene}>
              Compile Into Runtime
            </button>

            <div className="sf-chip-wrap">
              {continuityPacket.preserve.map((item) => (
                <div key={item} className="sf-chip green">{item}</div>
              ))}

              {continuityPacket.mutations.map((item) => (
                <div key={item} className="sf-chip blue">{item}</div>
              ))}

              {continuityPacket.risks.map((item) => (
                <div key={item} className="sf-chip red">{item}</div>
              ))}
            </div>
          </section>

          <section className="sf-card">
            <div className="sf-eyebrow">World Pressure</div>

            <div className="sf-meter">
              <div
                className="sf-meter-fill"
                style={{ width: `${worldPressure}%` }}
              />
            </div>

            <div className="sf-pressure-value">{worldPressure}%</div>

            <div className="sf-runtime-state">
              {worldPressure > 60
                ? "Continuity pressure escalating"
                : "Runtime stability maintained"}
            </div>
          </section>
        </div>

        <div className="sf-grid">
          <section className="sf-card">
            <div className="sf-eyebrow">Character Memory Registry</div>

            <div className="sf-stack">
              {characters.map((char) => (
                <div key={char.id} className="sf-character">
                  <div className="sf-row">
                    <strong>{char.name}</strong>
                    <span>{char.continuity}% continuity</span>
                  </div>

                  <p>Emotion: {char.emotionalState}</p>
                  <p>Injury: {char.injury}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="sf-card">
            <div className="sf-eyebrow">Render Queue</div>

            <div className="sf-stack">
              {renderQueue.map((item) => (
                <div key={item.id} className="sf-render">
                  <div className="sf-row">
                    <strong>{item.scene}</strong>
                    <span>{item.timestamp}</span>
                  </div>

                  <div className="sf-chip-wrap">
                    <div className="sf-chip">{item.status}</div>
                    <div className="sf-chip blue">{item.branch}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

const nav = [
  "Overview",
  "Projects",
  "Characters",
  "Worlds",
  "Timelines",
  "Assets",
  "Provenance",
  "Governance",
];

const cards = [
  {
    title: "Continuity Engine",
    status: "Active",
    text: "Preserves character, world, style, and timeline state across generations.",
  },
  {
    title: "Governance Gate",
    status: "Admissible",
    text: "Checks authority, likeness permissions, provenance requirements, and policy boundaries before render.",
  },
  {
    title: "Provenance Registry",
    status: "Sealed",
    text: "Tracks prompt lineage, model route, edits, approvals, and asset ancestry.",
  },
];

const shots = [
  "Scene intent admitted",
  "Character lock preserved",
  "World state synchronized",
  "Render route pending",
];

export default function Page() {
  return (
    <main className="sf-shell">
      <aside className="sf-sidebar">
        <div className="sf-brand">
          <div className="sf-orb" />
          <div>
            <p className="sf-brand-kicker">Moral Clarity AI</p>
            <h1>SolaceFrame</h1>
          </div>
        </div>

        <nav className="sf-nav" aria-label="SolaceFrame navigation">
          {nav.map((item, index) => (
            <a className={index === 0 ? "active" : ""} href="#" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </a>
          ))}
        </nav>

        <div className="sf-sidebar-card">
          <p>Runtime</p>
          <strong>V2 Delta</strong>
          <span>Governed media workspace online</span>
        </div>
      </aside>

      <section className="sf-main">
        <header className="sf-header">
          <div>
            <p className="sf-kicker">Continuity-governed synthetic media</p>
            <h2>Build persistent image and video worlds without losing identity, lineage, or control.</h2>
          </div>
          <div className="sf-status-pill">
            <span />
            System governed
          </div>
        </header>

        <section className="sf-hero-grid">
          <div className="sf-hero-card">
            <div className="sf-grid-glow" />
            <p className="sf-kicker">Workspace</p>
            <h3>SolaceFrame Studio</h3>
            <p>
              A governed creation environment for images, video, persistent characters, synthetic worlds,
              and long-form coherence.
            </p>
            <div className="sf-command-bar">
              <span>Describe a world, character, scene, or governed render path...</span>
              <button>Prepare</button>
            </div>
          </div>

          <div className="sf-panel sf-continuity">
            <p className="sf-kicker">Continuity State</p>
            <h3>Identity lock: stable</h3>
            <div className="sf-meter"><span style={{ width: "86%" }} /></div>
            <ul>
              <li>Character ontology preserved</li>
              <li>Scene memory available</li>
              <li>Style drift monitored</li>
            </ul>
          </div>
        </section>

        <section className="sf-card-row">
          {cards.map((card) => (
            <article className="sf-card" key={card.title}>
              <div className="sf-card-top">
                <h3>{card.title}</h3>
                <span>{card.status}</span>
              </div>
              <p>{card.text}</p>
            </article>
          ))}
        </section>

        <section className="sf-workspace-grid">
          <div className="sf-panel sf-timeline">
            <div className="sf-section-title">
              <div>
                <p className="sf-kicker">Storyboard</p>
                <h3>Long-form coherence pipeline</h3>
              </div>
              <span>4 checks</span>
            </div>
            <div className="sf-shot-list">
              {shots.map((shot, index) => (
                <div className="sf-shot" key={shot}>
                  <span>{index + 1}</span>
                  <p>{shot}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="sf-panel sf-audit">
            <div className="sf-section-title">
              <div>
                <p className="sf-kicker">Provenance</p>
                <h3>Asset lineage</h3>
              </div>
              <span>Sealed</span>
            </div>
            <div className="sf-feed">
              <p><strong>Prompt packet</strong> compiled with governance constraints.</p>
              <p><strong>Authority</strong> verified for synthetic media generation.</p>
              <p><strong>Render</strong> waiting for model adapter connection.</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

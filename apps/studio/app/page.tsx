export default function Page() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#020617",
      color: "white",
      fontFamily: "sans-serif",
      padding: "48px"
    }}>
      <div style={{maxWidth: "1400px", margin: "0 auto"}}>
        <div style={{
          color: "#facc15",
          letterSpacing: "0.3em",
          fontSize: "12px",
          marginBottom: "24px"
        }}>
          SOLACEFRAME V4
        </div>

        <h1 style={{
          fontSize: "72px",
          lineHeight: 1,
          marginBottom: "32px",
          maxWidth: "1000px",
          fontWeight: 900
        }}>
          Persistent continuity infrastructure for governed synthetic worlds.
        </h1>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "24px"
        }}>
          {[
            ["Character Registry", "Persistent identities and lineage tracking"],
            ["World Registry", "Environment and state continuity"],
            ["Timeline Engine", "Causal event sequencing and memory"]
          ].map(([title, desc]) => (
            <div key={title} style={{
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "24px",
              padding: "24px",
              background: "rgba(255,255,255,0.03)"
            }}>
              <h2 style={{fontSize: "28px", marginBottom: "12px"}}>{title}</h2>
              <p style={{color: "rgba(255,255,255,0.7)"}}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

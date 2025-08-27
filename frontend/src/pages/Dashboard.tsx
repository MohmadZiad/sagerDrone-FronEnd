import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();

  const funFacts = useMemo(
    () => [
      { label: "Max Altitude Today", value: `${Math.floor(Math.random() * 100)} m` },
      { label: "Active Pilots", value: `${3 + Math.floor(Math.random() * 5)}` },
      { label: "Avg. Flight Time", value: `${5 + Math.floor(Math.random() * 10)} min` },
    ],
    []
  );

  return (
    <div style={{ padding: "40px 24px", display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.3 }}>Welcome 👋</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Start the live drone tracker when you’re ready. Mapbox & WebSocket won’t start until you click Start.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        {funFacts.map((f, i) => (
          <div
            key={i}
            style={{ padding: 16, borderRadius: 12, background: "#0f172a", border: "1px solid #1f2a44" }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{f.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{f.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => nav("/live")}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            background: "#22c55e",
            color: "#0b1220",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(34,197,94,0.25)",
          }}
        >
          Start Tracking
        </button>
      </div>

      <footer style={{ opacity: 0.6, fontSize: 12 }}>
        Tip: Deploy this page as the landing route to avoid Mapbox tile usage until tracking starts.
      </footer>
    </div>
  );
}

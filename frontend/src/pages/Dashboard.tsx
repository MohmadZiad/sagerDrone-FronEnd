import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Max Altitude Today",
        value: `${Math.floor(Math.random() * 100)} m`,
        icon: "🛫",
      },
      {
        label: "Active Drones",
        value: `${3 + Math.floor(Math.random() * 5)}`,
        icon: "🚁",
      },
      {
        label: "Avg. Flight Time",
        value: `${5 + Math.floor(Math.random() * 10)} min`,
        icon: "⏱️",
      },
    ],
    []
  );

  return (
    <div
      style={{
        padding: "40px 24px",
        display: "grid",
        gap: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.3 }}>
          Welcome 👋
        </h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Quick overview of today’s drone activity. Start live tracking when
          you’re ready.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        {stats.map((f) => (
          <div
            key={f.label}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "#0f141a",
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              <span className="stat-icon" aria-hidden>
                {f.icon}
              </span>{" "}
              {f.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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

        <span className="last-update">
          Last update: {new Date(now).toLocaleTimeString()}
        </span>
      </div>

      <footer style={{ opacity: 0.7, fontSize: 13 }}>
        A simple summary of active drones and flights. Open <b>Live Tracking</b>{" "}
        for the real action.
      </footer>
    </div>
  );
}

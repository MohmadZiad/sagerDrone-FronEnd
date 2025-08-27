import { Suspense, lazy } from "react";
import { Routes, Route, NavLink } from "react-router-dom";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DronesPage = lazy(() => import("./pages/DronesPage"));

export default function App() {
  return (
    <div style={{ minHeight: "100dvh", background: "#0b1220", color: "#fff" }}>
      <nav style={{ padding: "10px 16px", borderBottom: "1px solid #192030" }}>
        <NavLink to="/" style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}>
          Drone Tracker
        </NavLink>
      </nav>

      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<DronesPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

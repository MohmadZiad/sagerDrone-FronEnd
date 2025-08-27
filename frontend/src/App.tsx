import { useEffect, useMemo, useRef } from "react";
import Map from "./components/Map";
import { initSocket } from "./services/socket";
import { useDronesStore, canFly } from "./state/useDronesStore";
import "./index.css";

export default function App() {
  useEffect(() => {
    initSocket();
  }, []);

  const drones = useDronesStore((s) => s.drones);
  const selectedId = useDronesStore((s) => s.selectedId);
  const setSelected = useDronesStore((s) => s.setSelected);

  const list = useMemo(() => Object.values(drones), [drones]);

  const greenCount = useMemo(
    () => list.filter((d) => canFly(d.registration)).length,
    [list]
  );
  const redCount = useMemo(() => list.length - greenCount, [list, greenCount]);

  const selectedRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">Sager Drone</div>
      </header>

      <div className="app-body">
        <aside className="side-panel">
          <div className="dash">
            <div className="dash-card">
              <div className="dash-title">Total</div>
              <div className="dash-value">{list.length}</div>
            </div>
            <div className="dash-card green">
              <div className="dash-title">Green</div>
              <div className="dash-value">{greenCount}</div>
            </div>
            <div className="dash-card red">
              <div className="dash-title">Red</div>
              <div className="dash-value">{redCount}</div>
            </div>
          </div>

          <h2 className="section-title">Live Drones</h2>
          <ul className="list">
            {list.map((d) => {
              const isSelected = selectedId === d.id;
              const Item = (
                <li
                  key={d.id}
                  ref={isSelected ? selectedRef : null}
                  className={`list-item ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelected(d.id)}
                  title="Move map to this drone"
                >
                  <div className="list-row">
                    <span className="reg">{d.registration}</span>
                    <span className={`tag ${canFly(d.registration) ? "g" : "r"}`}>
                      {canFly(d.registration) ? "Green" : "Red"}
                    </span>
                  </div>
                  <div className="muted">{Math.round(d.altitude)} m</div>
                </li>
              );
              return Item;
            })}
            {!list.length && <li className="muted">Waiting for drones…</li>}
          </ul>
        </aside>

        <main className="map-wrap">
          <Map />
          <div className="red-counter">
            <b>Red drones:</b> {redCount}
          </div>
        </main>
      </div>
    </div>
  );
}

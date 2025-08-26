import { useEffect } from "react";
import { useDronesStore } from "./state/useDronesStore";
import Map from "./components/Map";
import { io } from "socket.io-client";
import type { Drone } from "./state/useDronesStore";

const socket = io(import.meta.env.VITE_WS_URL || "http://localhost:9013", {
  transports: ["polling"],
});

const adaptFromGeoJSON = (msg: any): Drone | null => {
  if (!msg || !msg.features || !msg.features[0]) return null;

  const f = msg.features[0];
  const props = f.properties || {};
  const coords = f.geometry?.coordinates || [0, 0];

  return {
    id: props.serial || "",
    serial: props.serial || "",
    registration: props.registration || "",
    altitude: Number(props.altitude) || 0,
    yaw: Number(props.yaw) || 0,
    coordinates: [coords[0], coords[1]],
    pilot: props.pilot || "",
    organization: props.organization || "",
    track: [],
    startTime: Date.now(),
  };
};

function App() {
  const drones = useDronesStore((state) => state.drones);
  const addOrUpdate = useDronesStore((s) => s.addOrUpdateDrone);

  useEffect(() => {
    socket.on("message", (msg) => {
      const d = adaptFromGeoJSON(msg);
      if (d) addOrUpdate(d);
    });
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Sager Drone</h1>

      <div style={{ height: 600 }}>
        <Map />
      </div>

      <div>
        <h2 className="text-lg font-semibold mt-4">Live Drones</h2>
        <ul className="list-disc pl-6">
          {Object.values(drones).map((drone) => (
            <li key={drone.id}>
              {drone.registration} - {Math.round(drone.altitude)}m
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

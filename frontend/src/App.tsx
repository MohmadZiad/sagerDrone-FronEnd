import { useEffect } from "react";
import { initSocket } from "./services/socket";
import { useDronesStore } from "./state/useDronesStore";
import Map from "./components/Map";
function App() {
  const drones = useDronesStore((state) => state.drones);

  useEffect(() => {
    initSocket();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Sager Drone Dashboard</h1>

      <Map />

      {/*list of plane*/}
      <div>
        <h2 className="text-lg font-semibold mt-4">Live Drones</h2>
        <ul className="list-disc pl-6">
          {Object.values(drones).map((drone) => (
            <li key={drone.id}>
              {drone.registration} - {drone.altitude}m
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

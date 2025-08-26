import { useEffect } from "react";
import { initSocket } from "./services/socket";
import { useDronesStore } from "./state/useDronesStore";

function App() {
  const drones = useDronesStore((state) => state.drones);

  useEffect(() => {
    initSocket();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Sager Drone Dashboard</h1>
      <ul>
        {Object.values(drones).map((drone) => (
          <li key={drone.id}>
            {drone.registration} - {drone.altitude}m
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

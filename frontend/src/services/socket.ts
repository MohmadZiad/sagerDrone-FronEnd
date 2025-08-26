import { io } from "socket.io-client";
import { useDronesStore } from "../state/useDronesStore";
import type { Drone } from "../state/useDronesStore";

const URL = import.meta.env.VITE_WS_URL || "http://localhost:9013";
const socket = io(URL, {
    transports: ["polling"],
});

export const initSocket = () => {
  const { addOrUpdateDrone } = useDronesStore.getState();

  socket.on("connect", () => {
    console.log("✅ Connected to backend:", socket.id);
  });

  socket.on("message", (data) => {
    const feature = data.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [0, 0];

    const drone: Drone = {
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

    addOrUpdateDrone(drone);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from backend");
  });
};

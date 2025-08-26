import { io } from "socket.io-client";
import { useDronesStore } from "../state/useDronesStore";

const URL = import.meta.env.VITE_WS_URL || "http://localhost:9013";
const socket = io(URL);

export const initSocket = () => {
  const { addOrUpdateDrone } = useDronesStore.getState();

  socket.on("connect", () => {
    console.log("Connected to backend:", socket.id);
  });

  socket.on("message", (data) => {
    const feature = data.features[0];
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    const id = props.serial;
    const registration = props.registration;

    addOrUpdateDrone({
      id,
      serial: props.serial,
      registration,
      altitude: props.altitude,
      yaw: props.yaw,
      coordinates: [coords[0], coords[1]],
      track: [],
      startTime: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from backend");
  });
};

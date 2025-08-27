// src/services/socket.ts
import { io, Socket } from "socket.io-client";
import { useDronesStore } from "../state/useDronesStore";

let socket: Socket | null = null;

// شكل "drone" المسطّح (لو عدّلت الباك إند لاحقًا)
type IncomingDrone = {
  id: string;
  registration: string;
  altitude: number;
  yaw: number;
  lng: number;
  lat: number;
  takeoffAt?: number;
};

// شكل FeatureCollection الذي يرسله السيرفر الحالي على حدث "message"
type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      serial: string;
      registration: string;
      altitude: number;
      yaw: number;
      pilot?: string;
      organization?: string;
    };
    geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  }>;
};

export function initSocket() {
  if (socket) return socket;

  const URL = import.meta.env.VITE_WS_URL || "http://localhost:9013";

  socket = io(URL, {
    path: "/socket.io", // نفس مسار السيرفر
    transports: ["polling"], // ✅ طابق السيرفر (polling فقط)
    withCredentials: false,
  });

  socket.on("connect", () => {
    // console.log("WS connected", socket.id);
  });

  // نمط 1: لو أرسلت مستقبلاً حدث "drone" بشكل مسطّح
  socket.on("drone", (msg: IncomingDrone) => {
    if (!msg) return;
    useDronesStore.getState().upsertDrone({
      id: msg.id,
      registration: msg.registration,
      altitude: msg.altitude,
      yaw: msg.yaw,
      coordinates: [msg.lng, msg.lat],
      takeoffAt: msg.takeoffAt ?? Date.now(),
    });
  });

  // نمط 2: السيرفر الحالي يرسل "message" كـ FeatureCollection
  socket.on("message", (payload: FeatureCollection) => {
    if (
      !payload ||
      payload.type !== "FeatureCollection" ||
      !payload.features?.length
    )
      return;
    const f = payload.features[0];
    if (!f?.geometry?.coordinates || !f?.properties?.serial) return;

    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;

    useDronesStore.getState().upsertDrone({
      id: p.serial,
      registration: p.registration,
      altitude: p.altitude,
      yaw: p.yaw,
      coordinates: [lng, lat],
      takeoffAt: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    // console.log("WS disconnected");
  });

  return socket;
}

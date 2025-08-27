import { io, Socket } from "socket.io-client";
import { useDronesStore } from "../state/useDronesStore";

let socket: Socket | null = null;
let localCounter = 0;
const DIST_THRESHOLD_DEG = 0.05;

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
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

type IncomingDrone = {
  id?: string;
  registration?: string;
  altitude?: number;
  yaw?: number;
  lng: number;
  lat: number;
  takeoffAt?: number;
};

function getOrCreateTrackId(coord: [number, number]) {
  const drones = useDronesStore.getState().drones;
  let bestId: string | null = null;
  let best = Infinity;
  for (const d of Object.values(drones)) {
    const dx = d.coordinates[0] - coord[0];
    const dy = d.coordinates[1] - coord[1];
    const dist2 = dx * dx + dy * dy;
    if (dist2 < best) {
      best = dist2;
      bestId = d.id;
    }
  }
  return Math.sqrt(best) < DIST_THRESHOLD_DEG
    ? (bestId as string)
    : `DR-${localCounter++}`;
}

export function initSocket() {
  if (socket) return socket;

  const URL = import.meta.env.VITE_WS_URL || "http://localhost:9013";
  socket = io(URL, {
    path: "/socket.io",
    transports: ["polling"],
    withCredentials: false,
  });

  socket.on("message", (payload: FeatureCollection) => {
    if (
      !payload ||
      payload.type !== "FeatureCollection" ||
      !payload.features?.length
    )
      return;
    const st = useDronesStore.getState();
    for (const f of payload.features) {
      const p = f?.properties;
      const coords = f?.geometry?.coordinates as [number, number];
      if (!p || !coords) continue;
      const id = getOrCreateTrackId(coords);
      const existing = st.drones[id];
      st.upsertDrone({
        id,
        registration: p.registration ?? existing?.registration ?? id,
        altitude: Number(p.altitude ?? existing?.altitude ?? 0),
        yaw: Number(p.yaw ?? existing?.yaw ?? 0),
        coordinates: coords,
        takeoffAt: existing?.takeoffAt ?? Date.now(),
      });
    }
  });

  socket.on("drone", (msg: IncomingDrone) => {
    if (!msg) return;
    const st = useDronesStore.getState();
    const coords: [number, number] = [msg.lng, msg.lat];
    const id = getOrCreateTrackId(coords);
    const existing = st.drones[id];
    st.upsertDrone({
      id,
      registration: msg.registration ?? existing?.registration ?? id,
      altitude: Number(msg.altitude ?? existing?.altitude ?? 0),
      yaw: Number(msg.yaw ?? existing?.yaw ?? 0),
      coordinates: coords,
      takeoffAt: existing?.takeoffAt ?? msg.takeoffAt ?? Date.now(),
    });
  });

  return socket;
}

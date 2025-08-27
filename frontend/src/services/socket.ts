import { io, Socket } from "socket.io-client";
import { useDronesStore } from "../state/useDronesStore";

let socket: Socket | null = null;

// Local counter for generating synthetic IDs when a track is new.
let localCounter = 0;

const NEAREST_DRONE_THRESHOLD_DEG = 0.05;

/* ------------------------------- Types ------------------------------- */

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      serial?: string;
      registration?: string;
      altitude?: number;
      yaw?: number;
      pilot?: string;
      organization?: string;
      id?: string;
    };
    geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
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

/* --------------------------- Helper Functions --------------------------- */

/**
 * Returns an existing drone id for the given coordinate if it's close enough
 * to any known drone (nearest-neighbor check). Otherwise generates a new id.
 */
function resolveTrackIdForCoord(coord: [number, number]): string {
  const drones = useDronesStore.getState().drones;

  let nearestId: string | null = null;
  let nearestDistSq = Infinity;

  for (const d of Object.values(drones)) {
    // Existing drones are stored with `coordinates: [lng, lat]`
    const dx = d.coordinates[0] - coord[0];
    const dy = d.coordinates[1] - coord[1];
    const distSq = dx * dx + dy * dy;

    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearestId = d.id;
    }
  }

  // If within threshold → reuse id, else create a new synthetic id.
  const withinThreshold =
    Math.sqrt(nearestDistSq) < NEAREST_DRONE_THRESHOLD_DEG;

  return withinThreshold ? (nearestId as string) : `DR-${localCounter++}`;
}


function normalizeRegistration(reg?: string | null): string | undefined {
  if (reg == null) return undefined;
  const trimmed = String(reg).trim();
  return trimmed.length ? trimmed : undefined;
}

/* ------------------------------ Lifecycle ------------------------------ */


export function initSocket() {
  if (socket) return socket;

  const URL = import.meta.env.VITE_WS_URL || "http://localhost:9013";

  socket = io(URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    timeout: 10000,
  });

  /**
   * Handler: batch FeatureCollection (GeoJSON-like)
   * We iterate over features and upsert drones into the store.
   */
  socket.on("message", (payload: FeatureCollection) => {
    if (!payload || payload.type !== "FeatureCollection") return;
    if (!payload.features?.length) return;

    const st = useDronesStore.getState();

    for (const feature of payload.features) {
      const props = feature?.properties || {};
      const coords = feature?.geometry?.coordinates as [number, number];
      if (!coords) continue;

      // Match this point to an existing track or create a new one.
      const id = resolveTrackIdForCoord(coords);
      const existing = st.drones[id];

      // Registration may come as `registration` or `serial`.
      const reg =
        normalizeRegistration(props.registration) ??
        normalizeRegistration(props.serial);

      st.upsertDrone({
        id,
        registration: reg ?? existing?.registration,
        altitude: Number(props.altitude ?? existing?.altitude ?? 0),
        yaw: Number(props.yaw ?? existing?.yaw ?? 0),
        coordinates: coords, // [lng, lat]
        takeoffAt: existing?.takeoffAt ?? Date.now(), // first-seen time for flight duration
      });
    }
  });

  /**
   * Handler: single drone object
   * Same logic as above but for a single message shape.
   */
  socket.on("drone", (msg: IncomingDrone) => {
    if (!msg) return;

    const st = useDronesStore.getState();
    const coords: [number, number] = [msg.lng, msg.lat];

    // Match to nearest track or create new.
    const id = resolveTrackIdForCoord(coords);
    const existing = st.drones[id];

    const reg = normalizeRegistration(msg.registration);

    st.upsertDrone({
      id,
      registration: reg ?? existing?.registration,
      altitude: Number(msg.altitude ?? existing?.altitude ?? 0),
      yaw: Number(msg.yaw ?? existing?.yaw ?? 0),
      coordinates: coords,
      takeoffAt: existing?.takeoffAt ?? msg.takeoffAt ?? Date.now(),
    });
  });

  return socket;
}

/**
 * Cleanly close the socket and remove all listeners.
 */
export function closeSocket() {
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.disconnect();
  } finally {
    socket = null;
  }
}

import { io } from "socket.io-client";
import { useDronesStore } from "../state/useDronesStore";
import type { Drone } from "../state/useDronesStore";

const URL = import.meta.env.VITE_WS_URL || "http://localhost:9013";
const socket = io(URL, { transports: ["polling"] });

const MAX_TRACKED = 5;
const FIXED_IDS = Array.from({ length: MAX_TRACKED }, (_, i) => `track_${i + 1}`);
const REG_TO_ID = new Map<string, string>();

function distanceMeters(a: readonly [number, number], b: readonly [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const la1 = toRad(a[1]);
  const la2 = toRad(b[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const initSocket = () => {
  const { addOrUpdateDrone } = useDronesStore.getState();

  socket.on("connect", () => {});

  socket.on("message", (data) => {
    const feature = data?.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [0, 0];
    const point: readonly [number, number] = [Number(coords[0]) || 0, Number(coords[1]) || 0];

    const reg = String(props.registration || "");
    const ser = String(props.serial || "");

    let id = REG_TO_ID.get(reg) || "";

    if (!id) {
      const state = useDronesStore.getState();
      const drones = Object.values(state.drones);
      const used = new Set(drones.map((d) => d.id));
      const free = FIXED_IDS.find((x) => !used.has(x));
      if (free) {
        id = free;
      } else if (drones.length) {
        let bestId = drones[0].id;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const d of drones) {
          const dist = distanceMeters(d.coordinates, point);
          if (dist < bestDist) {
            bestDist = dist;
            bestId = d.id;
          }
        }
        id = bestId;
      } else {
        id = FIXED_IDS[0];
      }
      if (reg) REG_TO_ID.set(reg, id);
    }

    const drone: Drone = {
      id,
      serial: ser,
      registration: reg,
      altitude: Number(props.altitude) || 0,
      yaw: Number(props.yaw) || 0,
      coordinates: point,
      pilot: String(props.pilot || ""),
      organization: String(props.organization || ""),
      track: [],
      startTime: Date.now(),
    };

    addOrUpdateDrone(drone);
  });

  socket.on("disconnect", () => {});
};

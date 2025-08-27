import { create } from "zustand";

export type Drone = {
  id: string;
  registration: string;
  altitude: number;
  yaw: number;
  coordinates: [number, number]; // [lng, lat]
  takeoffAt?: number; // first-seen time (ms since epoch)
  path: [number, number][];
};

type DronesState = {
  drones: Record<string, Drone>;
  selectedId: string | null;

  /**
   * Insert or update a drone. Path is optional; if omitted, a new point is
   * appended to the existing path with smoothing & bounding.
   */
  upsertDrone: (
    partial: Omit<Drone, "path"> & { path?: [number, number][] }
  ) => void;

  /** Set the currently selected drone id (or null to clear). */
  setSelected: (id: string | null) => void;

  /** Clear all drones and selection. */
  reset: () => void;
};

/* ------------------------------- Tuning ------------------------------- */

const MAX_TRAIL_POINTS = 500;

const SAME_POINT_EPSILON = 1e-7;

const MAX_JUMP_DEGREES = 0.02;

const SMOOTHING_ALPHA = 0.2;

const INITIAL_TINY_OFFSET: [number, number] = [0.00005, 0.00005];

/* ---------------------------- Path Utilities --------------------------- */

/** Keep only the last N points (ring-buffer behavior via slice). */
function clipTrail(
  trail: [number, number][],
  maxPoints = MAX_TRAIL_POINTS
): [number, number][] {
  if (trail.length > maxPoints) {
    return trail.slice(trail.length - maxPoints);
  }
  return trail;
}

/** Exponential smoothing new coord against previous one (if exists). */
function smoothCoord(
  prev: [number, number] | undefined,
  raw: [number, number],
  alpha = SMOOTHING_ALPHA
): [number, number] {
  if (!prev) return raw;
  return [
    prev[0] + alpha * (raw[0] - prev[0]),
    prev[1] + alpha * (raw[1] - prev[1]),
  ];
}

/** True if two coordinates are practically identical under epsilon. */
function isSamePoint(
  a: [number, number],
  b: [number, number],
  eps = SAME_POINT_EPSILON
): boolean {
  return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;
}

/** True if the distance between two coordinates exceeds the jump threshold. */
function isBigJump(
  a: [number, number],
  b: [number, number],
  jumpDeg = MAX_JUMP_DEGREES
): boolean {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy) > jumpDeg;
}

function buildNextTrail(
  prevTrail: [number, number][],
  raw: [number, number]
): { nextTrail: [number, number][]; coord: [number, number] } {
  const clipped = clipTrail(prevTrail);
  const last = clipped[clipped.length - 1];
  const coord = smoothCoord(last, raw);

  if (!clipped.length) {
    // Seed with a tiny second point so Mapbox line is visible from the start.
    return {
      coord,
      nextTrail: [
        coord,
        [coord[0] + INITIAL_TINY_OFFSET[0], coord[1] + INITIAL_TINY_OFFSET[1]],
      ],
    };
  }

  if (isSamePoint(coord, last)) {
    return { coord, nextTrail: clipped };
  }

  if (isBigJump(coord, last)) {
    return { coord, nextTrail: [last, coord] };
  }

  return { coord, nextTrail: [...clipped, coord] };
}

/* ------------------------------ The Store ------------------------------ */

export const useDronesStore = create<DronesState>((set, get) => ({
  drones: {},
  selectedId: null,

  upsertDrone: (partial) => {
    const current = get().drones[partial.id];

    // Raw point coming from the socket (or callers): [lng, lat]
    const rawCoord: [number, number] = partial.coordinates;

    // Build/extend the path only if caller didn't provide a full path explicitly.
    const prevPath = current?.path ?? [];
    const { coord, nextTrail } = partial.path
      ? { coord: rawCoord, nextTrail: partial.path }
      : buildNextTrail(prevPath, rawCoord);

    const merged: Drone = {
      id: partial.id,
      registration: partial.registration ?? current?.registration ?? "",
      altitude: partial.altitude ?? current?.altitude ?? 0,
      yaw: partial.yaw ?? current?.yaw ?? 0,
      coordinates: coord,
      takeoffAt: partial.takeoffAt ?? current?.takeoffAt ?? Date.now(),
      path: nextTrail,
    };

    set((s) => ({
      drones: {
        ...s.drones,
        [merged.id]: merged,
      },
    }));
  },

  setSelected: (id) => set({ selectedId: id }),
  reset: () => set({ drones: {}, selectedId: null }),
}));

/* ----------------------------- Domain Helpers ----------------------------- */

/**
 * - Drones whose registration *ends with a segment* that starts with 'B' can fly.
 */
export function canFly(registration?: string) {
  const tail = registration?.split("-").pop()?.trim().toUpperCase() ?? "";
  return tail.startsWith("B");
}

export function flightTimeString(takeoffAt?: number) {
  if (!takeoffAt) return "—";
  const ms = Date.now() - takeoffAt;
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

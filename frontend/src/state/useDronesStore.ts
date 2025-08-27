import { create } from "zustand";

export type Drone = {
  id: string;
  registration: string;
  altitude: number;
  yaw: number;
  coordinates: [number, number];
  takeoffAt?: number;
  path: [number, number][];
};

type DronesState = {
  drones: Record<string, Drone>;
  selectedId: string | null;
  upsertDrone: (
    partial: Omit<Drone, "path"> & { path?: [number, number][] }
  ) => void;
  setSelected: (id: string | null) => void;
  reset: () => void;
};

export const useDronesStore = create<DronesState>((set, get) => ({
  drones: {},
  selectedId: null,

  upsertDrone: (partial) => {
    const curr = get().drones[partial.id];
    const MAX_POINTS = 500;
    const SAME_EPS = 1e-7;
    const MAX_JUMP_DEG = 0.02;
    const SMOOTH_ALPHA = 0.2;

    const raw: [number, number] = partial.coordinates;
    const prevPath = curr?.path ?? [];
    const clipped =
      prevPath.length > MAX_POINTS
        ? prevPath.slice(prevPath.length - MAX_POINTS)
        : prevPath;

    const last = clipped[clipped.length - 1];

    const coord: [number, number] = last
      ? [
          last[0] + SMOOTH_ALPHA * (raw[0] - last[0]),
          last[1] + SMOOTH_ALPHA * (raw[1] - last[1]),
        ]
      : raw;

    let nextPath: [number, number][];
    if (!clipped.length) {
      nextPath = [coord, [coord[0] + 0.00005, coord[1] + 0.00005]];
    } else {
      const sameAsLast =
        Math.abs(coord[0] - last[0]) < SAME_EPS &&
        Math.abs(coord[1] - last[1]) < SAME_EPS;

      if (sameAsLast) {
        nextPath = clipped;
      } else {
        const dx = coord[0] - last[0];
        const dy = coord[1] - last[1];
        const isBigJump = Math.hypot(dx, dy) > MAX_JUMP_DEG;
        nextPath = isBigJump ? [last, coord] : [...clipped, coord];
      }
    }

    const merged: Drone = {
      id: partial.id,
      registration: partial.registration ?? curr?.registration ?? "",
      altitude: partial.altitude ?? curr?.altitude ?? 0,
      yaw: partial.yaw ?? curr?.yaw ?? 0,
      coordinates: coord,
      takeoffAt: partial.takeoffAt ?? curr?.takeoffAt ?? Date.now(),
      path: partial.path ?? nextPath,
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

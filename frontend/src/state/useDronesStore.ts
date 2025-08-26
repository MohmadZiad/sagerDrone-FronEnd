import { create } from "zustand";

type Coordinate = readonly [number, number];

 export interface Drone {
  id: string;
  serial: string;
  registration: string;
  altitude: number;
  yaw: number;
  coordinates: Coordinate;
  track: Coordinate[];
  startTime: number;
  pilot: string;
organization: string;
}

interface DronesState {
  drones: Record<string, Drone>;
  selectedId: string | null;
  addOrUpdateDrone: (drone: Drone) => void;
  setSelected: (id: string | null) => void;
}

const MAX_TRACK_POINTS = 600;

const samePoint = (a?: Coordinate, b?: Coordinate) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

export const useDronesStore = create<DronesState>()((set) => ({
  drones: {},
  selectedId: null,

  addOrUpdateDrone: (incoming) =>
    set((state) => {
      const existing = state.drones[incoming.id];
      const prevTrack = existing?.track ?? [];
      const last = prevTrack[prevTrack.length - 1];

      let nextTrack =
        !existing || !samePoint(last, incoming.coordinates)
          ? [...prevTrack, incoming.coordinates]
          : prevTrack;

      if (nextTrack.length > MAX_TRACK_POINTS) {
        nextTrack = nextTrack.slice(nextTrack.length - MAX_TRACK_POINTS);
      }

      return {
        drones: {
          ...state.drones,
          [incoming.id]: {
            ...existing,
            ...incoming,
            startTime: existing ? existing.startTime : incoming.startTime,
            track: nextTrack,
          },
        },
      };
    }),

  setSelected: (id) =>
    set((state) => ({
      selectedId: id && state.drones[id] ? id : null,
    })),
}));

export const useSelectedDrone = () =>
  useDronesStore((s) => (s.selectedId ? s.drones[s.selectedId] ?? null : null));

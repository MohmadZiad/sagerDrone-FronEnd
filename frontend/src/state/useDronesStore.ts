import { create } from "zustand";

//Declare Coordinate  => tuble for Longitude and latitude
type Coordinate = readonly [number, number];

//drone object strucutre
interface Drone {
  id: string;
  serial: string;
  registration: string;
  altitude: number;
  yaw: number;
  coordinates: Coordinate;
  track: Coordinate[];
  startTime: number;
}

// Zustand store shape
interface DronesState {
  drones: Record<string, Drone>;
  selectedId: string | null;
  addOrUpdateDrone: (drone: Drone) => void;
  setSelected: (id: string | null) => void;
}

//limited = 600
const MAX_TRACK_POINTS = 600;

//Returns true if the coordinates match else False
const samePoint = (a?: Coordinate, b?: Coordinate) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

//Initial values: drones is empty selectedId: No drones are selected.
export const useDronesStore = create<DronesState>()((set) => ({
  drones: {},
  selectedId: null,

  addOrUpdateDrone: (incoming) =>
    set((state) => {
      console.log(" Incoming drone:", incoming);

      const existing = state.drones[incoming.id];

      //get the cuurrent track histeory
      const prevTrack = existing?.track ?? [];
      const last = prevTrack[prevTrack.length - 1];

      //add point if  it new else keep it
      let nextTrack =
        !existing || !samePoint(last, incoming.coordinates)
          ? [...prevTrack, incoming.coordinates]
          : prevTrack;

      if (nextTrack.length > MAX_TRACK_POINTS) {
        nextTrack = nextTrack.slice(nextTrack.length - MAX_TRACK_POINTS);
      }

      // Merge new data with existing
      const merged: Drone = {
        ...existing,
        ...incoming,
        startTime: existing ? existing.startTime : incoming.startTime,
        track: nextTrack,
      };

      return {
        drones: {
          ...state.drones,
          [incoming.id]: merged,
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

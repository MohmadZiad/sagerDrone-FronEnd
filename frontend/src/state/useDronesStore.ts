// src/state/useDronesStore.ts
import { create } from "zustand";

export type Drone = {
  id: string;
  registration: string;        // مثل: SG-BA
  altitude: number;            // meters
  yaw: number;                 // degrees
  coordinates: [number, number]; // [lng, lat]
  takeoffAt?: number;          // ms epoch (وقت الإقلاع إن وُجد)
  path: [number, number][];    // نقاط المسار منذ فتح الصفحة
};

type DronesState = {
  drones: Record<string, Drone>;
  selectedId: string | null;
  upsertDrone: (partial: Omit<Drone, "path"> & { path?: [number, number][] }) => void;
  setSelected: (id: string | null) => void;
  reset: () => void;
};

export const useDronesStore = create<DronesState>((set, get) => ({
  drones: {},
  selectedId: null,
  upsertDrone: (partial) => {
    const curr = get().drones[partial.id];
    const nextPath = (() => {
      const coord: [number, number] = partial.coordinates;
      // ضيف النقطة الحالية للمسار (من وقت فتح الصفحة)
      const prev = curr?.path ?? [];
      // منع تكدس نقاط كبيرة جدًا: احتفظ بآخر 500 نقطة فقط
      const clipped = prev.length > 500 ? prev.slice(prev.length - 500) : prev;
      if (!clipped.length || (clipped[clipped.length - 1][0] !== coord[0] || clipped[clipped.length - 1][1] !== coord[1])) {
        return [...clipped, coord];
      }
      return clipped;
    })();

    const merged: Drone = {
      id: partial.id,
      registration: partial.registration ?? curr?.registration ?? "",
      altitude: partial.altitude ?? curr?.altitude ?? 0,
      yaw: partial.yaw ?? curr?.yaw ?? 0,
      coordinates: partial.coordinates ?? curr?.coordinates ?? [0, 0],
      takeoffAt: partial.takeoffAt ?? curr?.takeoffAt,
      path: partial.path ?? nextPath,
    };

    set((s) => ({ drones: { ...s.drones, [merged.id]: merged } }));
  },
  setSelected: (id) => set({ selectedId: id }),
  reset: () => set({ drones: {}, selectedId: null }),
}));

// Helper: هل مسموح للطيران (Green)؟
export function canFly(registration?: string) {
  const tail = registration?.split("-").pop()?.trim().toUpperCase() ?? "";
  return tail.startsWith("B");
}

// Helper: زمن الطيران للعرض في الـ popup
export function flightTimeString(takeoffAt?: number) {
  if (!takeoffAt) return "—";
  const ms = Date.now() - takeoffAt;
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

import { useEffect, useRef } from "react";
import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import { useDronesStore } from "../state/useDronesStore";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, LineString } from "geojson";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

const canFly = (registration: string) => {
  if (!registration) return false;
  const last = registration.split("-").pop()!.trim();
  return last.toUpperCase().startsWith("B");
};

const fmtDuration = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${ss}`;
};

const Map = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const loadedRef = useRef(false);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const focusedRef = useRef(false);
  const drones = useDronesStore((s) => s.drones);
  const setSelected = useDronesStore((s) => s.setSelected);

  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [35.91, 31.95],
      zoom: 10,
    });
    map.on("load", () => {
      loadedRef.current = true;
      popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      setTimeout(() => map.resize(), 0);
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !loadedRef.current) return;
    const map = mapRef.current;

    const all = Object.values(drones);

    if (all.length && !focusedRef.current) {
      const d0 = all[0];
      map.flyTo({ center: [d0.coordinates[0], d0.coordinates[1]], zoom: 12 });
      focusedRef.current = true;
    }

    all.forEach((d) => {
      const [lng, lat] = d.coordinates;
      const id = d.id;
      const fly = canFly(d.registration);
      const color = fly ? "#16a34a" : "#ef4444";

      let marker = markersRef.current[id];
      if (!marker) {
        const el = document.createElement("div");
        el.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l4 8-4-2-4 2 4-8zm0 10a1 1 0 110 2 1 1 0 010-2z" fill="${color}" /></svg>`;
        el.style.transform = `rotate(${d.yaw}deg)`;
        el.style.transformOrigin = "11px 11px";
        el.style.cursor = "pointer";
        el.addEventListener("mouseenter", () => {
          const html = `<div style="font: 12px/1.4 Inter, system-ui"><div style="font-weight:600;margin-block-end:4px">${d.serial || d.id}</div><div>Altitude: <b>${Math.round(d.altitude)} m</b></div><div>Flight Time: <b>${fmtDuration(Date.now() - d.startTime)}</b></div></div>`;
          popupRef.current?.setLngLat([lng, lat]).setHTML(html).addTo(map);
        });
        el.addEventListener("mouseleave", () => popupRef.current?.remove());
        el.addEventListener("click", () => setSelected(id));
        marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        markersRef.current[id] = marker;
      } else {
        marker.setLngLat([lng, lat]);
        const el = marker.getElement();
        const p = el.querySelector("path");
        if (p) p.setAttribute("fill", color);
        el.style.transform = `rotate(${d.yaw}deg)`;
        if (popupRef.current && popupRef.current.isOpen()) {
          popupRef.current.setLngLat([lng, lat]);
        }
      }
    });

    const PATH_SRC = "all-paths";
    const PATH_LAYER = "all-paths-layer";

    const features: Feature<LineString>[] = all
    
      .filter((d) => (d.track?.length ?? 0) > 1)
      .map((d) => ({
        type: "Feature",
        properties: {
          color: canFly(d.registration) ? "#16a34a" : "#ef4444",
        },
        geometry: {
          type: "LineString",
          coordinates: d.track.map((c) => [c[0], c[1]]),
        },
      }));

    const fc = { type: "FeatureCollection", features } as any;

    const src = map.getSource(PATH_SRC) as GeoJSONSource | undefined;
    if (!src) {
      map.addSource(PATH_SRC, { type: "geojson", data: fc });
      map.addLayer({
        id: PATH_LAYER,
        type: "line",
        source: PATH_SRC,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 3,
          "line-opacity": 0.95,
        },
      });
    } else {
      src.setData(fc);
    }
  }, [drones]);

  return <div ref={mapContainer} style={{ width: "100%", height: "600px", position: "relative" }} />;
};

export default Map;

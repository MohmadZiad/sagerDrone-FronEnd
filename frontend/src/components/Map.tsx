import { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap, Marker, Popup } from "mapbox-gl";
import type { LngLatLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  useDronesStore,
  canFly,
  flightTimeString,
} from "../state/useDronesStore";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

type MarkerBundle = { marker: Marker; popup: Popup };

export default function Map() {
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, MarkerBundle>>(
    new globalThis.Map<string, MarkerBundle>()
  );
  const loadedRef = useRef(false);

  const drones = useDronesStore((s) => s.drones);
  const selectedId = useDronesStore((s) => s.selectedId);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/dark-v11",
      center: [35.9, 31.95],
      zoom: 5,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    mapRef.current.on("load", () => {
      loadedRef.current = true;
      mapRef.current!.addSource("paths", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      mapRef.current!.addLayer({
        id: "paths",
        type: "line",
        source: "paths",
        paint: {
          "line-color": ["get", "color"], // ← اللون من الخصائص
          "line-width": ["case", ["==", ["get", "isSelected"], 1], 4, 2],
          "line-opacity": 0.9,
        },
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const makeIcon = (yaw: number, isGreen: boolean, isSelected: boolean) => {
    const el = document.createElement("div");
    el.style.width = "24px";
    el.style.height = "24px";
    el.style.transform = `rotate(${yaw}deg)`;
    el.style.transition = "transform 120ms linear";
    el.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" style="${
        isSelected ? "filter: drop-shadow(0 0 4px #3b82f6);" : ""
      }">
        <g>
          <path d="M12 2 L15 10 L12 8 L9 10 Z" fill="${
            isGreen ? "#22c55e" : "#ef4444"
          }" opacity="${isSelected ? "1" : "0.9"}"/>
          <circle cx="12" cy="12" r="${isSelected ? "6" : "3"}" fill="${
      isGreen ? "#16a34a" : "#b91c1c"
    }" />
        </g>
      </svg>
    `;
    return el;
  };

  useEffect(() => {
    if (!mapRef.current || !loadedRef.current) return;

    const map = mapRef.current;
    const seen = new Set<string>();

    // markers
    Object.values(drones).forEach((d) => {
      seen.add(d.id);
      const green = canFly(d.registration);
      const isSelected = selectedId === d.id;
      const exists = markersRef.current.get(d.id);
      const el = makeIcon(d.yaw ?? 0, green, isSelected);

      if (!exists) {
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 20,
        }).setHTML(
          `<div style="font: 12px system-ui, sans-serif">
            <div><b>${d.registration}</b></div>
            <div>Altitude: ${Math.round(d.altitude)} m</div>
            <div>Flight: ${flightTimeString(d.takeoffAt)}</div>
          </div>`
        );

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(d.coordinates as LngLatLike)
          .addTo(map);

        marker.getElement().style.cursor = "pointer";
        marker.getElement().addEventListener("mouseenter", () => {
          popup.setLngLat(d.coordinates as LngLatLike).addTo(map);
        });
        marker.getElement().addEventListener("mouseleave", () => {
          popup.remove();
        });
        marker.getElement().addEventListener("click", () => {
          useDronesStore.getState().setSelected(d.id);
        });

        markersRef.current.set(d.id, { marker, popup });
      } else {
        exists.marker.setLngLat(d.coordinates as LngLatLike);
        exists.marker.getElement().innerHTML = el.innerHTML;
        exists.marker.getElement().style.transform = el.style.transform;
        exists.popup.setHTML(
          `<div style="font: 12px system-ui, sans-serif">
            <div><b>${d.registration}</b></div>
            <div>Altitude: ${Math.round(d.altitude)} m</div>
            <div>Flight: ${flightTimeString(d.takeoffAt)}</div>
          </div>`
        );
      }
    });

    for (const [id, bundle] of markersRef.current.entries()) {
      if (!seen.has(id)) {
        bundle.popup.remove();
        bundle.marker.remove();
        markersRef.current.delete(id);
      }
    }

    // paths (red/green + highlight)
    const features = Object.values(drones)
      .filter((d) => d.path && d.path.length >= 2)
      .map((d) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates: d.path },
        properties: {
          id: d.id,
          color: canFly(d.registration) ? "#22c55e" : "#ef4444",
          isSelected: selectedId === d.id ? 1 : 0,
        },
      }));

    const data = { type: "FeatureCollection", features } as any;
    const src = map.getSource("paths") as mapboxgl.GeoJSONSource;
    if (src) {
      src.setData(data);
    }

    // auto zoom if only one drone
    if (Object.values(drones).length === 1) {
      const d = Object.values(drones)[0];
      map.easeTo({
        center: d.coordinates as LngLatLike,
        zoom: 10,
        duration: 500,
      });
    }
  }, [drones, selectedId]);

  useEffect(() => {
    if (!mapRef.current || !loadedRef.current || !selectedId) return;
    const d = useDronesStore.getState().drones[selectedId];
    if (!d) return;
    mapRef.current.flyTo({
      center: d.coordinates as LngLatLike,
      zoom: 13,
      speed: 0.8,
      curve: 1.3,
    });
  }, [selectedId]);

  return <div id="map" className="map-root" />;
}

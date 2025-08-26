import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useDronesStore } from "../state/useDronesStore";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const Map = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [initialized, setInitialized] = useState(false);
  const drones = useDronesStore((state) => state.drones);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [35.91, 31.95],
      zoom: 10,
    });
    setInitialized(true);
    return () => {
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !initialized) return;

    Object.values(drones).forEach((drone) => {
      const [lng, lat] = drone.coordinates;
      if (isNaN(lng) || isNaN(lat)) return;

      const cleanCode = drone.registration.split("-")[1]?.trim().toUpperCase() || "";
      const color = cleanCode.startsWith("B") ? "green" : "red";

      if (!markersRef.current[drone.id]) {
        markersRef.current[drone.id] = new mapboxgl.Marker({ color })
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);
      } else {
        markersRef.current[drone.id].setLngLat([lng, lat]);
      }
    });
  }, [drones, initialized]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] border rounded shadow"
    ></div>
  );
};

export default Map;

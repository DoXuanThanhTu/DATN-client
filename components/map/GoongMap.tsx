"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  center: [number, number];
  zoom?: number;
  onChange?: (data: { lat: number; lng: number; address: string }) => void;
}

export default function GoongMap({ center, zoom = 16, onChange }: Props) {
  const mapKey = "mJprKj44J7lU9XzZ8MuOkoUtvv9Me1YwpekIuzac";
  const apiKey = "uWnZhSu6PnSQLjSecNxaVLa14bGwsKLkFw6ZnKIa";

  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCoords = useRef<[number, number]>(center);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${mapKey}`,
      center: currentCoords.current,
      zoom,
      cooperativeGestures: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      const el = document.createElement("div");
      el.style.cursor = "grab";
      el.innerHTML = `


    <svg width="34" height="40" viewBox="0 0 24 32" style="margin-top: 2px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
      <path 
        fill="#F0442B" 
        stroke="white" 
        stroke-width="1.5"
        d="M12 2C7.5 2 4 5.6 4 10.2c0 6.3 8 19.8 8 19.8s8-13.5 8-19.8C20 5.6 16.5 2 12 2z"
      />
      <circle cx="12" cy="10" r="2.5" fill="white"/>
    </svg>

`;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
        anchor: "bottom",
      })
        .setLngLat(currentCoords.current)
        .addTo(map);

      markerRef.current = marker;

      marker.on("drag", () => {
        const lngLat = marker.getLngLat();
        const bounds = map.getBounds();

        let lng = lngLat.lng;
        let lat = lngLat.lat;

        if (lng < bounds.getWest()) lng = bounds.getWest();
        if (lng > bounds.getEast()) lng = bounds.getEast();

        if (lat < bounds.getSouth()) lat = bounds.getSouth();
        if (lat > bounds.getNorth()) lat = bounds.getNorth();

        marker.setLngLat([lng, lat]);
        currentCoords.current = [lng, lat];
      });

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
          try {
            const res = await fetch(
              `https://rsapi.goong.io/Geocode?latlng=${lngLat.lat},${lngLat.lng}&api_key=${apiKey}`,
            );
            const data = await res.json();
            const address =
              data?.results?.[0]?.formatted_address || "Vị trí đã chọn";
            onChange?.({ lat: lngLat.lat, lng: lngLat.lng, address });
          } catch (err) {
            console.error(err);
          }
        }, 300);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const [lng, lat] = center;
    const isDifferent =
      Math.abs(lng - currentCoords.current[0]) > 0.0001 ||
      Math.abs(lat - currentCoords.current[1]) > 0.0001;

    if (isDifferent) {
      currentCoords.current = center;
      markerRef.current.setLngLat(center);
      mapRef.current.flyTo({
        center,
        zoom: 17,
        speed: 1.2,
        essential: true,
      });
    }
  }, [center]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px]" />;
}

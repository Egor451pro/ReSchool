"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { MapMarker } from "@/components/location-map";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 1) {
      map.setView([markers[0]!.lat, markers[0]!.lng], 13);
      return;
    }
    const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [28, 28] });
  }, [map, markers]);
  return null;
}

export default function LocationMapInner({
  markers,
  className,
}: {
  markers: MapMarker[];
  className?: string;
}) {
  const center = markers[0]!;
  return (
    <div className={className ?? "h-56 overflow-hidden rounded-2xl border border-line"}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={icon}>
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

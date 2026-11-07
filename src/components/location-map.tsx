"use client";

import dynamic from "next/dynamic";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

const MapInner = dynamic(() => import("@/components/location-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-2xl border border-line bg-muted/40 text-sm text-leaf">
      Загружаем карту…
    </div>
  ),
});

export function LocationMap({
  markers,
  className,
}: {
  markers: MapMarker[];
  className?: string;
}) {
  const valid = markers.filter(
    (marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng),
  );
  if (valid.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-line bg-muted/30 text-sm text-leaf">
        Координат пока нет — укажите адрес в профиле или у учреждения.
      </div>
    );
  }

  return <MapInner markers={valid} className={className} />;
}

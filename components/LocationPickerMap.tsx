
import React, { useEffect, useRef } from 'react';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  radius?: number;
}

declare const L: any; // Leaflet Global

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ latitude, longitude, radius = 100 }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !L) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([latitude, longitude], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
      circleRef.current = L.circle([latitude, longitude], {
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.2,
        radius: radius
      }).addTo(mapRef.current);
    } else {
      const newPos = [latitude, longitude];
      mapRef.current.setView(newPos, 16);
      markerRef.current.setLatLng(newPos);
      circleRef.current.setLatLng(newPos);
      circleRef.current.setRadius(radius);
    }
  }, [latitude, longitude, radius]);

  return (
    <div className="w-full h-full relative group">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-[100] bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        <p className="text-[8px] font-black text-white uppercase tracking-widest">Visualização em Tempo Real</p>
      </div>
    </div>
  );
};

export default LocationPickerMap;

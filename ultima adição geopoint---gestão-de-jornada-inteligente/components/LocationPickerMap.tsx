
import React, { useEffect, useRef } from 'react';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  radius?: number;
}

declare const L: any; // Leaflet Global de index.html

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ latitude, longitude, radius = 100 }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    // Delay para garantir que o modal terminou de animar antes de carregar o Leaflet
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || !L) return;

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: !L.Browser.mobile, // Melhora UX em modais mobile
          touchZoom: true,
          scrollWheelZoom: false
        }).setView([latitude, longitude], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

        markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
        
        circleRef.current = L.circle([latitude, longitude], {
          color: '#2DD4BF',
          fillColor: '#2DD4BF',
          fillOpacity: 0.15,
          weight: 2,
          radius: radius
        }).addTo(mapRef.current);
      } else {
        const newPos = [latitude, longitude];
        mapRef.current.setView(newPos, 16);
        markerRef.current.setLatLng(newPos);
        circleRef.current.setLatLng(newPos);
        circleRef.current.setRadius(radius);
      }
      
      // Força o mapa a recalcular o tamanho após o modal abrir
      mapRef.current.invalidateSize();
    }, 400);

    return () => clearTimeout(timer);
  }, [latitude, longitude, radius]);

  return (
    <div className="w-full h-full relative group">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-3 right-3 z-[100] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <p className="text-[7px] font-black text-white/80 uppercase tracking-widest">WGS84 Precise Location</p>
      </div>
    </div>
  );
};

export default LocationPickerMap;


import React, { useEffect, useRef } from 'react';
import { Location } from '../types';

interface MapViewProps {
  location?: Location;
  onLocationSelect?: (loc: Location) => void;
  readOnly?: boolean;
  markers?: Array<{ loc: Location; color?: string; label?: string }>;
}

const MapView: React.FC<MapViewProps> = ({ location, onLocationSelect, readOnly = false, markers = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initialPos = location?.lat ? [location.lat, location.lng] : [12.9716, 77.5946]; // Default to a city center
    
    // @ts-ignore
    mapInstance.current = L.map(mapRef.current).setView(initialPos, 13);

    // @ts-ignore
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance.current);

    if (!readOnly && onLocationSelect) {
      mapInstance.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerInstance.current) {
          markerInstance.current.setLatLng(e.latlng);
        } else {
          // @ts-ignore
          markerInstance.current = L.marker([lat, lng]).addTo(mapInstance.current);
        }
        onLocationSelect({ lat, lng });
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing dynamic markers if provided
    if (markers.length > 0) {
      markers.forEach(m => {
        // @ts-ignore
        L.circleMarker([m.loc.lat, m.loc.lng], {
          radius: 8,
          fillColor: m.color || "#3b82f6",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(mapInstance.current).bindPopup(m.label || '');
      });
    }

    if (location?.lat && !readOnly) {
      if (markerInstance.current) {
        markerInstance.current.setLatLng([location.lat, location.lng]);
      } else {
        // @ts-ignore
        markerInstance.current = L.marker([location.lat, location.lng]).addTo(mapInstance.current);
      }
      mapInstance.current.setView([location.lat, location.lng], 15);
    }
  }, [location, markers]);

  return <div ref={mapRef} className="shadow-inner border border-slate-200" />;
};

export default MapView;

// src/components/MapPicker.tsx
"use client";

// @ts-ignore: allow side-effect import of CSS without type declarations
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crosshair, MapPin } from 'lucide-react';
import { cn } from "@/lib/utils";

const resolveIcon = (icon: string | { src: string }) =>
  typeof icon === "string" ? icon : icon?.src ?? "";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: resolveIcon(markerIcon2x),
  iconUrl: resolveIcon(markerIcon),
  shadowUrl: resolveIcon(markerShadow),
});

interface MapPickerProps {
  initialPosition?: { lat: number; lng: number; name?: string | null } | null;
  onPositionChange: (position: { lat: number; lng: number; name?: string | null } | null) => void;
  disabled?: boolean;
}

export function MapPicker({ initialPosition, onPositionChange, disabled = false }: MapPickerProps) {
  const [position, setPosition] = useState(initialPosition);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setPosition(initialPosition);
    if (mapRef.current && initialPosition) {
      mapRef.current.setView({ lat: initialPosition.lat, lng: initialPosition.lng }, mapRef.current.getZoom());
    }
  }, [initialPosition]);

  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        if (disabled) return;
        const newPos = { 
          ...(position || {}), 
          lat: e.latlng.lat, 
          lng: e.latlng.lng,
          name: position?.name || null
        };
        setPosition(newPos);
        onPositionChange(newPos);
      },
      // Optional: ถ้าต้องการให้ Map เปลี่ยนเมื่อมีการเคลื่อนย้ายแผนที่ด้วย
      // moveend: (e) => {
      //   if (!position) { // ถ้ายังไม่มีตำแหน่งถูกเลือก
      //     const center = e.target.getCenter();
      //     const newPos = { lat: center.lat, lng: center.lng, name: position?.name || null };
      //     setPosition(newPos);
      //     onPositionChange(newPos);
      //   }
      // }
    });
    return null;
  };

  const handleManualLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lat = parseFloat(e.target.value);
    if (!position || isNaN(lat)) return;
    const newPos = { ...position, lat: lat };
    setPosition(newPos);
    onPositionChange(newPos);
  };

  const handleManualLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lng = parseFloat(e.target.value);
    if (!position || isNaN(lng)) return;
    const newPos = { ...position, lng: lng };
    setPosition(newPos);
    onPositionChange(newPos);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!position) return;
    const newPos = { ...position, name: name || null };
    setPosition(newPos);
    onPositionChange(newPos);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Current Location" }; // <--- ใส่ชื่อให้ Current Location
        setPosition(newPos);
        onPositionChange(newPos);
        if (mapRef.current) {
          mapRef.current.setView({ lat: newPos.lat, lng: newPos.lng }, 13);
        }
      }, (error) => {
        console.error("Error getting geolocation:", error);
        alert("Could not get your location. Please ensure location services are enabled.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div>
      {/* <--- เพิ่ม Input สำหรับ Location Name --- */}
      <div className="mb-2">
        <Input
          type="text"
          placeholder="Location Name (e.g., Office Building A)"
          value={position?.name || ''}
          onChange={handleNameChange}
          className="w-full"
          disabled={disabled}
        />
      </div>
      <div className={cn("h-[300px] w-full rounded-md overflow-hidden relative z-0", disabled && "opacity-50 pointer-events-none")}>
        <MapContainer
          center={position ? { lat: position.lat, lng: position.lng } : { lat: 13.736717, lng: 100.523186 }}
          zoom={position ? 13 : 6}
          scrollWheelZoom={!disabled}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => { mapRef.current = map; }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && position.lat && position.lng && <Marker position={{ lat: position.lat, lng: position.lng }} />}
          <MapEvents />
        </MapContainer>
      </div>
    </div>
  );
}
"use client";

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';

// ✅ Fix for default Leaflet icons
// ย้ายมาไว้ใน Component นี้แทน
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ✅ สร้าง Interface สำหรับ Props ที่จะรับเข้ามา
interface StaticMapViewProps {
  location: {
    lat: number;
    lng: number;
  };
  // เพิ่ม className เพื่อให้ Component แม่สามารถกำหนดขนาดได้
  className?: string;
}

export default function MapViewer({ location, className }: StaticMapViewProps) {
  // สร้างตัวแปร LatLngExpression เพื่อความชัดเจน
  const position: L.LatLngExpression = [location.lat, location.lng];

  return (
    // ✅ ใช้ className ที่รับมาจาก props หรือใช้ค่า default
    <div className={className || "h-[300px] w-full rounded-md overflow-hidden relative z-0"}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.png'
        />
        <Marker position={position} >
            <Popup>
                {location.name ? location.name + ' ' : ''}
            </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
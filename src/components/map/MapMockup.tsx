"use client";
import { useState, useEffect } from "react"; // 1. Import useEffect
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

// 2. --- แก้ไขปัญหา Icon เริ่มต้นของ Leaflet ---
import "leaflet/dist/images/marker-icon-2x.png";
import "leaflet/dist/images/marker-icon.png";
import "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: require("leaflet/dist/images/marker-icon.png").default,
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
});
// --- สิ้นสุดการแก้ไข ---

// 3. สร้าง custom icon ไว้ข้างนอก 1 ครั้ง เพื่อประสิทธิภาพ
const customMarkerIcon = L.icon({
  iconUrl: "https://www.reedps.com/wp-content/themes/bunker/src/media/neon-green.png",
  iconSize: [32, 32],
});

// 4. Component สำหรับ Routing ที่ปรับปรุงด้วย useEffect
const RoutingMachine = ({ waypoints } : { waypoints: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
      routeWhileDragging: false,
      show: false,
      lineOptions: {
    styles: [
      { color: "green", opacity: 0.9, weight: 2 , dashArray: '10,5', dashOffset: '0' },  
      // { color: "white", opacity: 0.5, weight: 6 } 

    ],
  },
      createMarker: function (i, waypoint) {
        return L.marker(waypoint.latLng, { icon: customMarkerIcon , draggable: false,}); 
      },
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, waypoints]);

  return null;
};


export default function MapMockup() {
  const [markers] = useState([
    { id: 1, position: [13.7563, 100.5018], popup: "Bangkok City Center" },
    { id: 2, position: [14.7367, 101.5239], popup: "Siam Square" },
  ]);

  const waypoints = markers.map((m) => m.position);

  return (
    <MapContainer
      center={markers[0].position} // Map จะเริ่มที่จุดนี้
      zoom={8}
      style={{ height: "100%", width: "100%", zIndex: 30}}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
      />

      {/* Routing */}
      <RoutingMachine waypoints={waypoints} />

      {/* Markers + Popup */}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={m.position}
          icon={customMarkerIcon} // ใช้งาน custom icon ที่สร้างไว้
        >
          <Popup>{m.popup}</Popup>
        </Marker>
      ))}

      {/* ไม่จำเป็นต้องใช้ <FlyToMarker /> แล้ว */}
    </MapContainer>
  );
}

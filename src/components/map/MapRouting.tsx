"use client";
import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// แก้ไขปัญหา Icon เริ่มต้นของ Leaflet
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

// สร้าง custom icons
const companyIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const jobLocationIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RoutingMachineProps {
  waypoints: [number, number][];
  onRouteFound?: (summary: { totalDistance: number; totalTime: number }) => void;
}

// Component สำหรับ Routing
const RoutingMachine = ({ waypoints, onRouteFound }: RoutingMachineProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    // @ts-ignore - Leaflet Routing Machine types
    const routingControl = L.Routing.control({
      waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
      routeWhileDragging: false,
      show: false, // ซ่อนแผงคำแนะนำเส้นทาง
      addWaypoints: false,
      lineOptions: {
        styles: [
          { color: "#3b82f6", opacity: 0.8, weight: 6 }, // สีน้ำเงินสำหรับเส้นทาง
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: function (_i: any, _waypoint: any, _n: any) {
        // ไม่สร้าง marker ผ่าน routing control เพราะเราจะสร้างเอง
        return null as any;
      },
    });

    routingControl.addTo(map);

    routingControl.on('routesfound', (e: any) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const summary = routes[0].summary;
        if (onRouteFound) {
          onRouteFound(summary);
        }
      }
    });

    // ปรับมุมมองแผนที่ให้เห็นเส้นทางทั้งหมด
    try {
      const bounds = L.latLngBounds(waypoints.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (e) {
      console.warn("Error fitting bounds:", e);
    }

    return () => {
      try {
        // @ts-ignore
        if (routingControl) {
          // ป้องกัน error จากการพยายาม update map ที่ถูก destroy ไปแล้ว
          routingControl.getPlan().setWaypoints([]);
          if (map) {
            map.removeControl(routingControl);
          }
        }
      } catch (e) {
        console.warn("Error removing routing control:", e);
      }
    };
  }, [map, waypoints, onRouteFound]);

  return null;
};

interface MapRoutingProps {
  companyLocation: { lat: number; lng: number; name?: string };
  jobLocation: { lat: number; lng: number; name?: string };
  className?: string;
}

export default function MapRouting({
  companyLocation,
  jobLocation,
  className,
}: MapRoutingProps) {
  const [routeSummary, setRouteSummary] = useState<{ totalDistance: number; totalTime: number } | null>(null);

  const waypoints = useMemo<[number, number][]>(() => [
    [companyLocation.lat, companyLocation.lng],
    [jobLocation.lat, jobLocation.lng],
  ], [companyLocation.lat, companyLocation.lng, jobLocation.lat, jobLocation.lng]);

  // คำนวณตำแหน่งกึ่งกลางสำหรับแผนที่
  const centerLat = (companyLocation.lat + jobLocation.lat) / 2;
  const centerLng = (companyLocation.lng + jobLocation.lng) / 2;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${companyLocation.lat},${companyLocation.lng}&destination=${jobLocation.lat},${jobLocation.lng}`;
    window.open(url, '_blank');
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} ม.`;
    return `${(meters / 1000).toFixed(1)} กม.`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} นาที`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ชม. ${remainingMinutes} นาที`;
  };

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Routing */}
        <RoutingMachine waypoints={waypoints} onRouteFound={setRouteSummary} />

        {/* Marker สำหรับบริษัท */}
        <Marker
          position={[companyLocation.lat, companyLocation.lng]}
          icon={companyIcon}
        >
          <Popup>
            <div className="font-medium">
              {companyLocation.name || "บริษัท"}
            </div>
            <div className="text-xs text-muted-foreground">
              จุดเริ่มต้น
            </div>
          </Popup>
        </Marker>

        {/* Marker สำหรับสถานที่ทำงาน */}
        <Marker
          position={[jobLocation.lat, jobLocation.lng]}
          icon={jobLocationIcon}
        >
          <Popup>
            <div className="font-medium">
              {jobLocation.name || "สถานที่ทำงาน"}
            </div>
            <div className="text-xs text-muted-foreground">
              ปลายทาง
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Route Info Overlay */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <Button
          size="sm"
          className="bg-white text-black hover:bg-gray-100 shadow-md gap-2"
          onClick={handleOpenGoogleMaps}
        >
          <ExternalLink className="h-4 w-4" />
          เปิดใน Google Maps
        </Button>
      </div>

      {routeSummary && (
        <div className="absolute bottom-4 left-4 z-[400] bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg max-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">ข้อมูลการเดินทาง</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ระยะทาง:</span>
              <span className="font-medium">{formatDistance(routeSummary.totalDistance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">เวลา:</span>
              <span className="font-medium">{formatTime(routeSummary.totalTime)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

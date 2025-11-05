"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L, { LatLngTuple, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { CircleCheck, CircleDotDashed, Clock2, SearchIcon } from "lucide-react";
// import { Input } from "../ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "../ui/input-group";
import { Select, SelectGroup, SelectItem , SelectContent, SelectTrigger, SelectValue} from "../ui/select";
// import { SelectContent, SelectTrigger, SelectValue } from "@radix-ui/react-select";

// --- Icon Fix ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconHome: "/mark-home.png",
  iconBuilding: "/mark-building.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [40, 60],
  iconAnchor: [20, 60],
  popupAnchor: [0, -40],
});

// --- Types ---
type LocationStatus = "pending" | "progress" | "completed";

interface LocationData {
  id: number;
  position: LatLngTuple;
  title: string;
  description: string;
  status: LocationStatus;
  radius: number;
  nature: string;
}

// --- Initial Data ---
const initialLocations: LocationData[] = [
  {
    id: 1,
    position: [13.736717, 100.523186],
    title: "Bangkok",
    description: "ศูนย์กลางกรุงเทพฯ",
    status: "pending",
    nature: "building",
    radius: 500,
  },
  {
    id: 2,
    nature: "home",
    position: [13.7563, 100.5018],
    title: "Siam",
    description: "ย่านช็อปปิ้ง",
    status: "progress",
    radius: 300,
  },
  {
    id: 3,
    nature: "building",
    position: [13.73, 100.7756],
    title: "Don Mueang",
    description: "ท่าอากาศยานดอนเมือง",
    status: "completed",
    radius: 700,
  },
  {
    id: 4,
    nature: "home",
    position: [13.74, 100.52],
    title: "Lumphini Park",
    description: "สวนสาธารณะใจกลางเมือง",
    status: "progress",
    radius: 400,
  },
  {
    id: 5,
    nature: "building",
    position: [13.738, 100.525],
    title: "Silom",
    description: "ย่านธุรกิจ",
    status: "pending",
    radius: 600,
  },
  {
    id: 6,
    nature: "home",
    position: [13.708, 100.515],
    title: "Silom",
    description: "ย่านธุรกิจ",
    status: "pending",
    radius: 600,
  },
  {
    id: 7,
    nature: "building",
    position: [13.732, 100.535],
    title: "Silom",
    description: "ย่านธุรกิจ",
    status: "pending",
    radius: 600,
  },
];

const statusColors: Record<LocationStatus, string> = {
  pending: "orange",
  progress: "blue",
  completed: "green",
};
const statusIcons: Record<LocationStatus, any> = {
  pending: <CircleDotDashed />,
  progress: <Clock2 />,
  completed: <CircleCheck />,
};

// --- Helper Components ---
function FitBounds({ locations }: { locations: LocationData[] }) {
  const map = useMap();
  useEffect(() => {
    if (!locations || locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((loc) => loc.position));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [locations, map]);
  return null;
}

function MapController({
  mapRef,
  onMapReady,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  onMapReady: (map: LeafletMap) => void;
}) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    onMapReady(map);
  }, [map, mapRef, onMapReady]);

  return null;
}

interface MarkersProps {
  locations: LocationData[];
}
function Markers({ locations }: MarkersProps) {
  const map = useMap();

  useEffect(() => {
    const markers: L.Marker[] = [];
    const circles: L.Circle[] = [];

    locations.forEach((loc) => {
      // ✅ ตรวจ nature แล้วเลือก icon ที่เหมาะสม
      const iconUrl =
        loc.nature === "home" ? "/mark-home.png" : "/mark-building.png";

      const customIcon = L.icon({
        iconUrl,
        iconSize: [40, 60],
        iconAnchor: [20, 60],
        popupAnchor: [0, -50],
        shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
      });

      // ✅ ใช้ custom icon กับ marker
      const marker = L.marker(loc.position, { icon: customIcon }).addTo(map);
      marker.bindTooltip(loc.title);

      const popupContent = document.createElement("div");
      popupContent.innerHTML = `
        <h3>${loc.title}</h3>
        <p>${loc.description}</p>
        <p>สถานะ: ${loc.status}</p>
        <p>ประเภท: ${loc.nature}</p>
      `;
      marker.bindPopup(popupContent);
      markers.push(marker);

      const statusCircle = L.circle(loc.position, {
        radius: loc.radius,
        color: statusColors[loc.status],
        fillOpacity: 0.2,
      }).addTo(map);
      circles.push(statusCircle);
    });

    return () => {
      markers.forEach((m) => map.removeLayer(m));
      circles.forEach((c) => map.removeLayer(c));
    };
  }, [locations, map]);

  return null;
}

// --- Main Page Component ---
export default function LeafletMapPage() {
  const [locations] = useState<LocationData[]>(initialLocations);
  const [landmarkSearch, setLandmarkSearch] = useState<string>("");
  const [natureFilter, setNatureFilter] = useState<string>("all"); // 👈 เพิ่ม state สำหรับ nature

  const mapRef = useRef<LeafletMap | null>(null);

  // ✅ filter ทั้งชื่อ + nature
  const filteredLocations = locations.filter(
    (loc) =>
      loc.title.toLowerCase().includes(landmarkSearch.toLowerCase()) &&
      (natureFilter === "all" || loc.nature === natureFilter)
  );

  //   const filteredLocations = locations.filter((loc) =>
  //     loc.title.toLowerCase().includes(landmarkSearch.toLowerCase())
  //   );

  const handleZoomToLocation = (loc: LocationData) => {
    const map = mapRef.current;
    if (!map) return;

    // ซูมไปที่ตำแหน่งด้วย flyTo
    map.flyTo(loc.position, 15, {
      animate: true,
      duration: 1.5,
    });

    // เปิด Popup ของ Marker
    setTimeout(() => {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const position = layer.getLatLng();
          if (
            position.lat === loc.position[0] &&
            position.lng === loc.position[1]
          ) {
            layer.openPopup();
          }
        }
      });
    }, 1600);

    // เลื่อน Sidebar ให้เห็นรายการที่เลือก
    const element = document.getElementById(`landmark-${loc.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="w-full h-[89vh] rounded-xl overflow-clip relative">
      {/* Map */}
      <MapContainer
        center={[13.736717, 100.523186]}
        zoom={12}
        className="w-full h-full"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController mapRef={mapRef} onMapReady={() => {}} />
        <FitBounds locations={filteredLocations} />
        <Markers locations={filteredLocations} />
      </MapContainer>

      {/* Floating Sidebar */}
      <aside className="absolute space-y-2 top-0 left-0 w-82 dark:bg-background/50 text-white backdrop-blur-sm rounded-lg shadow-lg overflow-y-auto p-4 max-h-[calc(100vh-2rem)] z-[1000]">
        <InputGroup>
          <InputGroupInput
            type="text"
            placeholder="ค้นหา landmark..."
            value={landmarkSearch}
            onChange={(e) => setLandmarkSearch(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <Select
          value={natureFilter}
          onValueChange={(value) => setNatureFilter(value)}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="all" />
            </SelectTrigger>
          <SelectContent>
              <SelectGroup>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="home">🏠 บ้าน (Home)</SelectItem>
                  <SelectItem value="building">🏢 อาคาร (Building)</SelectItem>
              </SelectGroup>
          </SelectContent>
        </Select>

        <div className="flex flex-col w-full gap-2">
          {filteredLocations.map((loc) => (
            <Card
              key={loc.id}
              id={`landmark-${loc.id}`}
              className="w-full text-left px-3 py-2 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => handleZoomToLocation(loc)}
            >
              <div>
                <img
                  src="https://cdn.forevervacation.com/uploads/blog/best-resorts-in-bangkok-3472.jpg"
                  alt=""
                />
              </div>

              <div className="flex flex-col w-full gap-2">
                <span className="flex justify-between items-center">
                  {loc.title}
                  <Badge
                    style={{
                      background: statusColors[loc.status],
                      fontSize: "8px",
                    }}
                    className="text-white"
                  >
                    {statusIcons[loc.status]}

                    {loc.status}
                  </Badge>
                </span>
                <p className="text-sm dark:text-white/50 text-black/50">
                  {loc.description}
                </p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={
                      loc.status === "pending"
                        ? 30
                        : loc.status === "progress"
                        ? 70
                        : 100
                    }
                  />
                  <span className="text-xs">
                    {loc.status === "pending"
                      ? 30
                      : loc.status === "progress"
                      ? 70
                      : 100}
                    %
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </aside>
    </div>
  );
}

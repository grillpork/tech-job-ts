"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L, { LatLngTuple, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useJobStore, type Job } from "@/stores/features/jobStore";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CircleCheck,
  CircleDotDashed,
  Clock2,
  Home,
  SearchIcon,
} from "lucide-react";
// import { Input } from "../ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "../ui/input-group";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  id: string; // เปลี่ยนจาก number เป็น string เพื่อใช้ job.id
  position: LatLngTuple;
  title: string;
  description: string;
  status: LocationStatus;
  radius: number;
  nature: string;
  locationImage: string;
  jobId?: string; // เพิ่ม jobId เพื่ออ้างอิงกลับไปยัง job
}

// --- Helper: Map Job to LocationData ---
const mapJobToLocationData = (job: Job, index: number): LocationData => {
  // Map job status to location status
  const statusMap: Record<Job["status"], LocationStatus> = {
    pending: "pending",
    in_progress: "progress",
    pending_approval: "pending",
    completed: "completed",
    cancelled: "pending",
    rejected: "pending",
  };

  // Determine nature from job type or default to "building"
  const getNature = (type: "บ้าน" | "คอนโด" | null | undefined): string => {
    if (type === "บ้าน") {
      return "home";
    }
    // ถ้าเป็น "คอนโด" หรือไม่มี type ให้เป็น "building"
    return "building";
  };

  // Default image
  const defaultImage = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";

  return {
    id: job.id,
    position: [job.location!.lat, job.location!.lng] as LatLngTuple,
    title: job.title,
    description: job.description || job.location?.name || "ไม่มีคำอธิบาย",
    status: statusMap[job.status],
    radius: 500, // Default radius
    nature: getNature(job.type),
    locationImage: job.locationImages && job.locationImages.length > 0 ? job.locationImages[0] : defaultImage,
    jobId: job.id,
  };
};

const statusColors: Record<LocationStatus, string> = {
  pending: "bg-amber-400",
  progress: "bg-blue-400",
  completed: "bg-green-400",
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
        <image src="${loc.locationImage}" alt="${loc.title}"/>
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
  const { jobs } = useJobStore();
  const [landmarkSearch, setLandmarkSearch] = useState<string>("");
  const [natureFilter, setNatureFilter] = useState<string>("all");

  const mapRef = useRef<LeafletMap | null>(null);

  // ✅ ดึง jobs ที่มี location และแปลงเป็น LocationData
  const locations = useMemo(() => {
    return jobs
      .filter((job) => job.location && job.location.lat != null && job.location.lng != null)
      .map((job, index) => mapJobToLocationData(job, index));
  }, [jobs]);

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
      duration: 4,
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
    <div className="w-full h-screen relative">
      {/* Map */}
      <MapContainer
        center={[13.736717, 100.523186]}
        zoom={12}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController mapRef={mapRef} onMapReady={() => {}} />
        <FitBounds locations={filteredLocations} />
        <Markers locations={filteredLocations} />
      </MapContainer>

      {/* Floating Sidebar */}
      <aside className="absolute bottom-0 sm:top-0 left-0 sm:right-0 max-w-full sm:max-h-full sm:max-w-sm overflow-y-scroll sm:overflow-x-auto max-h-[calc(100vh-2rem)] z-[1000]">
        <div className="sticky left-0 top-0 flex flex-col gap-1.5 bg-gradient-to-r from-background to-background/50 px-4 backdrop-blur-sm  py-2">
          <InputGroup>
            <InputGroupInput
              type="text"
              placeholder="ค้นหา landmark..."
              value={landmarkSearch}
              onChange={(e) => setLandmarkSearch(e.target.value)}
              className="w-full"
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
                <SelectItem value="home"><Home/>บ้าน</SelectItem>
                <SelectItem value="building"><Building/>อาคาร</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-row h-full sm:flex-col w-full gap-2 p-2 bg-gradient-to-r from-background to-background/50 ">
          {filteredLocations.map((loc) => (
            <Card
              key={loc.id}
              id={`landmark-${loc.id}`}
              className="w-full flex sm:flex-row text-left px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleZoomToLocation(loc)}
            >
              <div className="hidden sm:flex ">
                <img
                  src={loc.locationImage}
                  alt={loc.title}
                  className="object-cover w-[200px] rounded-sm"
                />
              </div>

              <div className="flex flex-col w-full gap-2">
                <Badge
                 
                  className={`bg-transparent outline ${statusColors[loc.status]}`}
                >
                  {statusIcons[loc.status]}

                  {loc.status}
                </Badge>
                <p className="text-sm font-bold line-clamp-1">{loc.title}</p>
                <p className="text-sm dark:text-white/50 text-black/50 line-clamp-2">
                  {loc.description}
                </p>
                
              </div>
            </Card>
          ))}
        </div>
      </aside>
    </div>
  );
}

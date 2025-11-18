"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import 'dayjs/locale/th';

// Zustand Store
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useJobStore } from "@/stores/features/jobStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Package,
  MapPin,
  DollarSign,
  User,
  ArrowLeft,
  Calendar,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { Loader2 } from "lucide-react";

dayjs.locale('th');

const getStatusVariant = (status: string) => {
  switch (status) {
    case "พร้อมใช้":
      return "default";
    case "ใกล้หมด":
      return "outline";
    case "หมด":
      return "destructive";
    default:
      return "default";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "พร้อมใช้":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "ใกล้หมด":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "หมด":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getJobStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending_approval':
      return 'secondary';
    case 'in_progress':
      return 'outline';
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    default:
      return 'default';
  }
};

const getJobStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "in_progress":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "pending_approval":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "cancelled":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case "rejected":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getJobStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "รอดำเนินการ",
    in_progress: "กำลังดำเนินการ",
    pending_approval: "รออนุมัติ",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
    rejected: "ปฏิเสธ",
  };
  return statusMap[status] || status;
};

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inventoryId = params.id as string;

  const { inventories, getInventoryRequestStatus } = useInventoryStore();
  const { jobs } = useJobStore();

  // หา inventory ตาม id
  const inventory = inventories.find((inv) => inv.id === inventoryId);

  // หา jobs ที่ใช้ inventory นี้และได้รับการอนุมัติการเบิกวัสดุแล้วเท่านั้น
  const jobsUsingThisInventory = jobs.filter((job) => {
    // ตรวจสอบว่า job ใช้ inventory นี้
    const usesInventory = job.usedInventory?.some((usedInv) => usedInv.id === inventoryId);
    if (!usesInventory) return false;
    
    // ตรวจสอบว่าได้รับการอนุมัติแล้ว
    const requestStatus = getInventoryRequestStatus(job.id);
    return requestStatus === "approved";
  });

  // สร้างข้อมูล job พร้อมจำนวนที่ใช้
  const jobsWithQuantity = jobsUsingThisInventory.map((job) => {
    const usedItem = job.usedInventory?.find((usedInv) => usedInv.id === inventoryId);
    return {
      job,
      quantity: usedItem?.qty || 0,
    };
  });

  if (!inventory) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">กำลังโหลดรายละเอียดวัสดุ...</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inventory Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={getStatusVariant(inventory.status)} 
                      className="capitalize"
                    >
                      {inventory.status}
                    </Badge>
                    <Badge variant="outline">
                      {inventory.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">{inventory.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Inventory ID: </span>
                    {inventory.id}
                  </p>
                </div>
                {inventory.imageUrl && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border">
                    <img
                      src={inventory.imageUrl}
                      alt={inventory.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Section */}
              {inventory.imageUrl && (
                <div className="hidden lg:block">
                  <p className="text-sm text-muted-foreground mb-2">รูปภาพ</p>
                  <div className="rounded-lg overflow-hidden border max-w-md">
                    <img
                      src={inventory.imageUrl}
                      alt={inventory.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    จำนวนคงเหลือ
                  </p>
                  <p className="text-2xl font-bold">{inventory.quantity}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    สถานที่จัดเก็บ
                  </p>
                  <p className="text-lg font-medium">{inventory.location}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    ราคา
                  </p>
                  <p className="text-lg font-medium">
                    {inventory.price.toLocaleString('th-TH')} บาท
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ใช้สำหรับ
                  </p>
                  <p className="text-lg font-medium">{inventory.requireFrom || 'N/A'}</p>
                </div>
              </div>

              {/* Status Details */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">สถานะ</p>
                <Badge 
                  className={`${getStatusColor(inventory.status)} px-3 py-1`}
                >
                  {inventory.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Jobs History */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  ประวัติการเบิกใช้
                </CardTitle>
                {jobsWithQuantity.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {jobsWithQuantity.length} ใบงาน
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {jobsWithQuantity.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ใบงาน</TableHead>
                          <TableHead>จำนวน</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobsWithQuantity.map(({ job, quantity }) => (
                          <TableRow
                            key={job.id}
                            className="cursor-pointer hover:bg-secondary"
                            onClick={() => router.push(`/dashboard/(employee)/employee/jobs/${job.id}`)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {job.title}
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{quantity}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getJobStatusVariant(job.status)}
                                className={`text-xs ${getJobStatusColor(job.status)}`}
                              >
                                {getJobStatusLabel(job.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {jobsWithQuantity.map(({ job, quantity }) => (
                      <div
                        key={job.id}
                        className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-secondary transition-colors"
                        onClick={() => router.push(`/dashboard/(employee)/employee/jobs/${job.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium flex-1">{job.title}</h4>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">จำนวนที่ใช้:</span>
                          <span className="font-semibold">{quantity}</span>
                        </div>
                        <div>
                          <Badge
                            variant={getJobStatusVariant(job.status)}
                            className={`text-xs ${getJobStatusColor(job.status)}`}
                          >
                            {getJobStatusLabel(job.status)}
                          </Badge>
                        </div>
                        {job.createdAt && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dayjs(job.createdAt).format('DD/MM/YYYY')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีประวัติการเบิกใช้วัสดุนี้
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


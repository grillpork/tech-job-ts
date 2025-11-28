"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import useEmblaCarousel from 'embla-carousel-react';
import { toast } from "sonner";

// Zustand Store
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useSignatureStore } from "@/stores/features/signatureStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  MapPin,
  Calendar,
  User,
  Phone,
  Hash,
  FileText,
  Briefcase,
  Building,
  Users,
  UserCheck,
  Package,
  History,
  ImageIcon,
  Paperclip,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CalendarRange,
  CheckCircle2,
  AlertCircle,
  Building2,
  Receipt,
  PenIcon,
  Trash2
} from "lucide-react";

import dynamic from 'next/dynamic';
import { useParams } from "next/navigation";

const MapRouting = dynamic(
  () => import('@/components/map/MapRouting'),
  {
    loading: () => (
      <div className="h-[300px] w-full flex items-center justify-center bg-secondary/20 rounded-md border border-dashed">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading Map...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
);

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default'; // Usually black/primary
    case 'pending_approval':
      return 'secondary';
    case 'in_progress':
      return 'outline'; // Often used for active states
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-500/15 text-emerald-700 border-emerald-200';
    case 'in_progress': return 'bg-blue-500/15 text-blue-700 border-blue-200';
    case 'pending_approval': return 'bg-amber-500/15 text-amber-700 border-amber-200';
    case 'cancelled': return 'bg-rose-500/15 text-rose-700 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500/15 text-red-700 border-red-200';
    case 'high': return 'bg-orange-500/15 text-orange-700 border-orange-200';
    case 'medium': return 'bg-blue-500/15 text-blue-700 border-blue-200';
    case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

// Location Images Carousel Component
function LocationImagesCarousel({ images }: { images: string[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);


  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-lg border bg-muted/30" ref={emblaRef}>
        <div className="flex">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 relative aspect-video"
            >
              <img
                src={imageUrl}
                alt={`Location image ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                onClick={() => window.open(imageUrl, '_blank')}
              />
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            onClick={scrollNext}
            disabled={nextBtnDisabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 p-1 rounded-full bg-black/20 backdrop-blur-sm">
            {images.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all ${selectedIndex === index
                  ? 'w-4 bg-white'
                  : 'w-1.5 bg-white/50'
                  }`}
                onClick={() => emblaApi?.scrollTo(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function JobViewPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const getJobById = useJobStore((state) => state.getJobById);
  const { inventories } = useInventoryStore();
  const { getSignature, removeSignature } = useSignatureStore();
  const job = getJobById(jobId);

  // State เพื่อ force re-render เมื่อลบ signature
  const [signatureDeleted, setSignatureDeleted] = useState(false);

  // ดึง signature ที่ถูกต้องตาม jobId
  const savedSignature = job && !signatureDeleted ? getSignature(`job-signature-${job.id}`) : undefined;
  const displaySignature = job?.signature || savedSignature;

  // Handler สำหรับลบ signature
  const handleRemoveSignature = () => {
    if (!job) return;

    // ตรวจสอบว่ามี signature ที่บันทึกไว้หรือไม่
    if (!savedSignature) {
      toast.error("ไม่พบลายเซ็นที่บันทึกไว้");
      return;
    }

    // ลบ signature จาก localStorage
    removeSignature(`job-signature-${job.id}`);

    // Update state เพื่อ force re-render
    setSignatureDeleted(true);

    toast.success("ลบลายเซ็นเรียบร้อยแล้ว");
  };

  if (!job) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-lg font-medium">Loading job details...</p>
      </div>
    );
  }

  dayjs.locale('th');
  const jobCreatorName = job.creatorName || job.creator?.name || "-";

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8">


      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b pb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`px-3 py-1 text-sm font-medium capitalize border ${getStatusColor(job.status)}`}>
              {job.status.replace(/_/g, ' ')}
            </Badge>
            {job.priority && (
              <Badge variant="outline" className={`px-3 py-1 text-sm font-medium capitalize border ${getPriorityColor(job.priority)}`}>
                ความสำคัญ {job.priority}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1 ml-2">
              <Hash className="h-3.5 w-3.5" />
              {job.id.substring(0, 8)}
            </span>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary/70" />
                <span>ผู้สร้างใบงาน : <span className="font-medium text-foreground">{jobCreatorName}</span></span>
              </div>
              {/* <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary/70" />
                <span>หัวหน้าช่าง : <span className="font-medium text-foreground">{job.leadTechnician?.name ?? "ยังไม่ได้กำหนด"}</span></span>
              </div> */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/70" />
                <span>วันที่สร้าง : {dayjs(job.createdAt).format('DD MMM YYYY')}</span>
              </div>
              {job.departments && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary/70" />
                  <span>แผนก : {Array.isArray(job.departments) ? job.departments.join(", ") : (job.departments || job.departments)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- Left Column (Main Info) --- */}
        <div className="lg:col-span-2 space-y-8">

          {/* 1. Customer & Location (High Priority) */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                สถานที่ปฏิบัติงานและลูกค้า
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Info Grid */}
              <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-4">
                {/* Basic Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-background rounded-full shadow-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ชื่อลูกค้า</p>
                      <p className="font-medium">{job.customerName || "ไม่ระบุ"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-background rounded-full shadow-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">เบอร์โทรศัพท์</p>
                      <p className="font-medium">{job.customerPhone || "ไม่ระบุ"}</p>
                    </div>
                  </div>
                </div>

                {/* Organization Details (Conditional) */}
                {job.customerType === 'organization' && (
                  <>
                    <Separator className="bg-border/50" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-background rounded-full shadow-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ชื่อบริษัท</p>
                          <p className="font-medium">{job.customerCompanyName || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-background rounded-full shadow-sm">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">เลขประจำตัวผู้เสียภาษี</p>
                          <p className="font-medium">{job.customerTaxId || "-"}</p>
                        </div>
                      </div>
                      {job.customerAddress && (
                        <div className="col-span-full flex items-start gap-3">
                          <div className="p-2 bg-background rounded-full shadow-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ที่อยู่บริษัท</p>
                            <p className="font-medium text-sm leading-relaxed">{job.customerAddress}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Map & Location */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    รายละเอียดสถานที่
                  </h4>
                  {job.location?.lat && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {job.location.lat.toFixed(5)}, {job.location.lng.toFixed(5)}
                    </Badge>
                  )}
                </div>

                {job.location && job.location.lat != null && job.location.lng != null ? (
                  <MapRouting
                    companyLocation={{
                      lat: 13.7563,
                      lng: 100.5018,
                      name: "สำนักงานใหญ่"
                    }}
                    jobLocation={{
                      lat: job.location.lat,
                      lng: job.location.lng,
                      name: job.location.name || "สถานที่ปฏิบัติงาน"
                    }}
                    className="h-[300px] w-full rounded-lg overflow-hidden border shadow-sm"
                  />
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg border border-dashed text-muted-foreground">
                    <MapPin className="h-8 w-8 opacity-20 mr-2" />
                    <span>ไม่มีข้อมูลสถานที่</span>
                  </div>
                )}

                {job.locationImages && job.locationImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      รูปภาพสถานที่
                    </p>
                    <LocationImagesCarousel images={job.locationImages} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. Job Description & Details */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                รายละเอียดงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">ประเภทงาน</p>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{job.type || "ทั่วไป"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">กำหนดการ</p>
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {job.startDate ? dayjs(job.startDate).format('DD/MM/YY') : 'รอระบุ'}
                      {' - '}
                      {job.endDate ? dayjs(job.endDate).format('DD/MM/YY') : 'รอระบุ'}
                    </span>
                  </div>
                </div>
              </div>

              {job.description && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">รายละเอียดเพิ่มเติม</p>
                  <div className="p-4 bg-muted/30 rounded-lg border text-sm leading-relaxed">
                    {job.description}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {job.attachments && job.attachments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    ไฟล์แนบ ({job.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {job.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 hover:border-accent transition-all group"
                      >
                        <div className="p-2 bg-background rounded-md border group-hover:border-primary/30 transition-colors">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB • {dayjs(attachment.uploadedAt).format('DD MMM')}
                          </p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>



          {/* 3. Execution Evidence (Before/After) */}
          {(job.beforeImages && job.beforeImages.length > 0 || job.afterImages && job.afterImages.length > 0) && (
            <Card className="shadow-sm border-none ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  หลักฐานการทำงาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {job.beforeImages && job.beforeImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">ก่อนทำ</Badge>
                      <span className="text-xs text-muted-foreground">รูปภาพก่อนเริ่มงาน</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {job.beforeImages.map((imageUrl, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg border overflow-hidden bg-muted">
                          <img
                            src={imageUrl}
                            alt={`Before ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => window.open(imageUrl, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {job.beforeImages && job.beforeImages.length > 0 && job.afterImages && job.afterImages.length > 0 && <Separator />}

                {job.afterImages && job.afterImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">หลังทำ</Badge>
                      <span className="text-xs text-muted-foreground">รูปภาพหลังงานเสร็จสิ้น</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {job.afterImages.map((imageUrl, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg border overflow-hidden bg-muted">
                          <img
                            src={imageUrl}
                            alt={`After ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => window.open(imageUrl, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(() => {
                  // Check for signature in job data (submitted) or localStorage (saved but not submitted)
                  const submittedSignature = job.signature;
                  const savedSignature = getSignature(`job-signature-${job.id}`);
                  const displaySignature = submittedSignature || savedSignature;

                  if (!displaySignature) return null;

                  return (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          ลายเซ็นลูกค้า
                        </p>
                        {submittedSignature ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            ส่งแล้ว
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            บันทึกแล้ว (ยังไม่ได้ส่ง)
                          </Badge>
                        )}
                      </div>
                      <div className="inline-block border rounded-lg p-4 bg-white shadow-sm">
                        <img
                          src={displaySignature}
                          alt="Customer Signature"
                          className="h-24 object-contain"
                        />
                      </div>
                      {!submittedSignature && savedSignature && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          ลายเซ็นนี้ถูกบันทึกไว้ในเครื่องแต่ยังไม่ได้ส่ง กดจบงานเพื่อส่งข้อมูล
                        </p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* --- Right Column (Sidebar) --- */}
        <div className="space-y-6">

          {/* Team Card */}
          <Card className="shadow-sm border-none ring-1 ring-border/50 gap-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                ทีมที่ได้รับมอบหมาย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> หัวหน้าช่าง
                </p>
                {job.leadTechnician ? (
                  <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={job.leadTechnician.imageUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{job.leadTechnician.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{job.leadTechnician.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic pl-2">ยังไม่ได้กำหนด</span>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">สมาชิกในทีม</p>
                {job.assignedEmployees.length > 0 ? (
                  <div className="space-y-1">
                    {job.assignedEmployees.map(employee => (
                      <div key={employee.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage src={employee.imageUrl || ""} />
                          <AvatarFallback className="text-xs">{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{employee.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic pl-2">ไม่มีสมาชิกอื่น</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="p-4">
            {
              displaySignature && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <PenIcon size={16} />
                      ลายเซ็นต์ลูกค้า
                    </p>
                    {/* แสดงปุ่มลบเฉพาะเมื่อมี savedSignature (ยังไม่ได้ submit) */}
                    {job.signature && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveSignature}
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        ลบลายเซ็น
                      </Button>
                    )}
                  </div>
                  <div className="p-0 overflow-clip border rounded-lg bg-muted/30">
                    <img
                      src={displaySignature}
                      alt="signature"
                      className="w-full object-cover"
                    />
                  </div>
                  {/* แสดงสถานะ */}
                  {savedSignature && !job.signature && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>บันทึกไว้แล้ว แต่ยังไม่ได้ส่งคำขอจบงาน</span>
                    </div>
                  )}
                  {job.signature && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>ส่งคำขอจบงานแล้ว</span>
                    </div>
                  )}

                </div>

              )
            }
            {
              !displaySignature && (
                <p className="text-xs text-muted-foreground italic pl-2">ไม่มีลายเซ็นที่บันทึกไว้</p>
              )
            }
          </Card>

          {/* Inventory Card */}
          <Card className="shadow-sm border-none ring-1 ring-border/50 gap-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-primary" />
                  อุปกรณ์ที่ใช้
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-normal">
                  {job.usedInventory?.length || 0} รายการ
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {job.usedInventory && job.usedInventory.length > 0 ? (
                <div className="space-y-3">
                  {job.usedInventory.map((usedInv) => {
                    const item = inventories.find((inv) => inv.id === usedInv.id);
                    if (!item) return null;
                    return (
                      <div key={usedInv.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/20 text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <span className="truncate font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold">{usedInv.qty}</span>
                          <span className="text-xs text-muted-foreground">หน่วย</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
                  ไม่มีการใช้อุปกรณ์
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Log Card */}
          <Card className="shadow-sm border-none ring-1 ring-border/50 gap-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-primary" />
                ประวัติการทำงาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 border-l space-y-6">
                {job.workLogs && job.workLogs.length > 0 ? (
                  job.workLogs.map((log, idx) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border bg-background ring-4 ring-background" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {dayjs(log.date).format('DD MMM HH:mm')}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">
                            {log.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{log.note}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">{log.updatedBy.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{log.updatedBy.name}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic pl-2">ไม่มีประวัติการทำงาน</div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
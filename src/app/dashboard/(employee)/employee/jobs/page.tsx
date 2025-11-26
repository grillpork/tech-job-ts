"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { MoreHorizontal, Search, User, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import SignaturePad, { SignaturePadRef } from "@/components/signature/SignaturePad";

// Zustand Store
import { useJobStore } from "@/stores/features/jobStore";
import { useUserStore } from "@/stores/features/userStore";
import { useSignatureStore } from "@/stores/features/signatureStore";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type
import { Job } from "@/lib/types/job";

export default function JobManagementPage() {
  const router = useRouter();

  const allJobs = useJobStore((state) => state.jobs);
  const updateJob = useJobStore((state) => state.updateJob);
  const requestJobCompletion = useJobStore((state) => state.requestJobCompletion);
  const { currentUser } = useUserStore();
  const { saveSignature, removeSignature } = useSignatureStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const signatureRef = useRef<SignaturePadRef>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = (job: Job) => {
    setJobToDelete(job);
    setSignatureData(null);
    setIsCompleteDialogOpen(true);
  };

  // -------------------- Signature Logic --------------------

  const getSignatureImage = () => {
    const ref = signatureRef.current;
    if (!ref) return null;

    // Check if signature pad is empty
    if (ref.isEmpty()) return null;

    const dataURL = ref.toDataURL("image/png");

    // Validate data URL
    if (!dataURL || dataURL.length < 50) return null;

    return dataURL;
  };

  const checkSignature = React.useCallback(() => {
    const result = getSignatureImage();
    setSignatureData(result);
  }, []);

  useEffect(() => {
    if (!isCompleteDialogOpen) return;

    const interval = setInterval(() => {
      checkSignature();
    }, 300);

    return () => clearInterval(interval);
  }, [isCompleteDialogOpen, checkSignature]);

  const handleSignatureEnd = () => {
    setTimeout(() => checkSignature(), 80);
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData(null);
      // Clear from localStorage
      if (jobToDelete) {
        removeSignature(`job-signature-${jobToDelete.id}`);
      }
    }
  };

  // ฟังก์ชันบันทึกลายเซ็นลง localStorage
  const handleSaveSignature = () => {
    const latest = getSignatureImage();

    if (!latest) {
      toast.error("กรุณาลงลายเซ็นก่อนบันทึก");
      return;
    }

    if (!jobToDelete) {
      toast.error("ไม่พบข้อมูลงาน");
      return;
    }

    // บันทึกลายเซ็นลง localStorage
    saveSignature(`job-signature-${jobToDelete.id}`, latest);
    setSignatureData(latest);
    toast.success("บันทึกลายเซ็นเรียบร้อยแล้ว");
  };

  // ฟังก์ชันยืนยันการ Complete งาน
  const confirmComplete = async () => {
    if (!signatureData) {
      toast.error("กรุณาบันทึกลายเซ็นก่อนทำการ Complete");
      return;
    }

    if (!currentUser) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    if (jobToDelete) {
      setIsCompleting(true);
      try {
        // ส่งคำขอจบงาน
        requestJobCompletion(
          jobToDelete.id,
          { id: currentUser.id, name: currentUser.name },
          signatureData
        );

        toast.success("ส่งคำขอจบงานแล้ว รอการอนุมัติจากหัวหน้าช่าง");

        setIsCompleteDialogOpen(false);
        setSignatureData(null);

        if (signatureRef.current) {
          signatureRef.current.clear();
        }

      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการส่งคำขอจบงาน");
      } finally {
        setIsCompleting(false);
      }
    }
  };


  const handleEditJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // 10. หยุด event click ไม่ให้ลามไปถึง row
    router.push(`/dashboard/employee/jobs/${jobId}/edit`);
  };

  // กรองเฉพาะงานที่ถูกมอบหมายให้ employee คนนี้
  const assignedJobs = allJobs.filter((job) => {
    if (!currentUser) return false;
    // ตรวจสอบว่า currentUser อยู่ใน assignedEmployees หรือไม่
    return job.assignedEmployees?.some(emp => emp.id === currentUser.id) || false;
  });

  // กรองตาม search term
  const filteredJobs = assignedJobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // แยกงานออกเป็น 2 กลุ่ม
  const activeJobs = filteredJobs.filter(
    (job) =>
      job.status === "pending" ||
      job.status === "in_progress" ||
      job.status === "pending_approval" ||
      job.status === "rejected" // งานที่ถูก reject ต้องแก้ไขใหม่และส่งคำขอใหม่ได้
  );

  const completedJobs = filteredJobs.filter(
    (job) =>
      job.status === "completed" ||
      job.status === "cancelled"
  );

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Header */}
      <div className="flex flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* งานใหม่ */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">งานใหม่</h2>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeJobs.length > 0 ? (
                activeJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onView={(id) =>
                      router.push(`/dashboard/employee/jobs/${id}`)
                    }
                    onEdit={(id) =>
                      router.push(`/dashboard/employee/jobs/edit/${id}`)
                    }
                    onDelete={handleComplete}
                    showCompleteButton={true}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  <p>ไม่มีงานใหม่</p>
                </div>
              )}
            </div>
          </CardContent>
        </div>

        {/* งานที่ทำเสร็จแล้ว */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">งานที่ทำเสร็จแล้ว</h2>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedJobs.length > 0 ? (
                completedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onView={(id) =>
                      router.push(`/dashboard/employee/jobs/${id}`)
                    }
                    onEdit={(id) =>
                      router.push(`/dashboard/employee/jobs/edit/${id}`)
                    }
                    onDelete={handleComplete}
                    showCompleteButton={false}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  <p>ไม่มีงานที่ทำเสร็จแล้ว</p>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </div>

      {/* Complete Dialog with Signature */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการ Complete งาน</DialogTitle>
            <DialogDescription>
              กรุณาลายเซ็นเพื่อยืนยันการ Complete งาน: <strong>{jobToDelete?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Signature Pad */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ลายเซ็น</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 bg-muted/20">
              <div className="w-full" style={{ maxWidth: "100%" }}>
                <SignaturePad
                  ref={signatureRef}
                  onEnd={handleSignatureEnd}
                  storageKey={jobToDelete ? `job-signature-${jobToDelete.id}` : undefined}
                  penColor="#000000"
                  backgroundColor="white"
                  height={200}
                  className="w-full"
                />
              </div>
            </div>

            {signatureData && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>ลายเซ็นพร้อมแล้ว</span>
              </div>
            )}
          </div>

          {/* Signature Actions */}
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearSignature}
            >
              <X className="h-4 w-4 mr-2" />
              ลบลายเซ็น
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveSignature}
              disabled={!getSignatureImage()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              บันทึกลายเซ็น
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCompleteDialogOpen(false);
                setSignatureData(null);
                if (signatureRef.current) {
                  signatureRef.current.clear();
                }
                // Clear from localStorage
                if (jobToDelete) {
                  removeSignature(`job-signature-${jobToDelete.id}`);
                }
              }}
              disabled={isCompleting}
            >
              ยกเลิก
            </Button>

            <Button
              variant="default"
              onClick={confirmComplete}
              disabled={!signatureData || isCompleting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCompleting ? "กำลังดำเนินการ..." : "ยืนยัน Complete งาน"}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Job Card Component ---
interface JobCardProps {
  job: Job;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (job: Job) => void;
  showCompleteButton?: boolean;
}

function JobCard({ job, onView, onEdit, onDelete, showCompleteButton = true }: JobCardProps) {
  const router = useRouter();
  const employees = job.assignedEmployees;
  const handleEditJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // 10. หยุด event click ไม่ให้ลามไปถึง row
    router.push(`/dashboard/employee/jobs/${jobId}/edit`);
  };

  return (
    <Card className="flex flex-col justify-between shadow-sm hover:scale-105 hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle
              className="text-lg font-semibold leading-tight hover:underline cursor-pointer"
              onClick={() => onView(job.id)}
            >
              {job.title}
            </CardTitle>
            <Badge className="capitalize mt-2" variant={getStatusVariant(job.status)}>
              {job.status.replace(/_/g, " ")}
            </Badge>
            {job.status === "rejected" && job.rejectionReason && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                  เหตุผลการปฏิเสธ:
                </p>
                <p className="text-xs text-red-600 dark:text-red-300">
                  {job.rejectionReason}
                </p>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(job.id)}>
                View
              </DropdownMenuItem>
              {showCompleteButton && (
                <DropdownMenuItem onClick={() => onDelete(job)}>
                  Complete Job
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Created by: {job.creator?.name ?? "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Created on: {dayjs(job.createdAt).format("DD MMM YYYY")}</span>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex flex-col w-full">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            ASSIGNED TO:
          </p>
          {!employees || employees.length === 0 ? (
            <span className="text-sm text-muted-foreground italic">
              Unassigned
            </span>
          ) : (
            <div className="flex -space-x-2">
              <TooltipProvider>
                {employees.slice(0, 4).map((emp) => (
                  <Tooltip key={emp.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage
                          src={
                            emp.imageUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${emp.name}`
                          }
                          alt={emp.name}
                        />
                        <AvatarFallback>
                          {emp.name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{emp.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
              {employees.length > 4 && (
                <Avatar className="h-8 w-8 border-2 border-background bg-muted text-muted-foreground flex items-center justify-center text-xs">
                  +{employees.length - 4}
                </Avatar>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// --- Helper ---
const getStatusVariant = (
  status: string
): "outline" | "default" | "destructive" | "secondary" | null | undefined => {
  switch (status) {
    case "completed":
      return "default";
    case "pending_approval":
      return "secondary";
    case "in_progress":
      return "outline";
    case "cancelled":
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
};

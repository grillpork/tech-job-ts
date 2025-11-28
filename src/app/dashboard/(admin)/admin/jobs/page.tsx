"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Search, MoreHorizontal, Calendar as CalendarIcon, Filter, X, Trash2 } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/global/DataTable";
import type { Column } from "@/components/global/DataTable";
import { Job } from "@/lib/types/job";
import { useJobStore } from "@/stores/features/jobStore";
import { useUserStore } from '@/stores/features/userStore';
import { useInventoryStore } from '@/stores/features/inventoryStore';
import { MOCK_USERS } from '@/lib/mocks/user';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

// ===========================
// MAIN COMPONENT
// ===========================
const getJobDepartments = (job: Job & { department?: string }) => {
  if (job.departments && job.departments.length > 0) {
    return job.departments;
  }
  if (job.department) {
    return [job.department];
  }
  return [];
};

const JobsList = () => {
  const router = useRouter(); // 5. khởi tạo router
  const {
    jobs,
    reorderJobs,
    deleteJob,
    completionRequests,
    approveCompletionRequest,
    rejectCompletionRequest,
    getCompletionRequestByJobId
  } = useJobStore(); // 6. ดึงข้อมูล jobs, reorderJobs และ deleteJob จาก store
  const users = useUserStore((s) => s.users);
  const { currentUser } = useUserStore();
  const { inventories, updateInventory } = useInventoryStore();

  // 7. ลบ state ทั้งหมดที่เกี่ยวกับ Dialog (isFormOpen, editingItem, formData, etc.)
  // ยังคง state สำหรับ mobile view (ถ้าต้องการ)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // default 5 rows per page
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  // Completion request states
  const [activeTab, setActiveTab] = useState<"jobs" | "completion-requests">("jobs");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // 8. Helper function สำหรับสีสถานะ (ปรับตาม Job)
  const getStatusColor = (status: string) => {
    // normalize status from job (lowercase, maybe with underscores)
    const s = status?.toLowerCase();
    switch (s) {
      case "pending":
      case "pending_approval":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
      case "cancelled":
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30";
    }
  };

  const formatStatusLabel = (status: string) => {
    if (!status) return "-";
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority) return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatPriorityLabel = (priority: string | null | undefined) => {
    if (!priority) return "-";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Filter jobs based on selected filters
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Filter by search term
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((job) =>
        job.title.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((job) => job.status === selectedStatus);
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((job) => {
        if (!job.startDate) return false;
        const jobDate = parseISO(job.startDate);

        // ถ้ามีแค่ from date ให้กรองงานที่ startDate >= from
        if (dateRange.from && !dateRange.to) {
          return jobDate >= dateRange.from;
        }

        // ถ้ามีแค่ to date ให้กรองงานที่ startDate <= to
        if (!dateRange.from && dateRange.to) {
          return jobDate <= dateRange.to;
        }

        // ถ้ามีทั้ง from และ to ให้กรองงานที่ startDate อยู่ในช่วง
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(jobDate, {
            start: dateRange.from,
            end: dateRange.to,
          });
        }

        return true;
      });
    }

    // Filter by department
    if (selectedDepartment !== "all") {
      filtered = filtered.filter((job) => {
        const jobDepartments = getJobDepartments(job);
        return jobDepartments.includes(selectedDepartment);
      });
    }

    // Filter by priority
    if (selectedPriority !== "all") {
      filtered = filtered.filter((job) => job.priority === selectedPriority);
    }

    return filtered;
  }, [jobs, searchTerm, selectedStatus, dateRange, selectedDepartment, selectedPriority]);

  // Get unique departments from jobs
  const departments = useMemo(() => {
    const depts = new Set<string>();
    jobs.forEach((job) => {
      const jobDepartments = getJobDepartments(job);
      jobDepartments.forEach((dept) => depts.add(dept));
    });
    return Array.from(depts).sort();
  }, [jobs]);

  // ===========================
  // 9. Handlers สำหรับการนำทาง
  // ===========================

  const handleCreateNewJob = () => {
    router.push("/dashboard/admin/jobs/create");
  };

  const handleEditJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // 10. หยุด event click ไม่ให้ลามไปถึง row
    router.push(`/dashboard/admin/jobs/${jobId}/edit`);
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/dashboard/admin/jobs/${jobId}`);
  };

  const handleDeleteJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setDeletingJobId(jobId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteJob = () => {
    if (deletingJobId) {
      deleteJob(deletingJobId);
      setIsDeleteDialogOpen(false);
      setDeletingJobId(null);
    }
  };

  // Helper function to calculate inventory status
  const calculateInventoryStatus = (quantity: number): "พร้อมใช้" | "ใกล้หมด" | "หมด" => {
    if (quantity === 0) {
      return "หมด";
    } else if (quantity < 10) {
      return "ใกล้หมด";
    } else if (quantity > 50) {
      return "พร้อมใช้";
    } else {
      return "พร้อมใช้";
    }
  };

  // Completion request handlers
  const handleApproveRequest = (requestId: string) => {
    if (!currentUser) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    // หา completion request
    const request = completionRequests.find(req => req.id === requestId);
    if (!request) {
      toast.error("ไม่พบคำขอจบงาน");
      return;
    }

    // หา job ที่เกี่ยวข้อง
    const job = jobs.find(j => j.id === request.jobId);
    if (!job) {
      toast.error("ไม่พบใบงาน");
      return;
    }

    // Approve completion request
    approveCompletionRequest(requestId, { id: currentUser.id, name: currentUser.name });

    // คืนวัสดุที่ type เป็น "ต้องคืน" กลับเข้าคลัง
    if (job.usedInventory && job.usedInventory.length > 0) {
      job.usedInventory.forEach(usedInv => {
        const inventoryItem = inventories.find(inv => inv.id === usedInv.id);
        if (inventoryItem && inventoryItem.type === "ต้องคืน") {
          // เพิ่ม quantity กลับเข้าไป
          const newQuantity = inventoryItem.quantity + usedInv.qty;
          const calculatedStatus = calculateInventoryStatus(newQuantity);

          updateInventory({
            ...inventoryItem,
            quantity: newQuantity,
            status: calculatedStatus,
          });
        }
      });
    }

    toast.success("อนุมัติคำขอจบงานแล้ว และคืนวัสดุที่ต้องคืนกลับเข้าคลังแล้ว");
  };

  const handleRejectRequest = (requestId: string) => {
    setRejectingRequestId(requestId);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const confirmRejectRequest = () => {
    if (!rejectingRequestId || !rejectionReason.trim()) {
      toast.error("กรุณาใส่เหตุผลการปฏิเสธ");
      return;
    }
    if (!currentUser) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }
    rejectCompletionRequest(
      rejectingRequestId,
      { id: currentUser.id, name: currentUser.name },
      rejectionReason.trim()
    );
    toast.success("ปฏิเสธคำขอจบงานแล้ว");
    setIsRejectDialogOpen(false);
    setRejectingRequestId(null);
    setRejectionReason("");
  };

  // Filter completion requests
  const pendingCompletionRequests = completionRequests.filter(req => {
    if (req.status !== "pending") return false;

    // Admin sees all requests
    if (currentUser?.role === 'admin') return true;

    const job = jobs.find(j => j.id === req.jobId);
    // Lead technician can only see requests for jobs where they are the lead technician
    return job?.leadTechnician?.id === currentUser?.id;
  });

  // Determine if tabs should be shown (only for admin, manager, lead_technician)
  const showTabs = currentUser && ['lead_technician'].includes(currentUser.role);

  // ===========================
  // 11. นิยาม Columns สำหรับ Jobs List
  // ===========================
  const columns: any[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row: Job) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: Job) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(row.status)}`}>
          {formatStatusLabel(row.status)}
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (row: Job) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(row.priority)}`}>
          {formatPriorityLabel(row.priority)}
        </span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row: Job) => {
        const jobDepartments = getJobDepartments(row);
        return jobDepartments.length > 0 ? jobDepartments.join(", ") : "-";
      },
    },
    {
      key: "createdBy",
      label: "Creator",
      render: (row: Job) => {
        const creatorId = row.creator?.id;
        // Prefer live user data from user store so profile updates (imageUrl) reflect here
        const user = users.find((u: any) => u.id === creatorId) || MOCK_USERS.find((u: any) => u.id === creatorId);
        const initials = (user?.name || row.creator?.name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border border-white/40 dark:border-white/20">
                  {user?.imageUrl && user.imageUrl.trim() ? (
                    <AvatarImage src={user.imageUrl.trim()} alt={user?.name || "creator"} />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{user?.name ?? row.creator?.name ?? '-'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      key: "leadTechnician",
      label: "Leader",
      render: (row: Job) => {
        const leadTechnicianId = row.leadTechnician?.id;
        // Prefer live user data from user store so profile updates (imageUrl) reflect here
        const user = users.find((u: any) => u.id === leadTechnicianId) || MOCK_USERS.find((u: any) => u.id === leadTechnicianId);
        const initials = (user?.name || row.leadTechnician?.name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border border-white/40 dark:border-white/20">
                  {user?.imageUrl && user.imageUrl.trim() ? (
                    <AvatarImage src={user.imageUrl.trim()} alt={user?.name || "lead technician"} />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{user?.name ?? row.leadTechnician?.name ?? '-'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (row: Job) => {
        const assignedUsers = row.assignedEmployees || [];
        const visible = assignedUsers.slice(0, 3);
        const extra = assignedUsers.length - visible.length;
        return (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {visible.map((u) => {
                // lookup live user by id to reflect profile changes
                const live = users.find((x: any) => x.id === u.id) || MOCK_USERS.find((x: any) => x.id === u.id);
                const displayName = live?.name ?? u.name;
                const img = live?.imageUrl ?? u.imageUrl;
                const initials = (displayName || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <TooltipProvider key={u.id} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="border-2 border-white rounded-full dark:border-gray-800">
                          <Avatar className="h-7 w-7">
                            {img && img.trim() ? (
                              <AvatarImage src={img.trim()} alt={displayName} />
                            ) : (
                              <AvatarFallback>{initials}</AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{displayName}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              {extra > 0 && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 border-2 border-white">
                        +{extra}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {assignedUsers.slice(3).map((u) => {
                        const live = users.find((x: any) => x.id === u.id) || MOCK_USERS.find((x: any) => x.id === u.id);
                        return live?.name ?? u.name;
                      }).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "startDate",
      label: "Start Date",
      render: (row: Job) => (
        <span>{row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (row: Job) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400"
                onClick={(e) => e.stopPropagation()} // 12. หยุด event click ไม่ให้ลามไปถึง row
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-800 w-40">
              <DropdownMenuItem onClick={(e) => handleEditJob(e, row.id)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Job
              </DropdownMenuItem>
              {currentUser?.role !== 'lead_technician' && (
                <DropdownMenuItem
                  onClick={(e) => handleDeleteJob(e, row.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // 14. Logic สำหรับ Mobile View (คัดลอกจากโค้ดเดิมและปรับแก้)
  // (หาก DataTable ของคุณไม่ responsive อัตโนมัติ)
  const currentItems = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasActiveFilters = searchTerm.trim() !== "" || selectedStatus !== "all" || dateRange.from || dateRange.to || selectedDepartment !== "all" || selectedPriority !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setDateRange({ from: undefined, to: undefined });
    setSelectedDepartment("all");
    setSelectedPriority("all");
  };

  // Handler สำหรับ reorder jobs
  const handleRowReorder = useCallback((newOrder: Job[]) => {
    // สร้าง map ของ filtered job IDs
    const filteredJobIds = new Set(filteredJobs.map((job) => job.id));

    // แยก jobs ที่อยู่ใน filteredJobs และไม่ได้อยู่ใน filteredJobs
    const filteredJobsInStore = jobs.filter((job) => filteredJobIds.has(job.id));
    const nonFilteredJobs = jobs.filter((job) => !filteredJobIds.has(job.id));

    // สร้าง map ของ newOrder เพื่อใช้ในการเรียงลำดับ
    const newOrderMap = new Map(newOrder.map((job, index) => [job.id, index]));

    // เรียงลำดับ filteredJobsInStore ตาม newOrder
    const reorderedFilteredJobs = [...filteredJobsInStore].sort((a, b) => {
      const indexA = newOrderMap.get(a.id) ?? Infinity;
      const indexB = newOrderMap.get(b.id) ?? Infinity;
      return indexA - indexB;
    });

    // รวม jobs ใหม่: filtered jobs ที่ reorder แล้ว + non-filtered jobs
    const finalOrder = [...reorderedFilteredJobs, ...nonFilteredJobs];

    // อัปเดต store
    reorderJobs(finalOrder);
  }, [filteredJobs, jobs, reorderJobs]);

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-row items-center justify-between">
        {/* HEADER SECTION */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Jobs List
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            หน้าติดตามรายการงาน
          </p>
        </div>


        {/* ACTION BAR */}
        <div className="mb-4 sm:mb-4 flex items-center justify-between">
          <div />
          <div>
            {currentUser?.role !== 'lead_technician' && (
              <Button
                onClick={handleCreateNewJob} // 15. เปลี่ยน handler
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Job {/* 16. เปลี่ยนข้อความปุ่ม */}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TABS SECTION */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "jobs" | "completion-requests")} className="mb-4">
        {showTabs && (
          <TabsList className="grid w-fit max-w-md grid-cols-2">
            <TabsTrigger value="jobs">รายการงาน</TabsTrigger>
            <TabsTrigger value="completion-requests">
              คำขอจบงาน
              {pendingCompletionRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                  {pendingCompletionRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="jobs" className="mt-4">
          {/* FILTERS SECTION */}
          <Card className="mb-4 sm:mb-6 p-4 gap-0 rounded-lg border">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ตัวกรอง:</span>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  ล้างทั้งหมด
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="w-full sm:w-[240px]">
                <Input
                  placeholder="ค้นหาตามชื่องาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="สถานะทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="pending_approval">รออนุมัติ</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      `${format(dateRange.from, "d/M/yyyy")} - ${format(dateRange.to, "d/M/yyyy")}`
                    ) : dateRange.from ? (
                      `จาก ${format(dateRange.from, "d/M/yyyy")}`
                    ) : dateRange.to ? (
                      `ถึง ${format(dateRange.to, "d/M/yyyy")}`
                    ) : (
                      "เลือกช่วงวันที่"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range) {
                        setDateRange({
                          from: range.from,
                          to: range.to ?? undefined,
                        });
                      } else {
                        setDateRange({ from: undefined, to: undefined });
                      }
                    }}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Department Filter */}
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="แผนกทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">แผนกทั้งหมด</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="ความสำคัญทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ความสำคัญทั้งหมด</SelectItem>
                  <SelectItem value="urgent">เร่งด่วนมาก</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="low">ต่ำ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>


          {/* DESKTOP: DataTable */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={filteredJobs} // 17. ใช้ข้อมูล filteredJobs
              totalRows={filteredJobs.length}
              currentPage={currentPage}
              rowsPerPage={itemsPerPage}
              onPageChange={(p) => setCurrentPage(p)}
              onRowsPerPageChange={(n) => {
                setItemsPerPage(n);
              }}
              showCheckbox={false}
              onRowClick={(row: Job) => handleViewJob(row.id)}
              onRowReorder={handleRowReorder}
            />
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden space-y-3">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                // 21. เพิ่ม onClick และ cursor-pointer ให้ card
                <div
                  key={item.id}
                  onClick={() => handleViewJob(item.id)}
                  className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-white font-medium mb-1">
                        {item.title} {/* 22. เปลี่ยนเป็น item.title */}
                      </h3>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {formatStatusLabel(item.status)}
                      </span>
                    </div>
                    {/* 23. อัปเดต Action Menu (เหมือน desktop) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()} // 24. หยุด event click
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-800 w-40">
                        <DropdownMenuItem
                          onClick={(e) => handleEditJob(e, item.id)}
                          className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Job
                        </DropdownMenuItem>
                        {currentUser?.role !== 'lead_technician' && (
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteJob(e, item.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Job
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* 25. อัปเดต field ข้อมูล Job */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Priority</p>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                        {formatPriorityLabel(item.priority)}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Department</p>
                      <p className="text-gray-900 dark:text-white">{item.department || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Assigned To</p>
                      <div className="flex items-center gap-2">
                        {item.assignedEmployees && item.assignedEmployees.length > 0 ? (
                          item.assignedEmployees.map((u) => {
                            const live = users.find((x: any) => x.id === u.id) || MOCK_USERS.find((x: any) => x.id === u.id);
                            const displayName = live?.name ?? u.name;
                            const img = live?.imageUrl ?? u.imageUrl;
                            const initials = (displayName || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                            return (
                              <TooltipProvider key={u.id} delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="border-2 border-white rounded-full dark:border-gray-800">
                                      <Avatar className="h-7 w-7">
                                        {img && img.trim() ? (
                                          <AvatarImage src={img.trim()} alt={displayName} />
                                        ) : (
                                          <AvatarFallback>{initials}</AvatarFallback>
                                        )}
                                      </Avatar>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{displayName}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })
                        ) : (
                          <span className="text-gray-900 dark:text-white">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Start Date</p>
                      <p className="text-gray-900 dark:text-white">
                        {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
                  ไม่พบข้อมูลงาน
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  ลองค้นหาด้วยคำอื่นหรือสร้างงานใหม่
                </p>
              </div>
            )}
          </div>

        </TabsContent>

        {showTabs && (
          <TabsContent value="completion-requests" className="mt-4">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">คำขอจบงานที่รอการอนุมัติ</h2>
              {pendingCompletionRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingCompletionRequests.map((request) => {
                    const job = jobs.find(j => j.id === request.jobId);
                    if (!job) return null;
                    return (
                      <Card key={request.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>ผู้ส่งคำขอ: {request.requestedBy.name}</p>
                              <p>วันที่ส่งคำขอ: {new Date(request.requestedAt).toLocaleString('th-TH')}</p>
                              <p>แผนก: {getJobDepartments(job).join(", ") || '-'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800 h-8 px-3"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              อนุมัติ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800 h-8 px-3"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              ปฏิเสธ
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/admin/jobs/${job.id}`)}
                          >
                            ดูรายละเอียดงาน
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>ไม่มีคำขอจบงานที่รอการอนุมัติ</p>
                </div>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md bg-card border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบใบงาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบใบงานนี้? การกระทำนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingJobId(null)}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteJob}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Completion Request Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ปฏิเสธคำขอจบงาน</AlertDialogTitle>
            <AlertDialogDescription>
              กรุณาใส่เหตุผลการปฏิเสธคำขอจบงานนี้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">เหตุผลการปฏิเสธ</Label>
              <Textarea
                id="rejection-reason"
                placeholder="กรุณาใส่เหตุผลการปฏิเสธ..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectingRequestId(null);
                setRejectionReason("");
              }}
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRejectRequest}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectionReason.trim()}
            >
              ปฏิเสธ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobsList;
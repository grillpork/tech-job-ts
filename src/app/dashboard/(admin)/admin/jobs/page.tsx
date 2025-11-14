"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Search, MoreVertical } from "lucide-react";
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
import { MOCK_USERS } from '@/lib/mocks/user';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

// ===========================
// MAIN COMPONENT
// ===========================
const JobsList = () => {
  const router = useRouter(); // 5. khởi tạo router
  const { jobs } = useJobStore(); // 6. ดึงข้อมูล jobs จาก store
  const users = useUserStore((s) => s.users);

  // 7. ลบ state ทั้งหมดที่เกี่ยวกับ Dialog (isFormOpen, editingItem, formData, etc.)
  // ยังคง state สำหรับ mobile view (ถ้าต้องการ)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // default 5 rows per page

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
      key: "department",
      label: "Department",
    },
    {
      key: "createdBy",
      label: "Leader Technical",
      render: (row: Job) => {
          const creatorId = row.creator?.id;
          // Prefer live user data from user store so profile updates (imageUrl) reflect here
    const user = users.find((u: any) => u.id === creatorId) || MOCK_USERS.find((u: any) => u.id === creatorId);
    const initials = (user?.name || row.creator?.name || "").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
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
      key: "assignedTo",
      label: "Assigned To",
      render: (row: Job) => {
        const users = row.assignedEmployees || [];
        const visible = users.slice(0, 3);
        const extra = users.length - visible.length;
        return (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {visible.map((u) => {
                // lookup live user by id to reflect profile changes
                const live = users.find((x: any) => x.id === u.id) || MOCK_USERS.find((x: any) => x.id === u.id);
                const displayName = live?.name ?? u.name;
                const img = live?.imageUrl ?? u.imageUrl;
                return (
                  <div key={u.id} className="border-2 border-white rounded-full dark:border-gray-800" title={displayName}>
                    <Avatar className="h-7 w-7">
                      {img && img.trim() ? (
                        <AvatarImage src={img.trim()} alt={displayName} />
                      ) : (
                        <AvatarFallback>{(displayName || "").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                );
              })}
              {extra > 0 && (
                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200 border-2 border-white">+{extra}</div>
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
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 w-40">
              <DropdownMenuItem onClick={(e) => handleEditJob(e, row.id)} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Job
              </DropdownMenuItem>
              {/* 13. ลบเมนู Delete ออก */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  
  // 14. Logic สำหรับ Mobile View (คัดลอกจากโค้ดเดิมและปรับแก้)
  // (หาก DataTable ของคุณไม่ responsive อัตโนมัติ)
  const currentItems = jobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-3 sm:p-6">
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
          <Button
            onClick={handleCreateNewJob} // 15. เปลี่ยน handler
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Job {/* 16. เปลี่ยนข้อความปุ่ม */}
          </Button>
        </div>
      </div>

      {/* DESKTOP: DataTable */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={jobs} // 17. ใช้ข้อมูล jobs
          totalRows={jobs.length}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          searchKey={"title"} // 18. ค้นหาจาก title
          filters={[
            // 19. อัปเดต Filter ตามสถานะของ Job
            {
              key: "status",
              placeholder: "Filter Status",
              options: [
                      { label: "Pending", value: "pending" },
                      { label: "In Progress", value: "in_progress" },
                      { label: "Completed", value: "completed" },
              ],
            },
          ]}
          onPageChange={(p) => setCurrentPage(p)}
          onRowsPerPageChange={(n) => {
            setItemsPerPage(n);
          }}
          showCheckbox={false}
          onRowClick={(row: Job) => handleViewJob(row.id)}
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
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 w-40">
                    <DropdownMenuItem
                      onClick={(e) => handleEditJob(e, item.id)}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Job
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 25. อัปเดต field ข้อมูล Job */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Department</p>
                  <p className="text-gray-900 dark:text-white">{item.department}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    {item.assignedEmployees && item.assignedEmployees.length > 0 ? (
                      item.assignedEmployees.map((u) => (
                        <div key={u.id} className="border-2 border-white rounded-full dark:border-gray-800">
                          <div title={u.name}>
                            <Avatar className="h-7 w-7">
                              {u.imageUrl ? (
                                <AvatarImage src={u.imageUrl} alt={u.name} />
                              ) : (
                                <AvatarFallback>{(u.name || "").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-900 dark:text-white">-</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
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

      {/* 26. ลบ <Dialog> และ <AlertDialog> ทั้งหมด */}
    </div>
  );
};

export default JobsList;
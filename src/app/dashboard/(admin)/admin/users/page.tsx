"use client";

import React, { use, useState, useMemo } from "react";
import { DataTable } from "@/components/global/DataTable";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, Edit, Trash2, UserX, Shield, KeyRound, CheckCheck, CircleDotDashed, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import UserView from "@/components/admin/UserView";
import { columns } from "@/components/job_m/columns";

// Move columns inside the component so handlers can access component state

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const { users, currentUser, isAuthenticated, updateUser, deleteUser, reorderUsers } = useUserStore();
  // default rows per page to 10 for pagination (instead of users.length which disables paging)
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [viewUser, setViewUser] = useState<any | null>(null);

  const columns: any = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: any) => {
        const initials = (row?.name || "")
          .split(" ")
          .map((n: string) => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();

        // Check if imageUrl exists and is a valid non-empty string
        const hasImageUrl = row?.imageUrl && 
          typeof row.imageUrl === 'string' && 
          row.imageUrl.trim().length > 0;

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              {hasImageUrl ? (
                <AvatarImage 
                  src={row.imageUrl.trim()} 
                  alt={row?.name || "User"}
                />
              ) : null}
              <AvatarFallback className="bg-muted text-muted-foreground">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{row?.name}</span>
              <span className="text-sm text-muted-foreground">{row?.email}</span>
            </div>
          </div>
        );
      },
    },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", sortable: true },
    { key: "status", label: "Status", sortable: true },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setViewUser(row)}>
              <User className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/users/${row.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit user
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (confirm("Are you sure you want to delete this user?")) {
                  deleteUser(row.id);
                }
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete user
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateUser(row.id, { status: row.status === "active" ? "inactive" : "active" })}
              className="text-orange-600"
            >
              <UserX className="mr-2 h-4 w-4" />
              {row.status === "active" ? "Deactivate" : "Activate"} account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="h-full p-4">
      {/* Header with Add User Button */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">จัดการผู้ใช้</h1>
          <p className="text-sm text-muted-foreground">จัดการบัญชีผู้ใช้ทั้งหมดในระบบ</p>
        </div>
        <Link href="/dashboard/admin/users/create">
          <Button>
            <User className="h-4 w-4 mr-2" />
            เพิ่มผู้ใช้ใหม่
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={users}
        totalRows={users.length}
        currentPage={page}
        rowsPerPage={rowsPerPage}
        searchKey="name"
        filters={[
          {
            key: "role",
            placeholder: "Filter Role",
            options: [
              { label: "Admin", value: "admin" },
              { label: "Manager", value: "manager" },
              { label: "Lead Technician", value: "lead_technician" },
              { label: "Employee", value: "employee" },
            ],
          },
          {
            key: "status",
            placeholder: "Filter Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
          {
            key: "department",
            placeholder: "Filter Department",
            options: [
              { label: "แผนกช่างไฟ (Electrical)", value: "Electrical" },
              { label: "แผนกช่างกล (Mechanical)", value: "Mechanical" },
              { label: "แผนกช่างเทคนิค (Technical)", value: "Technical" },
              { label: "แผนกช่างโยธา (Civil)", value: "Civil" },
            ],
          },
        ]}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onRowReorder={(newData: any[]) => {
          // Persist new order by calling store method with id order
          const ids = newData.map((d) => d.id);
          reorderUsers(ids);
        }}
      />

      {/* View Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>Details for the selected user.</DialogDescription>
          </DialogHeader>

          {viewUser && (
            <div className="space-y-4">
              <UserView user={viewUser} />

              {/* Work stats derived from jobStore for this user */}
              <div>
                {/* derive stats */}
                <StatsForUser userId={viewUser.id} />
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/dashboard/admin/users/${viewUser.id}`}>
                  <Button variant="link">Open full profile</Button>
                </Link>
                <Button variant="ghost" onClick={() => setViewUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function StatsForUser({ userId }: { userId: string }) {
  const jobs = useJobStore((s) => s.jobs);

  const userJobs = useMemo(() => {
    if (!userId) return [] as typeof jobs;
    return jobs.filter((job) => {
      const isAssigned = job.assignedEmployees?.some((a: any) => a.id === userId);
      const isCreator = job.creator?.id === userId;
      const isLead = job.leadTechnician?.id === userId;
      return !!(isAssigned || isCreator || isLead);
    });
  }, [jobs, userId]);

  const completed = userJobs.filter((j) => j.status === "completed").length;
  const inProgress = userJobs.filter((j) => j.status === "in_progress").length;
  const attendance = Array.from(new Set(userJobs.map((j) => (j.startDate || j.createdAt || "").slice(0, 10)))).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border p-3 text-center">
        <div className="text-sm text-muted-foreground">Completed</div>
        <div className="mt-1 text-lg font-semibold">{completed}</div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
          <CheckCheck className="h-4 w-4 text-green-500" /> Jobs
        </div>
      </div>
      <div className="rounded-lg border p-3 text-center">
        <div className="text-sm text-muted-foreground">In Progress</div>
        <div className="mt-1 text-lg font-semibold">{inProgress}</div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
          <CircleDotDashed className="h-4 w-4 text-blue-500" /> Jobs
        </div>
      </div>
      <div className="rounded-lg border p-3 text-center">
        <div className="text-sm text-muted-foreground">Active Days</div>
        <div className="mt-1 text-lg font-semibold">{attendance}</div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
          <LogIn className="h-4 w-4 text-gray-500" /> Days
        </div>
      </div>
    </div>
  );
}

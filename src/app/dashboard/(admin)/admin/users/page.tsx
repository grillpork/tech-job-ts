"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { DataTable } from "@/components/global/DataTable";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, User, Edit, Trash2, UserX, Shield, KeyRound, Search } from "lucide-react";
import {

} from "@/components/ui/dialog";
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


export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { users, currentUser, isAuthenticated, updateUser, deleteUser, reorderUsers } = useUserStore();
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  // Role mapping for Thai labels
  const roleLabels: Record<string, string> = {
    "admin": "ผู้ดูแลระบบ",
    "manager": "ผู้จัดการ",
    "lead_technician": "หัวหน้าช่าง",
    "employee": "พนักงาน",
  };

  // Status mapping for Thai labels
  const statusLabels: Record<string, string> = {
    "active": "ใช้งาน",
    "inactive": "ไม่ใช้งาน",
  };

  // Department mapping for Thai labels
  const departmentLabels: Record<string, string> = {
    "Electrical": "ไฟฟ้า",
    "Mechanical": "เครื่องกล",
    "Technical": "เทคนิค",
    "Civil": "โยธา",
    "ไฟฟ้า": "ไฟฟ้า",
    "เครื่องกล": "เครื่องกล",
    "เทคนิค": "เทคนิค",
    "โยธา": "โยธา",
  };

  const handleEditUser = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    router.push(`/dashboard/admin/users/${userId}/edit`);
  };



  const handleDeleteUser = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const user = users.find(u => u.id === userId);
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  // Keep viewUser in sync with latest user data from store


  const columns: any = [
    {
      key: "name",
      label: "ชื่อ",
      // sortable: true,
      render: (row: any) => {
        const initials = (row?.name || "")
          .split(" ")
          .map((n: string) => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();

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
    {
      key: "department",
      label: "แผนก",
      // sortable: true,
      render: (row: any) => {
        const dept = row?.department;
        return (
          <span className="text-sm">
            {dept ? (departmentLabels[dept] || dept) : "ไม่ระบุ"}
          </span>
        );
      },
    },
    {
      key: "role",
      label: "บทบาท",
      // sortable: true,
      render: (row: any) => roleLabels[row.role] || row.role
    },
    {
      key: "status",
      label: "สถานะ",
      // sortable: true,
      render: (row: any) => statusLabels[row.status] || row.status
    },
    {
      key: "actions",
      label: "การดำเนินการ",
      align: "center",
      render: (row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/admin/users/${row.id}`);
            }}>
              <User className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleEditUser(e, row.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit user
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => handleDeleteUser(e, row.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete user
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                updateUser(row.id, { status: row.status === "active" ? "inactive" : "active" });
              }}
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

  // Handler สำหรับ reorder users
  const handleRowReorder = useCallback((newOrder: any[]) => {
    const ids = newOrder.map((d) => d.id);
    reorderUsers(ids);
  }, [reorderUsers]);

  // สำหรับ mobile view
  const currentItems = users.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-row items-center justify-between mb-4 sm:mb-6">
        {/* HEADER SECTION */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Manage Users
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            จัดการบัญชีผู้ใช้ทั้งหมดในระบบ
          </p>
        </div>

        {/* ACTION BAR */}
        <div>
          <Link href="/dashboard/admin/users/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-full sm:w-auto">
              <User className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </Link>
        </div>
      </div>

      {/* DESKTOP: DataTable */}
      <div className="hidden md:block">
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
              placeholder: "กรองตามบทบาท",
              allLabel: "บทบาททั้งหมด",
              options: [
                { label: "ผู้ดูแลระบบ", value: "admin" },
                { label: "ผู้จัดการ", value: "manager" },
                { label: "หัวหน้าช่าง", value: "lead_technician" },
                { label: "พนักงาน", value: "employee" },
              ],
            },
            {
              key: "status",
              placeholder: "กรองตามสถานะ",
              allLabel: "สถานะทั้งหมด",
              options: [
                { label: "ใช้งาน", value: "active" },
                { label: "ไม่ใช้งาน", value: "inactive" },
              ],
            },
          ]}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowReorder={handleRowReorder}
          onRowClick={(row: any) => router.push(`/dashboard/admin/users/${row.id}`)}
          showCheckbox={false}
        />
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {currentItems.length > 0 ? (
          currentItems.map((user) => (
            <div
              key={user.id}
              onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
              className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    {user?.imageUrl && user.imageUrl.trim() ? (
                      <AvatarImage
                        src={user.imageUrl.trim()}
                        alt={user?.name || "User"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {(user?.name || "")
                        .split(" ")
                        .map((n: string) => n[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-medium mb-1">
                      {user.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-800 w-40">
                    <DropdownMenuItem
                      onClick={(e) => handleEditUser(e, user.id)}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit user
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteUser(e, user.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete user
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Department</p>
                  <p className="text-gray-900 dark:text-white">
                    {user.department || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Role</p>
                  <p className="text-gray-900 dark:text-white">
                    {roleLabels[user.role] || user.role || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : user.status === 'inactive'
                      ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                    {user.status ? (statusLabels[user.status] || user.status) : 'Undefined'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
              ไม่พบข้อมูลผู้ใช้
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              ลองค้นหาด้วยคำอื่นหรือเพิ่มผู้ใช้ใหม่
            </p>
          </div>
        )}
      </div>

      {/* View Dialog */}


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md bg-card border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              <span className="font-medium text-foreground"> {userToDelete?.name} </span>
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteUser}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

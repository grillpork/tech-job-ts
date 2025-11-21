"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/global/DataTable";
import type { Column } from "@/components/global/DataTable";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock data
import { Inventory } from "@/lib/types/inventory";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useJobStore } from "@/stores/features/jobStore";
import ExportInventoryData from "@/components/export/ExportInventoryData.tsx";
import { useRouter } from "next/navigation";

// ===========================
// MAIN COMPONENT
// ===========================
const InventoryManagement = () => {
  const router = useRouter();
  const {
    inventories,
    addInventory,
    updateInventory,
    deleteInventory,
    clearAll,
    addInventoryRequest,
    updateInventoryRequestStatus,
    getInventoryRequestByJobId,
    getInventoryRequestStatus,
  } = useInventoryStore();
  const { jobs, updateJob } = useJobStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    quantity: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { reorderInventory } = useInventoryStore();

  const filteredItems = inventories.filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // DataTable columns (used for desktop view)
  const columns: any[] = [
    {
      key: "name",
      label: "Title",
      sortable: true,
      render: (row: Inventory) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row: Inventory) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      align: "center",
    },
    {
      key: "quantity",
      label: "Quantity",
      align: "center",
      render: (row: Inventory) => <span className="font-semibold">{row.quantity}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (row: Inventory) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1d29]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-gray-200 dark:border-gray-800 w-40">
              <DropdownMenuItem onClick={() => handleEdit(row)} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteClick(row.id)} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-red-600 dark:hover:text-red-400 cursor-pointer">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // ฟังก์ชันคำนวณ status อัตโนมัติตาม quantity
  const calculateInventoryStatus = (quantity: number): Inventory["status"] => {
    if (quantity === 0) {
      return "หมด";
    } else if (quantity < 10) {
      return "ใกล้หมด";
    } else if (quantity > 50) {
      return "พร้อมใช้";
    } else {
      // ถ้าอยู่ระหว่าง 10-50 ให้เป็น "พร้อมใช้" (หรือจะเปลี่ยนเป็น "ใกล้หมด" ก็ได้ตามต้องการ)
      return "พร้อมใช้";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "พร้อมใช้":
        return "bg-green-500/20 text-green-400 border-green-500/30 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
      case "ใกล้หมด":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30";
      case "หมด":
        return "bg-red-500/20 text-red-400 border-red-500/30 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30";
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      quantity: "",
    });
    setEditingItem(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (item: Inventory) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      quantity: item.quantity.toString(),
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (
      !formData.name ||
      !formData.type ||
      !formData.quantity
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const quantity = parseInt(formData.quantity);
    const calculatedStatus = calculateInventoryStatus(quantity);

    if (editingItem) {
      updateInventory({
        ...editingItem,
        name: formData.name,
        status: calculatedStatus,
        type: formData.type as Inventory["type"],
        quantity: quantity,
      });
    } else {
      const newItem: Inventory = {
        id: crypto.randomUUID(),
        name: formData.name,
        status: calculatedStatus,
        type: formData.type as Inventory["type"],
        quantity: quantity,
        location: "Main Warehouse",
        price: 0,
        requireFrom: "", // Keep for backward compatibility but set to empty
      };
      addInventory(newItem);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingItemId) deleteInventory(deletingItemId);
    setIsDeleteAlertOpen(false);
    setDeletingItemId(null);
  };

  // Filter jobs ที่มี usedInventory
  const jobsWithInventory = jobs.filter(
    (job) => job.usedInventory && job.usedInventory.length > 0
  );

  // สร้าง inventory request อัตโนมัติเมื่อ job มี usedInventory แต่ยังไม่มี request
  useEffect(() => {
    const jobsWithInv = jobs.filter(
      (job) => job.usedInventory && job.usedInventory.length > 0
    );
    
    jobsWithInv.forEach((job) => {
      const existingRequest = getInventoryRequestByJobId(job.id);
      if (!existingRequest && job.usedInventory && job.usedInventory.length > 0) {
        // สร้าง request ใหม่
        addInventoryRequest({
          jobId: job.id,
          status: "pending",
          requestedItems: job.usedInventory,
          requestedBy: {
            id: job.creator.id,
            name: job.creator.name,
          },
          note: null,
        });
      }
    });
  }, [jobs, addInventoryRequest, getInventoryRequestByJobId]);

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

  // Get approval status for a job (ใช้จาก store)
  const getInventoryRequestStatusForJob = (jobId: string): 'pending' | 'approved' | 'rejected' => {
    return getInventoryRequestStatus(jobId);
  };

  // Handle approve inventory request
  const handleApproveInventory = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.usedInventory) return;

    const request = getInventoryRequestByJobId(jobId);
    if (!request) {
      toast.error("ไม่พบคำขอเบิกวัสดุ");
      return;
    }

    // Update approval status in store
    updateInventoryRequestStatus(
      request.id,
      "approved",
      {
        id: "admin", // TODO: ใช้ user ID จริงจาก auth
        name: "ผู้ดูแลระบบ",
      },
      null
    );

    // Update inventory quantity and calculate status automatically for approved items
    job.usedInventory.forEach(usedInv => {
      const inventoryItem = inventories.find(inv => inv.id === usedInv.id);
      if (inventoryItem) {
        const newQuantity = Math.max(0, inventoryItem.quantity - usedInv.qty);
        const calculatedStatus = calculateInventoryStatus(newQuantity);
        updateInventory({
          ...inventoryItem,
          quantity: newQuantity,
          status: calculatedStatus,
        });
      }
    });

    toast.success("อนุมัติคำขอเบิกวัสดุสำเร็จ");
  };

  // Handle reject inventory request
  const handleRejectInventory = (jobId: string) => {
    const request = getInventoryRequestByJobId(jobId);
    if (!request) {
      toast.error("ไม่พบคำขอเบิกวัสดุ");
      return;
    }

    // Update rejection status in store
    updateInventoryRequestStatus(
      request.id,
      "rejected",
      {
        id: "admin", // TODO: ใช้ user ID จริงจาก auth
        name: "ผู้ดูแลระบบ",
      },
      null
    );

    toast.error("ปฏิเสธคำขอเบิกวัสดุ");
  };

  // Get approval status badge color
  const getApprovalStatusColor = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case 'rejected':
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  const getApprovalStatusLabel = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return "อนุมัติแล้ว";
      case 'rejected':
        return "ปฏิเสธ";
      default:
        return "รออนุมัติ";
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inventory">การจัดการอุปกรณ์</TabsTrigger>
          <TabsTrigger value="requests">คำขอเบิกวัสดุจากใบงาน</TabsTrigger>
        </TabsList>

        {/* TAB 1: Inventory Management */}
        <TabsContent value="inventory" className="space-y-4">
          {/* ACTION BAR (kept simple - Add button) */}
          <div className="mb-4 sm:mb-4 flex items-center justify-between">
            <div>
              <ExportInventoryData />
            </div>
            <div>
              <Button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add equipment
              </Button>
            </div>
          </div>

          {/* DESKTOP: DataTable (uses inventoryStore as source) */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={inventories}
              totalRows={inventories.length}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              searchKey={"name"}
              filters={[
                {
                  key: "status",
                  placeholder: "Filter Status",
                  options: [
                    { label: "พร้อมใช้", value: "พร้อมใช้" },
                    { label: "ใกล้หมด", value: "ใกล้หมด" },
                    { label: "หมด", value: "หมด" },
                  ],
                },
              ]}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(n) => {
                setRowsPerPage(n);
                setCurrentPage(1);
              }}
              onRowReorder={(newData: any[]) => {
                const ids = newData.map((d) => d.id as string);
                reorderInventory(ids);
              }}
              showCheckbox={false}
            />
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden space-y-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item: Inventory) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-white font-medium mb-1">
                        {item.name}
                      </h3>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1d29]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-card border-gray-200 dark:border-gray-800 w-40"
                      >
                        <DropdownMenuItem
                          onClick={() => handleEdit(item)}
                          className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Type</p>
                      <p className="text-gray-900 dark:text-white">{item.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        Quantity
                      </p>
                      <p className="text-gray-900 dark:text-white font-semibold">
                        {item.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
                  ไม่พบข้อมูลอุปกรณ์
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  ลองค้นหาด้วยคำอื่นหรือเพิ่มอุปกรณ์ใหม่
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: Material Requests from Jobs */}
        <TabsContent value="requests" className="space-y-4">
          {jobsWithInventory.length > 0 ? (
            <div className="space-y-4">
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block">
                <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-300">ใบงาน</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">สถานะ</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">แผนก</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">จำนวนรายการ</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">สถานะการอนุมัติ</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">รายละเอียด</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobsWithInventory.map((job) => {
                        const approvalStatus = getInventoryRequestStatusForJob(job.id);
                        return (
                          <TableRow
                            key={job.id}
                            className="hover:bg-gray-50 dark:hover:bg-[#0f1117]"
                          >
                            <TableCell 
                              className="font-medium text-gray-900 dark:text-white cursor-pointer"
                              onClick={() => router.push(`/dashboard/admin/jobs/${job.id}`)}
                            >
                              {job.title}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(
                                  job.status
                                )}`}
                              >
                                {getJobStatusLabel(job.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {job.department || "-"}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-white font-semibold">
                              {job.usedInventory?.length || 0} รายการ
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getApprovalStatusColor(
                                  approvalStatus
                                )}`}
                              >
                                {getApprovalStatusLabel(approvalStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {job.usedInventory?.slice(0, 2).map((usedInv) => {
                                  const inventoryItem = inventories.find(
                                    (inv) => inv.id === usedInv.id
                                  );
                                  return (
                                    <div
                                      key={usedInv.id}
                                      className="text-xs text-gray-600 dark:text-gray-400"
                                    >
                                      {inventoryItem?.name || usedInv.id}: {usedInv.qty}
                                    </div>
                                  );
                                })}
                                {job.usedInventory && job.usedInventory.length > 2 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    +{job.usedInventory.length - 2} รายการเพิ่มเติม
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {approvalStatus === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800 h-8 px-3"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApproveInventory(job.id);
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      อนุมัติ
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800 h-8 px-3"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectInventory(job.id);
                                      }}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      ปฏิเสธ
                                    </Button>
                                  </>
                                )}
                                {approvalStatus === 'approved' && (
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    อนุมัติแล้ว
                                  </span>
                                )}
                                {approvalStatus === 'rejected' && (
                                  <span className="text-xs text-red-600 dark:text-red-400">
                                    ปฏิเสธแล้ว
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden space-y-3">
                {jobsWithInventory.map((job) => {
                  const approvalStatus = getInventoryRequestStatusForJob(job.id);
                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 
                            className="text-gray-900 dark:text-white font-medium mb-2 cursor-pointer"
                            onClick={() => router.push(`/dashboard/(admin)/admin/jobs/${job.id}`)}
                          >
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(
                                job.status
                              )}`}
                            >
                              {getJobStatusLabel(job.status)}
                            </Badge>
                            <Badge
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getApprovalStatusColor(
                                approvalStatus
                              )}`}
                            >
                              {getApprovalStatusLabel(approvalStatus)}
                            </Badge>
                            {job.department && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {job.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">จำนวนรายการ:</span>{" "}
                          {job.usedInventory?.length || 0} รายการ
                        </div>
                        <div className="space-y-1">
                          {job.usedInventory?.map((usedInv) => {
                            const inventoryItem = inventories.find(
                              (inv) => inv.id === usedInv.id
                            );
                            return (
                              <div
                                key={usedInv.id}
                                className="text-sm text-gray-900 dark:text-white flex justify-between items-center"
                              >
                                <span>
                                  {inventoryItem?.name || usedInv.id}
                                </span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {usedInv.qty}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Action Buttons for Mobile */}
                        {approvalStatus === 'pending' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              onClick={() => handleApproveInventory(job.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              อนุมัติ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                              onClick={() => handleRejectInventory(job.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              ปฏิเสธ
                            </Button>
                          </div>
                        )}
                        {(approvalStatus === 'approved' || approvalStatus === 'rejected') && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className={`text-sm text-center ${
                              approvalStatus === 'approved' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {approvalStatus === 'approved' ? '✓ อนุมัติแล้ว' : '✗ ปฏิเสธแล้ว'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
              <Search className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">
                ไม่พบคำขอเบิกวัสดุ
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                ยังไม่มีใบงานที่ขอเบิกวัสดุ
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px] w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto bg-card border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
              {editingItem ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              กรอกข้อมูลอุปกรณ์ให้ครบถ้วน
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-5 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="title"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="ชื่ออุปกรณ์"
                className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-600"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2 w-full">
                <Label
                  htmlFor="type"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-600 w-full">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                    <SelectItem
                      value="ต้องคืน"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      ต้องคืน
                    </SelectItem>
                    <SelectItem
                      value="ไม่ต้องคืน"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      ไม่ต้องคืน
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="quantity"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="จำนวน"
                min="0"
                className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-600"
              />
              {formData.quantity && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    สถานะที่คำนวณอัตโนมัติ:
                  </p>
                  <Badge
                    className={`${getStatusColor(
                      calculateInventoryStatus(parseInt(formData.quantity) || 0)
                    )} px-3 py-1`}
                  >
                    {calculateInventoryStatus(parseInt(formData.quantity) || 0)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] w-full sm:w-auto"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              {editingItem ? "บันทึกการแก้ไข" : "เพิ่มอุปกรณ์"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        {isDeleteAlertOpen && <div className="fixed inset-0 z-40" />}
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md bg-card border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-gray-900 dark:text-white">
              ยืนยันการลบ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              คุณแน่ใจไหมที่จะลบอุปกรณ์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] w-full sm:w-auto m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto m-0"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryManagement;

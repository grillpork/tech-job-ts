/* eslint-disable */
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
import { Card, CardContent } from "@/components/ui/card"; // Added Card for KPI

// Mock data
import { Inventory } from "@/lib/types/inventory";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useJobStore } from "@/stores/features/jobStore";
import ExportInventoryData from "@/components/export/ExportInventoryData";
import { useRouter } from "next/navigation";

// ===========================
// MAIN COMPONENT
// ===========================
const getJobDepartments = (job: any) => {
  if (job.departments && job.departments.length > 0) {
    return job.departments;
  }
  if (job.department) {
    return [job.department];
  }
  return [];
};

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
    imageUrl: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('entity', 'inventory');
      uploadData.append('entityId', itemId || 'new');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const json = await res.json();
      if (json.success) {
        setFormData(prev => ({ ...prev, imageUrl: json.url }));
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      } else {
        toast.error("อัปโหลดไม่สำเร็จ: " + json.error);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploadingImage(false);
    }
  };

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
      label: "ข้อมูลวัสดุ (Item Details)",
      render: (row: Inventory) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shadow-sm overflow-hidden">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              row.name.charAt(0)
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-gray-900 dark:text-white leading-tight">{row.name}</span>
            <span className="text-[11px] text-gray-500 mt-0.5">ID: {row.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "สถานะ (Status)",
      align: "center",
      render: (row: Inventory) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-sm ${getStatusColor(row.status)}`}>
          {row.status === "พร้อมใช้" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />}
          {row.status === "ใกล้หมด" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5" />}
          {row.status === "หมด" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />}
          {row.status}
        </span>
      ),
    },
    {
      key: "type",
      label: "ประเภท (Type)",
      align: "center",
      render: (row: Inventory) => (
        <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 text-[11px] font-medium border border-gray-200 dark:border-gray-700">
          {row.type}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "คลัง (Stock)",
      align: "center",
      render: (row: Inventory) => (
        <div className="flex flex-col items-center">
          <span className="font-bold text-[14px] text-gray-900 dark:text-white">{row.quantity}</span>
          {row.quantity < 20 && row.quantity > 0 && <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-semibold px-1.5 bg-yellow-50 dark:bg-yellow-950/30 rounded mt-0.5">ใกล้หมด</span>}
          {row.quantity === 0 && <span className="text-[10px] text-red-600 dark:text-red-500 font-semibold px-1.5 bg-red-50 dark:bg-red-950/30 rounded mt-0.5">สั่งซื้อด่วน</span>}
        </div>
      ),
    },
    {
      key: "actions",
      label: "การดำเนินการ",
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
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.id); }} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-red-600 dark:hover:text-red-400 cursor-pointer">
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
    } else if (quantity < 20) {
      return "ใกล้หมด";
    } else {
      return "พร้อมใช้";
    }
  };

  // อัปเดตสถานะของอุปกรณ์ที่มีอยู่แล้วเมื่อโหลดหน้า — รันเพียงครั้งเดียว (on mount)
  useEffect(() => {
    if (inventories.length === 0) return;
    inventories.forEach((item) => {
      const newStatus = calculateInventoryStatus(item.quantity);
      if (item.status !== newStatus) {
        updateInventory({ ...item, status: newStatus }).catch(() => {});
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      imageUrl: "",
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
      imageUrl: item.imageUrl || "",
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
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

    try {
      if (editingItem) {
        await updateInventory({
          ...editingItem,
          name: formData.name,
          status: calculatedStatus,
          type: formData.type as Inventory["type"],
          quantity: quantity,
          imageUrl: formData.imageUrl || null,
        });
        toast.success("แก้ไขข้อมูลสำเร็จ");
      } else {
        const result = await addInventory({
          name: formData.name,
          status: calculatedStatus,
          type: formData.type as Inventory["type"],
          quantity: quantity,
          imageUrl: formData.imageUrl || null,
          location: "Main Warehouse",
          price: 0,
          requireFrom: null,
        });
        if (result) {
          toast.success("เพิ่มอุปกรณ์สำเร็จ");
        } else {
          toast.error("เพิ่มอุปกรณ์ไม่สำเร็จ กรุณาลองใหม่");
          return;
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      return;
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleViewInventory = (inventoryId: string) => {
    router.push(`/dashboard/admin/inventorys/${inventoryId}`);
  };

  const handleDeleteConfirm = async () => {
    if (deletingItemId) {
      try {
        await deleteInventory(deletingItemId);
        toast.success("ลบอุปกรณ์สำเร็จ");
      } catch {
        toast.error("ลบไม่สำเร็จ กรุณาลองใหม่");
      }
    }
    setIsDeleteAlertOpen(false);
    setDeletingItemId(null);
  };

  // Filter jobs ที่มี usedInventory (ไม่นับงานที่ถูกยกเลิกแล้ว)
  const jobsWithInventory = jobs.filter(
    (job) => job.usedInventory && job.usedInventory.length > 0 && job.status !== 'cancelled'
  );

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

  // Returns 'pending' as default when no status exists yet
  const getInventoryRequestStatusForJob = (jobId: string): 'pending' | 'approved' | 'rejected' => {
    const job = jobs.find(j => j.id === jobId);
    return (job?.inventoryStatus as 'pending' | 'approved' | 'rejected') || 'pending';
  };

  // Handle approve inventory request
  const handleApproveInventory = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.usedInventory) return;

    if (job.inventoryStatus === "approved") {
      toast.error("คำขอนี้ถูกอนุมัติไปแล้ว");
      return;
    }

    // ตรวจสอบสต๊อกก่อนอนุมัติ
    for (const usedInv of job.usedInventory) {
      const inventoryItem = inventories.find(inv => inv.id === usedInv.id);
      if (!inventoryItem) {
        toast.error(`ไม่พบข้อมูลอุปกรณ์รหัส ${usedInv.id} ในระบบ`);
        return;
      }
      if (inventoryItem.quantity < usedInv.qty) {
        toast.error(`อุปกรณ์ "${inventoryItem.name}" มีไม่เพียงพอ (คงเหลือ ${inventoryItem.quantity} ชิ้น, ต้องการ ${usedInv.qty} ชิ้น)`);
        return; // หยุดการอนุมัติหากของไม่พอ
      }
    }

    // Update approval status in Database through jobStore
    await updateJob(jobId, { inventoryStatus: "approved" });

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
  const handleRejectInventory = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      toast.error("ไม่พบใบงาน");
      return;
    }

    if (job.inventoryStatus === "rejected") {
      toast.error("คำขอนี้ถูกปฏิเสธไปแล้ว");
      return;
    }

    // ✅ ลบ usedInventory ออกจากใบงานเมื่อปฏิเสธ และอัปเดต inventoryStatus
    await updateJob(jobId, {
      usedInventory: [],
      inventoryStatus: "rejected"
    });

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
          <TabsTrigger value="requests" className="relative">
            คำขอเบิกวัสดุจากใบงาน
            {jobsWithInventory.filter(j => getInventoryRequestStatusForJob(j.id) === 'pending').length > 0 && (
              <span className=" h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[12px] text-white">
                {jobsWithInventory.filter(j => getInventoryRequestStatusForJob(j.id) === 'pending').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Inventory Management */}
        <TabsContent value="inventory" className="space-y-6">

          {/* KPI Dashboard Snapshot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-card border-l-4 border-l-blue-500 shadow-sm rounded-lg overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-center">
                <span className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">อุปกรณ์ทั้งหมด</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">{inventories.length}</span>
                  <span className="text-sm font-medium text-muted-foreground">รายการ</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-card border-l-4 border-l-green-500 shadow-sm rounded-lg overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-center">
                <span className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">พร้อมใช้งาน</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-green-600 dark:text-green-500">{inventories.filter(i => i.status === 'พร้อมใช้').length}</span>
                  <span className="text-sm font-medium text-muted-foreground">รายการ</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-card border-l-4 border-l-yellow-500 shadow-sm rounded-lg overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-center">
                <span className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">ใกล้หมด</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-500">{inventories.filter(i => i.status === 'ใกล้หมด').length}</span>
                  <span className="text-sm font-medium text-muted-foreground">รายการ</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-card border-l-4 border-l-red-500 shadow-sm rounded-lg overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-center">
                <span className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">หมดชั่วคราว</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-red-600 dark:text-red-500">{inventories.filter(i => i.status === 'หมด').length}</span>
                  <span className="text-sm font-medium text-muted-foreground">รายการ</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ACTION BAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <ExportInventoryData />
            </div>
            <div>
              <Button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all h-10 w-full sm:w-auto px-6 rounded-md font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มอุปกรณ์ใหม่
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
              onRowClick={(row: Inventory) => handleViewInventory(row.id)}
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
                  onClick={() => handleViewInventory(item.id)}
                  className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 p-4 cursor-pointer hover:border-blue-500/50 transition-colors"
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
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-700 dark:text-gray-300">Job</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Department</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Quantity</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Approval Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Details</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
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
                              {getJobDepartments(job).join(", ") || "-"}
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
                            {getJobDepartments(job).length > 0 && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {getJobDepartments(job).join(", ")}
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
                            <p className={`text-sm text-center ${approvalStatus === 'approved'
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
        <DialogContent className="md:max-w-[750px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-card border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {editingItem ? "แก้ไขข้อมูลอุปกรณ์ (Edit Equipment)" : "เพิ่มอุปกรณ์ใหม่ (Add New Equipment)"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              กรุณากรอกและตรวจสอบข้อมูลอุปกรณ์ให้ครบถ้วนก่อนบันทึก
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Image Upload Column */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                รูปภาพอุปกรณ์ (Equipment Image)
              </Label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-[#0f1117] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center overflow-hidden h-[200px] sm:h-full min-h-[220px]">
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button variant="secondary" size="sm" type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))} className="h-8 px-3 text-xs bg-white/90 hover:bg-white text-red-600 shadow-sm border border-gray-200">
                        <Trash2 className="w-3 h-3 mr-1" /> ลบ
                      </Button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-500 dark:text-gray-400 p-6">
                    {uploadingImage ? (
                      <span className="animate-pulse text-blue-500 font-medium">กำลังอัปโหลด...</span>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3">
                          <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-200">คลิกเพื่อเพิ่มรูปภาพ</span>
                        <span className="text-xs text-gray-500 mt-1 text-center">รองรับ PNG, JPG, WEBP<br />ขนาดสูงสุด 5MB</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                )}
              </div>
            </div>

            {/* Input Fields Column */}
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ชื่ออุปกรณ์ (Equipment Name) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น สว่านไร้สาย 12V"
                  className="bg-white dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 rounded-lg placeholder:text-gray-400"
                />
              </div>

              <div className="grid gap-2 w-full">
                <Label htmlFor="type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ประเภท (Type) <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="bg-white dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 w-full rounded-lg">
                    <SelectValue placeholder="เลือกประเภท..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ต้องคืน">ต้องคืน (Returnable)</SelectItem>
                    <SelectItem value="ไม่ต้องคืน">ไม่ต้องคืน (Consumable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  จำนวนคงคลัง (Quantity) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="bg-white dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 rounded-lg"
                />

                {/* Visual Status Indicator based on Quantity */}
                {formData.quantity && (
                  <div className="mt-1 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${parseInt(formData.quantity) === 0 ? 'bg-red-500' : parseInt(formData.quantity) < 20 ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
                      สถานะสต็อก:
                    </span>
                    <Badge className={`${getStatusColor(calculateInventoryStatus(parseInt(formData.quantity) || 0))} px-2.5 py-0.5 text-[11px] font-bold shadow-sm`}>
                      {calculateInventoryStatus(parseInt(formData.quantity) || 0)}
                    </Badge>
                  </div>
                )}
              </div>
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

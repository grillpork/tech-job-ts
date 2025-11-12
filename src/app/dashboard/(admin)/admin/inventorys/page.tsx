"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Search, MoreVertical } from "lucide-react";
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

// Mock data
import { Inventory } from "@/lib/types/inventory";
import { useInventoryStore } from "@/stores/features/inventoryStore";

// ===========================
// MAIN COMPONENT
// ===========================
const InventoryManagement = () => {
  const {
    inventories,
    addInventory,
    updateInventory,
    deleteInventory,
    clearAll,
  } = useInventoryStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: "",
    status: "",
    type: "",
    quantity: "",
    requireFrom: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { reorderInventory } = useInventoryStore();

  const filteredItems = inventories.filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requireFrom.toLowerCase().includes(searchTerm.toLowerCase());

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
      render: (row: Inventory) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (row: Inventory) => <span className="font-semibold">{row.quantity}</span>,
    },
    {
      key: "requireFrom",
      label: "Requite From",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: Inventory) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1d29]"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 w-40">
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500/20 text-green-400 border-green-500/30 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
      case "In Use":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30";
      case "Maintenance":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30";
      case "Out of Stock":
        return "bg-red-500/20 text-red-400 border-red-500/30 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30";
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      status: "",
      type: "",
      quantity: "",
      requireFrom: "",
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
      status: item.status,
      type: item.type,
      quantity: item.quantity.toString(),
      requireFrom: item.requireFrom,
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (
      !formData.name ||
      !formData.status ||
      !formData.type ||
      !formData.quantity ||
      !formData.requireFrom
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingItem) {
      updateInventory({
        ...editingItem,
        name: formData.name,
        status: formData.status as Inventory["status"],
        type: formData.type as Inventory["type"],
        quantity: parseInt(formData.quantity),
        requireFrom: formData.requireFrom,
      });
    } else {
      const newItem: Inventory = {
        id: crypto.randomUUID(),
        name: formData.name,
        status: formData.status as Inventory["status"],
        type: formData.type as Inventory["type"],
        quantity: parseInt(formData.quantity),
        location: "Main Warehouse",
        requireFrom: formData.requireFrom,
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

  return (
    <div className="p-3 sm:p-6">
      {/* HEADER SECTION */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
          Inventory Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          หน้าจัดการอุปกรณ์
        </p>
      </div>

      {/* ACTION BAR (kept simple - Add button) */}
      <div className="mb-4 sm:mb-4 flex items-center justify-between">
        <div />
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
                { label: "Available", value: "Available" },
                { label: "In Use", value: "In Use" },
                { label: "Maintenance", value: "Maintenance" },
                { label: "Out of Stock", value: "Out of Stock" },
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
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 w-40"
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
                <div className="col-span-2">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    Requite From
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {item.requireFrom}
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

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px] w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
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
                  htmlFor="status"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-600 w-full">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                    <SelectItem
                      value="Available"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Available
                    </SelectItem>
                    <SelectItem
                      value="In Use"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      In Use
                    </SelectItem>
                    <SelectItem
                      value="Maintenance"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Maintenance
                    </SelectItem>
                    <SelectItem
                      value="Out of Stock"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Out of Stock
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                      value="Laptop"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Laptop
                    </SelectItem>
                    <SelectItem
                      value="Monitor"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Monitor
                    </SelectItem>
                    <SelectItem
                      value="Peripheral"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Peripheral
                    </SelectItem>
                    <SelectItem
                      value="Network"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Network
                    </SelectItem>
                    <SelectItem
                      value="Server"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Server
                    </SelectItem>
                    <SelectItem
                      value="Other"
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]"
                    >
                      Other
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
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="requiteFrom"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Requite From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="requiteFrom"
                value={formData.requireFrom}
                onChange={(e) =>
                  setFormData({ ...formData, requireFrom: e.target.value })
                }
                placeholder="แผนกที่ร้องขอ"
                className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-600"
              />
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
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
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

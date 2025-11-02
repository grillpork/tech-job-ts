'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data
import { mockInventoryData, type InventoryItem } from '@/lib/mocks/inventory';

// ===========================
// MAIN COMPONENT
// ===========================
const InventoryManagement = () => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  const [items, setItems] = useState<InventoryItem[]>(mockInventoryData);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    status: '',
    type: '',
    quantity: '',
    requiteFrom: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ===========================
  // FILTERING & PAGINATION LOGIC
  // ===========================
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requiteFrom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // ===========================
  // HELPER FUNCTIONS
  // ===========================
  
  const resetForm = () => {
    setFormData({
      title: '',
      status: '',
      type: '',
      quantity: '',
      requiteFrom: ''
    });
    setEditingItem(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'In Use':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Out of Stock':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // ===========================
  // EVENT HANDLERS
  // ===========================
  
  const handleAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      status: item.status,
      type: item.type,
      quantity: item.quantity.toString(),
      requiteFrom: item.requiteFrom
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.status || !formData.type || !formData.quantity || !formData.requiteFrom) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (editingItem) {
      setItems(items.map(item =>
        item.id === editingItem.id
          ? { ...item, ...formData, quantity: parseInt(formData.quantity) }
          : item
      ));
    } else {
      const newItem = {
        id: Math.max(...items.map(i => i.id), 0) + 1,
        ...formData,
        quantity: parseInt(formData.quantity)
      };
      setItems([...items, newItem]);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteClick = (id: number) => {
    setDeletingItemId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    setItems(items.filter(item => item.id !== deletingItemId));
    setIsDeleteAlertOpen(false);
    setDeletingItemId(null);
    
    if (currentItems.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="p-3 sm:p-6">
      {/* HEADER SECTION */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Inventory Management</h1>
        <p className="text-sm sm:text-base text-gray-400">หน้าจัดการอุปกรณ์</p>
      </div>

      {/* SEARCH & FILTER SECTION */}
      <div className="bg-transparent rounded-xl border border-gray-700/30 mb-4 sm:mb-4 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search & Add Button Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-[#0f1117] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-700 h-10"
              />
            </div>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add equipment
            </Button>
          </div>
          
          {/* Status Filter - Mobile */}
          <div className="block sm:hidden">
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full bg-[#0f1117] border-gray-800 text-white focus:border-blue-600">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d29] border-gray-800">
                <SelectItem value="all" className="text-white hover:bg-[#0f1117]">All Status</SelectItem>
                <SelectItem value="Available" className="text-white hover:bg-[#0f1117]">Available</SelectItem>
                <SelectItem value="In Use" className="text-white hover:bg-[#0f1117]">In Use</SelectItem>
                <SelectItem value="Maintenance" className="text-white hover:bg-[#0f1117]">Maintenance</SelectItem>
                <SelectItem value="Out of Stock" className="text-white hover:bg-[#0f1117]">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-transparent rounded-xl border border-gray-700/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/30 bg-transparent">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[140px] h-8 bg-transparent border-gray-700 text-gray-300 hover:bg-[#0f1117] focus:border-blue-600">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d29] border-gray-800">
                      <SelectItem value="all" className="text-white hover:bg-[#0f1117]">All Status</SelectItem>
                      <SelectItem value="Available" className="text-white hover:bg-[#0f1117]">Available</SelectItem>
                      <SelectItem value="In Use" className="text-white hover:bg-[#0f1117]">In Use</SelectItem>
                      <SelectItem value="Maintenance" className="text-white hover:bg-[#0f1117]">Maintenance</SelectItem>
                      <SelectItem value="Out of Stock" className="text-white hover:bg-[#0f1117]">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Requite From</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{item.title}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{item.type}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-white">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{item.requiteFrom}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#1a1d29]"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1d29] border-gray-800 w-40">
                            <DropdownMenuItem 
                              onClick={() => handleEdit(item)}
                              className="text-gray-300 hover:bg-[#0f1117] hover:text-blue-400 cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(item.id)}
                              className="text-gray-300 hover:bg-[#0f1117] hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-12 w-12 text-gray-700" />
                      <p className="text-lg font-medium text-gray-400">ไม่พบข้อมูลอุปกรณ์</p>
                      <p className="text-sm text-gray-500">ลองค้นหาด้วยคำอื่นหรือเพิ่มอุปกรณ์ใหม่</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {currentItems.length > 0 ? (
          currentItems.map((item) => (
            <div key={item.id} className="bg-transparent rounded-xl border border-gray-700/30 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{item.title}</h3>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#1a1d29]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1d29] border-gray-800 w-40">
                    <DropdownMenuItem 
                      onClick={() => handleEdit(item)}
                      className="text-gray-300 hover:bg-[#0f1117] hover:text-blue-400 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-gray-300 hover:bg-[#0f1117] hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Type</p>
                  <p className="text-white">{item.type}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Quantity</p>
                  <p className="text-white font-semibold">{item.quantity}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 mb-1">Requite From</p>
                  <p className="text-white">{item.requiteFrom}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#1a1d29] rounded-xl border border-gray-800 p-8 text-center">
            <Search className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-400 mb-1">ไม่พบข้อมูลอุปกรณ์</p>
            <p className="text-sm text-gray-500">ลองค้นหาด้วยคำอื่นหรือเพิ่มอุปกรณ์ใหม่</p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {filteredItems.length > 0 && (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
            แสดง <span className="font-medium text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)}</span> จาก <span className="font-medium text-white">{filteredItems.length}</span> รายการ
          </p>
          <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto justify-center">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:border-gray-700 text-sm h-9 px-3"
            >
              Previous
            </Button>
            <span className="px-3 sm:px-4 py-2 rounded-lg bg-transparent text-white font-medium min-w-[2.5rem] sm:min-w-[3rem] text-center text-sm">
              {currentPage}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:border-gray-700 text-sm h-9 px-3"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        )}
        <DialogContent className="sm:max-w-[550px] w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto bg-[#1a1d29] border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-white">{editingItem ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              กรอกข้อมูลอุปกรณ์ให้ครบถ้วน
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-300">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ชื่ออุปกรณ์"
                className="bg-[#0f1117] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-600"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2 w-full">
                <Label htmlFor="status" className="text-sm font-medium text-gray-300">Status <span className="text-red-500">*</span></Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-[#0f1117] border-gray-800 text-white focus:border-blue-600 w-full">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d29] border-gray-800">
                    <SelectItem value="Available" className="text-white hover:bg-[#0f1117]">Available</SelectItem>
                    <SelectItem value="In Use" className="text-white hover:bg-[#0f1117]">In Use</SelectItem>
                    <SelectItem value="Maintenance" className="text-white hover:bg-[#0f1117]">Maintenance</SelectItem>
                    <SelectItem value="Out of Stock" className="text-white hover:bg-[#0f1117]">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 w-full">
                <Label htmlFor="type" className="text-sm font-medium text-gray-300">Type <span className="text-red-500">*</span></Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="bg-[#0f1117] border-gray-800 text-white focus:border-blue-600 w-full">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d29] border-gray-800">
                    <SelectItem value="Laptop" className="text-white hover:bg-[#0f1117]">Laptop</SelectItem>
                    <SelectItem value="Monitor" className="text-white hover:bg-[#0f1117]">Monitor</SelectItem>
                    <SelectItem value="Peripheral" className="text-white hover:bg-[#0f1117]">Peripheral</SelectItem>
                    <SelectItem value="Network" className="text-white hover:bg-[#0f1117]">Network</SelectItem>
                    <SelectItem value="Server" className="text-white hover:bg-[#0f1117]">Server</SelectItem>
                    <SelectItem value="Other" className="text-white hover:bg-[#0f1117]">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-300">Quantity <span className="text-red-500">*</span></Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="จำนวน"
                min="0"
                className="bg-[#0f1117] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-600"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requiteFrom" className="text-sm font-medium text-gray-300">Requite From <span className="text-red-500">*</span></Label>
              <Input
                id="requiteFrom"
                value={formData.requiteFrom}
                onChange={(e) => setFormData({ ...formData, requiteFrom: e.target.value })}
                placeholder="แผนกที่ร้องขอ"
                className="bg-[#0f1117] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-600"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsFormOpen(false)}
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-[#0f1117] w-full sm:w-auto"
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มอุปกรณ์'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        {isDeleteAlertOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        )}
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md bg-[#1a1d29] border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-white">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-400">
              คุณแน่ใจไหมที่จะลบอุปกรณ์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-transparent border-gray-700 text-gray-300 hover:bg-[#0f1117] w-full sm:w-auto m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto m-0">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryManagement;
'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, MoreVertical, Eye } from 'lucide-react';
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

// Types
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
}

// Mock data
const mockUsersData: User[] = [
  {
    id: 1,
    name: 'Arthur Taylor',
    email: 'arthur@company.com',
    password: '********',
    role: 'Admin',
    department: 'IT Department'
  },
  {
    id: 2,
    name: 'Sophia Williams',
    email: 'sophia@company.com',
    password: '********',
    role: 'User',
    department: 'HR Department'
  },
  {
    id: 3,
    name: 'Matthew Johnson',
    email: 'matthew@company.com',
    password: '********',
    role: 'Manager',
    department: 'Engineering'
  },
  {
    id: 4,
    name: 'James Brown',
    email: 'james@company.com',
    password: '********',
    role: 'User',
    department: 'Marketing'
  },
  {
    id: 5,
    name: 'Wei Chen',
    email: 'wei@company.com',
    password: '********',
    role: 'Manager',
    department: 'Operations'
  }
];

// ===========================
// MAIN COMPONENT
// ===========================
const UsersManagement = () => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  const [users, setUsers] = useState<User[]>(mockUsersData);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // ===========================
  // FILTERING & PAGINATION LOGIC
  // ===========================
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // ===========================
  // HELPER FUNCTIONS
  // ===========================
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      department: ''
    });
    setEditingUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30';
      case 'Manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
      case 'User':
        return 'bg-green-500/20 text-green-400 border-green-500/30 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30';
    }
  };

  // ===========================
  // EVENT HANDLERS
  // ===========================
  
  const handleAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      department: user.department
    });
    setIsFormOpen(true);
  };

  const handleViewDetails = (user: User) => {
    // View details functionality - you can implement this later
    console.log('View details for user:', user);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.department) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (editingUser) {
      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      ));
    } else {
      const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        ...formData
      };
      setUsers([...users, newUser]);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteClick = (id: number) => {
    setDeletingUserId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = () => {
    setUsers(users.filter(user => user.id !== deletingUserId));
    setIsDeleteAlertOpen(false);
    setDeletingUserId(null);
    
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Users Management</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">หน้าจัดการผู้ใช้งาน</p>
      </div>

      {/* SEARCH & FILTER SECTION */}
      <div className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 mb-4 sm:mb-4 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search & Add Button Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-gray-50 dark:bg-[#0f1111] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-700 h-10"
              />
            </div>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white h-10 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          
          {/* Role Filter - Mobile */}
          <div className="block sm:hidden">
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-600">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">All Roles</SelectItem>
                <SelectItem value="Admin" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Admin</SelectItem>
                <SelectItem value="Manager" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Manager</SelectItem>
                <SelectItem value="User" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter - Mobile */}
          <div className="block sm:hidden">
            <Select value={departmentFilter} onValueChange={(value) => {
              setDepartmentFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-600">
                <SelectValue placeholder="Filter Department" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">All Departments</SelectItem>
                <SelectItem value="IT Department" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">IT Department</SelectItem>
                <SelectItem value="HR Department" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">HR Department</SelectItem>
                <SelectItem value="Engineering" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Engineering</SelectItem>
                <SelectItem value="Marketing" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Marketing</SelectItem>
                <SelectItem value="Operations" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Operations</SelectItem>
                <SelectItem value="Finance" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700/30 bg-gray-50 dark:bg-transparent">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Select value={roleFilter} onValueChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[140px] h-8 bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] focus:border-blue-500 dark:focus:border-blue-600">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                      <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">All Roles</SelectItem>
                      <SelectItem value="Admin" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Admin</SelectItem>
                      <SelectItem value="Manager" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Manager</SelectItem>
                      <SelectItem value="User" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">User</SelectItem>
                    </SelectContent>
                  </Select>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Select value={departmentFilter} onValueChange={(value) => {
                    setDepartmentFilter(value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] focus:border-blue-500 dark:focus:border-blue-600">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                      <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">All Departments</SelectItem>
                      <SelectItem value="IT Department" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">IT Department</SelectItem>
                      <SelectItem value="HR Department" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">HR Department</SelectItem>
                      <SelectItem value="Engineering" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Engineering</SelectItem>
                      <SelectItem value="Marketing" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Marketing</SelectItem>
                      <SelectItem value="Operations" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Operations</SelectItem>
                      <SelectItem value="Finance" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/30">
              {currentItems.length > 0 ? (
                currentItems.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.department}</td>
                    <td className="px-6 py-4">
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
                            {/* view detail Desktop */}
                            <DropdownMenuItem 
                              onClick={() => handleViewDetails(user)}
                              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-gray-900 dark:hover:text-white cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {/* Edit Desktop */}
                            <DropdownMenuItem 
                              onClick={() => handleEdit(user)}
                              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {/* Delete Desktop */}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(user.id)}
                              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">ไม่พบข้อมูลผู้ใช้งาน</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">ลองค้นหาด้วยคำอื่นหรือเพิ่มผู้ใช้งานใหม่</p>
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
          currentItems.map((user) => (
            <div key={user.id} className="bg-white dark:bg-transparent rounded-xl border border-gray-200 dark:border-gray-700/30 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-gray-900 dark:text-white font-medium mb-1">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {user.role}
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
                  <DropdownMenuContent align="end" className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 w-40">
                    {/* View Details Mobile */}
                    <DropdownMenuItem 
                      onClick={() => handleViewDetails(user)}
                      className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-gray-900 dark:hover:text-white cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {/* Edit Mobile */}
                    <DropdownMenuItem 
                      onClick={() => handleEdit(user)}
                      className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {/* Delete Mobile */}
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(user.id)}
                      className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Department</p>
                  <p className="text-gray-900 dark:text-white">{user.department}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-[#1a1d29] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-1">ไม่พบข้อมูลผู้ใช้งาน</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">ลองค้นหาด้วยคำอื่นหรือเพิ่มผู้ใช้งานใหม่</p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
            แสดง <span className="font-medium text-gray-900 dark:text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)}</span> จาก <span className="font-medium text-gray-900 dark:text-white">{filteredUsers.length}</span> รายการ
          </p>
          <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto justify-center">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:border-gray-300 dark:disabled:border-gray-700 text-sm h-9 px-3"
            >
              Previous
            </Button>
            <span className="px-3 sm:px-4 py-2 rounded-lg bg-gray-100 dark:bg-transparent text-gray-900 dark:text-white font-medium min-w-[2.5rem] sm:min-w-[3rem] text-center text-sm">
              {currentPage}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:border-gray-300 dark:disabled:border-gray-700 text-sm h-9 px-3"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px] w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">{editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              กรอกข้อมูลผู้ใช้งานให้ครบถ้วน
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ชื่อผู้ใช้งาน"
                className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-600"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="อีเมล"
                className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-600"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="รหัสผ่าน"
                className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-600"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2 w-full">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role <span className="text-red-500">*</span></Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-600 w-full">
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                    <SelectItem value="Admin" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Admin</SelectItem>
                    <SelectItem value="Manager" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Manager</SelectItem>
                    <SelectItem value="User" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 w-full">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department <span className="text-red-500">*</span></Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger className="bg-gray-50 dark:bg-[#0f1117] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-600 w-full">
                    <SelectValue placeholder="เลือกแผนก" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800">
                    <SelectItem value="IT Department" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">IT Department</SelectItem>
                    <SelectItem value="HR Department" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">HR Department</SelectItem>
                    <SelectItem value="Engineering" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Engineering</SelectItem>
                    <SelectItem value="Marketing" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Marketing</SelectItem>
                    <SelectItem value="Operations" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Operations</SelectItem>
                    <SelectItem value="Finance" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#0f1117]">Finance</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้งาน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        {isDeleteAlertOpen && (
          <div className="fixed inset-0 z-40" />
        )}
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md bg-white dark:bg-[#1a1d29] border-gray-200 dark:border-gray-800 z-50 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-gray-900 dark:text-white">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              คุณแน่ใจไหมที่จะลบผู้ใช้งานนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-white dark:bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f1117] w-full sm:w-auto m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto m-0">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManagement; 
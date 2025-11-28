"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const { users, updateUser } = useUserStore();
  const { jobs } = useJobStore();

  const fileRef = useRef<HTMLInputElement | null>(null);

  // Find the user to edit based on URL param
  const userToEdit = users.find(u => u.id === userId);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    address: "",
    github: "",
    linkedin: "",
    bio: "",
    skills: "",
    accountTier: "",
    referralCode: "",
    accountProgressTier: "",
    employmentType: "",
    imageUrl: "",
    employeeId: "",
    status: "",
    joinedAt: "",
    password: "", // New password field
  });

  useEffect(() => {
    if (userToEdit) {
      setForm({
        name: userToEdit.name || "",
        email: userToEdit.email || "",
        role: userToEdit.role || "employee",
        department: userToEdit.department || "",
        phone: userToEdit.phone || "",
        address: userToEdit.address || "",
        github: userToEdit.github || "",
        linkedin: userToEdit.linkedin || "",
        bio: userToEdit.bio || "",
        skills: (userToEdit.skills || []).join(", "),
        accountTier: userToEdit.accountTier || "",
        referralCode: userToEdit.referralCode || "",
        accountProgressTier: userToEdit.accountProgressTier || "",
        employmentType: userToEdit.employmentType || "",
        imageUrl: userToEdit.imageUrl || "",
        employeeId: userToEdit.employeeId || "",
        status: userToEdit.status || "active",
        joinedAt: userToEdit.joinedAt || "",
        password: "", // Don't show existing password
      });
    }
  }, [userToEdit]);

  if (!userToEdit) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg text-gray-600 mb-4">ไม่พบข้อมูลผู้ใช้</p>
        <Button onClick={() => router.push('/dashboard/admin/users')}>กลับไปหน้ารายชื่อผู้ใช้</Button>
      </div>
    );
  }

  const handleChange = (k: string, v: string) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  const onFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm((s) => ({ ...s, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const updatedData: any = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      department: form.department || null,
      phone: form.phone || null,
      address: form.address || null,
      github: form.github || null,
      linkedin: form.linkedin || null,
      bio: form.bio || null,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      referralCode: form.referralCode || null,
      accountProgressTier: form.accountProgressTier || null,
      employmentType: form.employmentType || null,
      employeeId: form.employeeId || null,
      status: form.status,
      joinedAt: form.joinedAt || null,
      accountTier: form.accountTier || null,
    };

    if (form.imageUrl) updatedData.imageUrl = form.imageUrl;
    if (form.password) updatedData.password = form.password;

    try {
      updateUser(userId, updatedData);

      // Propagate changes to jobs
      try {
        const newName = updatedData.name || userToEdit.name;
        const newImage = updatedData.imageUrl !== undefined ? updatedData.imageUrl : userToEdit.imageUrl;

        const updatedJobs = jobs.map((job) => {
          const j = { ...job } as any;
          if (j.creator?.id === userId) j.creator = { ...j.creator, name: newName };
          if (Array.isArray(j.assignedEmployees)) j.assignedEmployees = j.assignedEmployees.map((u: any) => u.id === userId ? { ...u, name: newName, imageUrl: newImage } : u);
          if (j.leadTechnician && j.leadTechnician.id === userId) j.leadTechnician = { ...j.leadTechnician, name: newName, imageUrl: newImage };
          return j;
        });
        useJobStore.setState({ jobs: updatedJobs });
      } catch (jobErr) {
        console.warn("Failed to propagate user changes to jobs:", jobErr);
      }

      toast.success("บันทึกข้อมูลสำเร็จ");
      router.push('/dashboard/admin/users');
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Left column: avatar + actions */}
        <aside className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 h-fit">
          <div className="relative">
            <div className="h-28 w-28">
              <Avatar className="h-28 w-28">
                {form.imageUrl ? (
                  <AvatarImage src={form.imageUrl} alt={form.name} />
                ) : (
                  <AvatarFallback>{(form.name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            <div className="mt-3 flex flex-col gap-2 w-full">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>เปลี่ยนรูปภาพ</Button>
              <Button variant="ghost" onClick={() => { setForm((s) => ({ ...s, imageUrl: '' })); if (fileRef.current) fileRef.current.value = ''; }}>ลบรูปภาพ</Button>
            </div>
          </div>

          <div className="text-center mt-4 w-full">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{form.name || '—'}</div>
            <div className="text-xs text-gray-500 truncate">{form.email || '-'}</div>
            <div className="mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800">
              {form.role}
            </div>
          </div>
        </aside>

        {/* Right column: form */}
        <section className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">แก้ไขข้อมูลผู้ใช้</h2>
              <p className="text-xs text-gray-500">แก้ไขข้อมูลส่วนตัวและสิทธิ์การใช้งานของผู้ใช้</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => router.push('/dashboard/admin/users')}>ยกเลิก</Button>
              <Button onClick={handleSave}>บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b">ข้อมูลพื้นฐาน</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
                  <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>อีเมล <span className="text-red-500">*</span></Label>
                  <Input value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>เบอร์โทรศัพท์</Label>
                  <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>รหัสพนักงาน</Label>
                  <Input value={form.employeeId} onChange={(e) => handleChange('employeeId', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)</Label>
                  <Input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="mt-1" placeholder="ตั้งรหัสผ่านใหม่" />
                </div>
              </div>
            </div>

            {/* Role & Department */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b">บทบาทและแผนก</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>บทบาท</Label>
                  <Select value={form.role} onValueChange={(value) => handleChange("role", value)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="lead_technician">Lead Technician</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>แผนก</Label>
                  <Select value={form.department} onValueChange={(value) => handleChange("department", value)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electrical">ช่างไฟฟ้า</SelectItem>
                      <SelectItem value="Mechanical">ช่างเครื่องกล</SelectItem>
                      <SelectItem value="Civil">ช่างโยธา</SelectItem>
                      <SelectItem value="Technical">ช่างเทคนิค</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>สถานะ</Label>
                  <Select value={form.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ประเภทการจ้างงาน</Label>
                  <Input value={form.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b">ข้อมูลเพิ่มเติม</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                  <Label>ที่อยู่</Label>
                  <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>GitHub</Label>
                  <Input value={form.github} onChange={(e) => handleChange('github', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input value={form.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} className="mt-1" />
                </div>
                <div className="lg:col-span-2">
                  <Label>Bio</Label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className="w-full mt-1 p-2 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#191919] min-h-[100px]"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Label>ทักษะ (คั่นด้วย comma)</Label>
                  <Input value={form.skills} onChange={(e) => handleChange('skills', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>

            {/* System Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b">ข้อมูลระบบ</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Account Tier</Label>
                  <Input value={form.accountTier} onChange={(e) => handleChange('accountTier', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Referral Code</Label>
                  <Input value={form.referralCode} onChange={(e) => handleChange('referralCode', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Account Progress Tier</Label>
                  <Input value={form.accountProgressTier} onChange={(e) => handleChange('accountProgressTier', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>วันที่เข้าร่วม</Label>
                  <Input type="date" value={form.joinedAt} onChange={(e) => handleChange('joinedAt', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

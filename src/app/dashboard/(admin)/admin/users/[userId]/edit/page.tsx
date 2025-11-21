"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const { users, updateUser } = useUserStore();

  const user = users.find((u) => u.id === userId);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    bio: "",
    skills: "",
    employeeId: "",
    github: "",
    linkedin: "",
    employmentType: "",
    accountTier: "",
    referralCode: "",
    accountProgressTier: "",
    address: "",
    joinedAt: "",
    imageUrl: "",
    status: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "",
        department: (user as any).department ?? "",
        bio: user.bio ?? "",
        skills: user.skills ? user.skills.join(", ") : "",
        employeeId: user.employeeId ?? "",
        github: user.github ?? "",
        linkedin: user.linkedin ?? "",
        employmentType: user.employmentType ?? "",
        accountTier: user.accountTier ?? "",
        referralCode: user.referralCode ?? "",
        accountProgressTier: user.accountProgressTier ?? "",
        address: user.address ?? "",
        joinedAt: user.joinedAt ?? "",
        imageUrl: user.imageUrl ?? "",
        status: (user as any).status ?? "active",
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-600">ไม่พบผู้ใช้ที่ต้องการแก้ไข</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard/admin/users")}>
              กลับไปที่หน้าจัดการผู้ใช้
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (key: string, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email) {
      toast.error("กรุณากรอกชื่อและอีเมล");
      return;
    }

    const updated: any = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      department: form.department || null,
      bio: form.bio || null,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      employeeId: form.employeeId || null,
      github: form.github || null,
      linkedin: form.linkedin || null,
      employmentType: form.employmentType || null,
      accountTier: form.accountTier || null,
      referralCode: form.referralCode || null,
      accountProgressTier: form.accountProgressTier || null,
      address: form.address || null,
      joinedAt: form.joinedAt || null,
      imageUrl: form.imageUrl || null,
      status: form.status || "active",
    };

    try {
      updateUser(userId, updated);
      toast.success("อัปเดตข้อมูลผู้ใช้สำเร็จ");
      router.push("/dashboard/admin/users");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">แก้ไขข้อมูลผู้ใช้</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">
                ชื่อ <span className="text-red-500">*</span>
              </Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.name} 
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">
                อีเมล <span className="text-red-500">*</span>
              </Label>
              <Input 
                type="email" 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.email} 
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">เบอร์โทรศัพท์</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.phone} 
                onChange={(e) => handleChange("phone", e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">แผนก</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.department} 
                onChange={(e) => handleChange("department", e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">บทบาท</Label>
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
              <Label className="text-sm text-gray-500">สถานะ</Label>
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
              <Label className="text-sm text-gray-500">รหัสพนักงาน</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.employeeId} 
                onChange={(e) => handleChange("employeeId", e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">URL รูปภาพ</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.imageUrl} 
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-500">ที่อยู่</Label>
            <Input 
              className="w-full border rounded px-3 py-2 mt-1" 
              value={form.address} 
              onChange={(e) => handleChange("address", e.target.value)} 
            />
          </div>

          <div>
            <Label className="text-sm text-gray-500">Bio</Label>
            <textarea 
              className="w-full border rounded px-3 py-2 mt-1" 
              rows={4} 
              value={form.bio} 
              onChange={(e) => handleChange("bio", e.target.value)} 
            />
          </div>

          <div>
            <Label className="text-sm text-gray-500">ทักษะ (คั่นด้วย comma)</Label>
            <Input 
              className="w-full border rounded px-3 py-2 mt-1" 
              value={form.skills} 
              onChange={(e) => handleChange("skills", e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">GitHub</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.github} 
                onChange={(e) => handleChange("github", e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">LinkedIn</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.linkedin} 
                onChange={(e) => handleChange("linkedin", e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-500">ประเภทการจ้างงาน</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.employmentType} 
                onChange={(e) => handleChange("employmentType", e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">Account Tier</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.accountTier} 
                onChange={(e) => handleChange("accountTier", e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">Referral Code</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.referralCode} 
                onChange={(e) => handleChange("referralCode", e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">Account Progress Tier</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.accountProgressTier} 
                onChange={(e) => handleChange("accountProgressTier", e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">วันที่เข้าร่วม</Label>
              <Input 
                type="date"
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.joinedAt} 
                onChange={(e) => handleChange("joinedAt", e.target.value)} 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit">บันทึก</Button>
            <Button variant="ghost" type="button" onClick={() => router.push("/dashboard/admin/users")}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


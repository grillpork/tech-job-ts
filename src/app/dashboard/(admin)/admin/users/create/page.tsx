"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notificationHelpers } from "@/stores/notificationStore";

export default function CreateUserPage() {
  const router = useRouter();
  const { createUser } = useUserStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "employee",
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
    password: "",
    imageUrl: "",
    status: "active",
    facebook: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email) {
      toast.error("กรุณากรอกชื่อและอีเมล");
      return;
    }

    const newUser = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      role: form.role as "admin" | "manager" | "lead_technician" | "employee",
      department: form.department || null,
      bio: form.bio || null,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      employeeId: form.employeeId || null,
      github: form.github || null,
      linkedin: form.linkedin || null,
      employmentType: form.employmentType || null,
      accountTier: form.accountTier || null,
      referralCode: form.referralCode || null,
      accountProgressTier: form.accountProgressTier || null,
      address: form.address || null,
      joinedAt: form.joinedAt || null,
      password: form.password || "password123",
      imageUrl: form.imageUrl || null,
      status: form.status || "active",
      facebook: form.facebook || null,
    };

    try {
      createUser(newUser);

      // ✅ สร้าง notification เมื่อสร้างผู้ใช้สำเร็จ
      const createdUser = useUserStore.getState().users.find(u => u.email === form.email);
      if (createdUser) {
        notificationHelpers.userCreated(
          createdUser.name,
          createdUser.id
        );
      }

      toast.success("สร้างบัญชีผู้ใช้สำเร็จ");
      router.push("/dashboard/admin/users");
    } catch (error: any) {
      if (error.message === "Email already exists") {
        toast.error("อีเมลนี้มีอยู่ในระบบแล้ว");
      } else {
        toast.error("เกิดข้อผิดพลาดในการสร้างผู้ใช้");
      }
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">สร้างบัญชีผู้ใช้ใหม่</h2>
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
              <Label className="text-sm text-gray-500">อีเมลพนักงาน</Label>
              <Input
                className="w-full border rounded px-3 py-2 mt-1 "
                value={form.employeeId}
                onChange={(e) => handleChange("employeeId", e.target.value)}
                placeholder="สร้างอีเมลพนักงาน"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500">รหัสผ่าน</Label>
              <Input
                type="password"
                className="w-full border rounded px-3 py-2 mt-1"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="สร้างรหัสผ่าน"
              />
              <p className="text-xs text-muted-foreground mt-1">
                หากไม่กรอกจะใช้รหัสผ่านเริ่มต้น: password123
              </p>
            </div>
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
                  <SelectItem value="manager">CEO</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div>
              <Label className="text-sm text-gray-500">Facebook</Label>
              <Input
                className="w-full border rounded px-3 py-2 mt-1"
                value={form.facebook}
                onChange={(e) => handleChange("facebook", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* <div>
              <Label className="text-sm text-gray-500">ประเภทการจ้างงาน</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.employmentType} 
                onChange={(e) => handleChange("employmentType", e.target.value)} 
              />
            </div> */}
            {/* <div>
              <Label className="text-sm text-gray-500">Account Tier</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.accountTier} 
                onChange={(e) => handleChange("accountTier", e.target.value)} 
              />
            </div> */}
            {/* <div>
              <Label className="text-sm text-gray-500">Referral Code</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.referralCode} 
                onChange={(e) => handleChange("referralCode", e.target.value)} 
              />
            </div> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <div>
              <Label className="text-sm text-gray-500">Account Progress Tier</Label>
              <Input 
                className="w-full border rounded px-3 py-2 mt-1" 
                value={form.accountProgressTier} 
                onChange={(e) => handleChange("accountProgressTier", e.target.value)} 
              />
            </div> */}
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

          <div>
            <Label className="text-sm text-gray-500">รูปโปรไฟล์</Label>
            <div className="mt-2 flex items-center gap-4">
              <Avatar className="h-20 w-20 border border-gray-200">
                <AvatarImage src={form.imageUrl} className="object-cover" />
                <AvatarFallback>{form.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                เลือกรูปภาพ
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit">สร้างบัญชี</Button>
            <Button variant="ghost" type="button" onClick={() => router.push("/dashboard/admin/users")}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


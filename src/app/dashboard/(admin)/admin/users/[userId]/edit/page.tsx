"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const { users, updateUser } = useUserStore();

  const user = users.find((u) => u.id === userId);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm((s) => ({ ...s, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
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
      bio: form.bio || null,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      employeeId: form.employeeId || null,
      github: form.github || null,
      linkedin: form.linkedin || null,
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <aside className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-28 w-28">
              <Avatar className="h-28 w-28">
                {form.imageUrl ? (
                  <AvatarImage src={form.imageUrl} alt={form.name} />
                ) : (
                  <AvatarFallback>
                    {(form.name || "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-3 flex flex-col gap-2 w-full">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Change Photo
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setForm((s) => ({ ...s, imageUrl: "" }));
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                Remove Photo
              </Button>
            </div>
          </div>

          <div className="text-center mt-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{form.name || "—"}</div>
            <div className="text-xs text-gray-500">{form.email || "-"}</div>
          </div>
        </aside>

        <section className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Edit User</h2>
              <p className="text-xs text-gray-500">Update user details. Role, department, employment type and tier are read-only.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => router.push("/dashboard/admin/users")}>
                Cancel
              </Button>
              <Button type="submit" form="edit-user-form">
                Save changes
              </Button>
            </div>
          </div>

          <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label>ชื่อ *</Label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="mt-1" required />

                <Label className="mt-4">อีเมล *</Label>
                <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="mt-1" type="email" required />

                <Label className="mt-4">บทบาท</Label>
                <Input value={form.role} readOnly disabled className="mt-1 text-gray-200 cursor-not-allowed" />

                <Label className="mt-4">แผนก</Label>
                <Input value={form.department} readOnly disabled className="mt-1 text-gray-200 cursor-not-allowed" />

                <Label className="mt-4">เบอร์โทรศัพท์</Label>
                <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label>ที่อยู่</Label>
                <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} className="mt-1" />

                <Label className="mt-4">GitHub</Label>
                <Input value={form.github} onChange={(e) => handleChange("github", e.target.value)} className="mt-1" />

                <Label className="mt-4">LinkedIn</Label>
                <Input value={form.linkedin} onChange={(e) => handleChange("linkedin", e.target.value)} className="mt-1" />

                <Label className="mt-4">ประเภทการจ้างงาน</Label>
                <Input value={form.employmentType} readOnly disabled className="mt-1 text-gray-200 cursor-not-allowed" />
              </div>
            </div>

            <div>
              <Label>สถานะ</Label>
              <Input value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label>Bio</Label>
              <textarea className="w-full border rounded px-3 py-2 mt-1" rows={4} value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} />
            </div>

            <div>
              <Label>ทักษะ (คั่นด้วย comma)</Label>
              <Input value={form.skills} onChange={(e) => handleChange("skills", e.target.value)} className="mt-1" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label>รหัสพนักงาน</Label>
                <Input value={form.employeeId} onChange={(e) => handleChange("employeeId", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>วันที่เข้าร่วม</Label>
                <Input type="date" value={form.joinedAt ?? ""} onChange={(e) => handleChange("joinedAt", e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label>Account Tier</Label>
                <Input value={form.accountTier} readOnly disabled className="mt-1 text-gray-200 cursor-not-allowed" />
              </div>
              <div>
                <Label>Referral Code</Label>
                <Input value={form.referralCode} onChange={(e) => handleChange("referralCode", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Account Progress Tier</Label>
                <Input value={form.accountProgressTier} onChange={(e) => handleChange("accountProgressTier", e.target.value)} className="mt-1" />
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}


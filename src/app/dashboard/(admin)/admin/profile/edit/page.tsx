"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function EditUserPage() {
  const router = useRouter();
  const { currentUser, updateUser, users, switchUserById } = useUserStore();

  const [form, setForm] = useState(() => ({
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
  }));

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name ?? "",
        email: currentUser.email ?? "",
        phone: currentUser.phone ?? "",
        role: currentUser.role ?? "",
        department: (currentUser as any).department ?? "",
        bio: currentUser.bio ?? "",
        skills: currentUser.skills ? currentUser.skills.join(", ") : "",
        employeeId: currentUser.employeeId ?? "",
        github: currentUser.github ?? "",
        linkedin: currentUser.linkedin ?? "",
        employmentType: currentUser.employmentType ?? "",
        accountTier: currentUser.accountTier ?? "",
        referralCode: currentUser.referralCode ?? "",
        accountProgressTier: currentUser.accountProgressTier ?? "",
        address: currentUser.address ?? "",
        joinedAt: currentUser.joinedAt ?? "",
      });
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-600">No user selected to edit.</p>
          <div className="mt-4">
            <Button onClick={() => router.push('/dashboard/admin/profile')}>กลับไปที่โปรไฟล์</Button>
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
    const updated: any = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      department: form.department,
      bio: form.bio,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      employeeId: form.employeeId,
      github: form.github || null,
      linkedin: form.linkedin || null,
      employmentType: form.employmentType,
      accountTier: form.accountTier,
      referralCode: form.referralCode,
      accountProgressTier: form.accountProgressTier,
      address: form.address,
      joinedAt: form.joinedAt || undefined,
    };

    // updateUser is defined in the store; call and refresh currentUser
    try {
      (useUserStore.getState().updateUser as any)(currentUser.id, updated);
    } catch (err) {
      // fallback to reading from store instance
      if (typeof updateUser === 'function') updateUser(currentUser.id, updated);
    }

    // Ensure the store's currentUser is refreshed from the updated users list
    try {
      (useUserStore.getState().switchUserById as any)(currentUser.id);
    } catch (err) {
      if (typeof switchUserById === 'function') switchUserById(currentUser.id);
    }

    // show success toast and navigate back to profile
    toast.success("อัปเดตโปรไฟล์สำเร็จ");
    router.push('/dashboard/admin/profile');
  };

  return (
    <div className="p-6">
      <div className="max-w-10xl mx-auto bg-white dark:bg-[#0b1220] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <input type="email" className="w-full border rounded px-3 py-2 mt-1" value={form.email} onChange={(e)=>handleChange('email', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.phone} onChange={(e)=>handleChange('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">Department</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.department} onChange={(e)=>handleChange('department', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">Role</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.role} onChange={(e)=>handleChange('role', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">Employee ID</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.employeeId} onChange={(e)=>handleChange('employeeId', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500">Address</label>
            <input className="w-full border rounded px-3 py-2 mt-1" value={form.address} onChange={(e)=>handleChange('address', e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-gray-500">Bio</label>
            <textarea className="w-full border rounded px-3 py-2 mt-1" rows={4} value={form.bio} onChange={(e)=>handleChange('bio', e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-gray-500">Skills (comma separated)</label>
            <input className="w-full border rounded px-3 py-2 mt-1" value={form.skills} onChange={(e)=>handleChange('skills', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">GitHub</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.github} onChange={(e)=>handleChange('github', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">LinkedIn</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.linkedin} onChange={(e)=>handleChange('linkedin', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Employment Type</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.employmentType} onChange={(e)=>handleChange('employmentType', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">Account Tier</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.accountTier} onChange={(e)=>handleChange('accountTier', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500">Referral Code</label>
              <input className="w-full border rounded px-3 py-2 mt-1" value={form.referralCode} onChange={(e)=>handleChange('referralCode', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">บันทึก</Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard/admin/profile')}>ยกเลิก</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EditProfilePage: React.FC = () => {
  const router = useRouter();
  const { currentUser, updateUser, switchUserById } = useUserStore();
  const { jobs } = useJobStore();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState(() => ({
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
  }));

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        role: currentUser.role || "",
        department: currentUser.department || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        github: currentUser.github || "",
        linkedin: currentUser.linkedin || "",
        bio: currentUser.bio || "",
        skills: (currentUser.skills || []).join(", "),
        accountTier: currentUser.accountTier || "",
        referralCode: currentUser.referralCode || "",
        accountProgressTier: currentUser.accountProgressTier || "",
        employmentType: currentUser.employmentType || "",
        imageUrl: currentUser.imageUrl || "",
      });
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">No user selected.</p>
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
      role: form.role || undefined,
      department: form.department || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      github: form.github || undefined,
      linkedin: form.linkedin || undefined,
      bio: form.bio || undefined,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      accountTier: form.accountTier || undefined,
      referralCode: form.referralCode || undefined,
      accountProgressTier: form.accountProgressTier || undefined,
      employmentType: form.employmentType || undefined,
    };

    if (form.imageUrl) updatedData.imageUrl = form.imageUrl;

    try {
      updateUser(currentUser.id, updatedData);
      switchUserById(currentUser.id);

      // Propagate name/image to jobs for immediate UI consistency
      try {
        const userId = currentUser.id;
        const newName = updatedData.name || currentUser.name;
        const newImage = updatedData.imageUrl !== undefined ? updatedData.imageUrl : currentUser.imageUrl;

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

      toast.success("Profile saved");
      router.push('/dashboard/admin/profile');
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Left column: avatar + actions */}
        <aside className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-28 w-28">
              <Avatar className="h-28 w-28">
                {form.imageUrl ? (
                  <AvatarImage src={form.imageUrl} alt={form.name} />
                ) : (
                  <AvatarFallback>{(form.name || "").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e)=>onFile(e.target.files?.[0] ?? null)} />
            <div className="mt-3 flex flex-col gap-2 w-full">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>Change Photo</Button>
              <Button variant="ghost" onClick={() => { setForm((s)=>({...s, imageUrl: ''})); if (fileRef.current) fileRef.current.value = ''; }}>Remove Photo</Button>
            </div>
          </div>

          <div className="text-center mt-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{form.name || '—'}</div>
            <div className="text-xs text-gray-500">{form.email || '-'}</div>
          </div>
        </aside>

        {/* Right column: form */}
        <section className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Edit Profile</h2>
              <p className="text-xs text-gray-500">Update your personal and account information. Changes are saved to the local store.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => router.push('/dashboard/admin/profile')}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e)=>handleChange('name', e.target.value)} className="mt-1" />

              <Label className="mt-4">Email</Label>
              <Input value={form.email} onChange={(e)=>handleChange('email', e.target.value)} className="mt-1" />

              <Label className="mt-4">Role</Label>
              <Input value={form.role} onChange={(e)=>handleChange('role', e.target.value)} className="mt-1" />

              <Label className="mt-4">Department</Label>
              <Input value={form.department} onChange={(e)=>handleChange('department', e.target.value)} className="mt-1" />

              <Label className="mt-4">Phone</Label>
              <Input value={form.phone} onChange={(e)=>handleChange('phone', e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e)=>handleChange('address', e.target.value)} className="mt-1" />

              <Label className="mt-4">GitHub</Label>
              <Input value={form.github} onChange={(e)=>handleChange('github', e.target.value)} className="mt-1" />

              <Label className="mt-4">LinkedIn</Label>
              <Input value={form.linkedin} onChange={(e)=>handleChange('linkedin', e.target.value)} className="mt-1" />

              <Label className="mt-4">Employment Type</Label>
              <Input value={form.employmentType} onChange={(e)=>handleChange('employmentType', e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="mt-6">
            <Label>Bio</Label>
            <textarea value={form.bio} onChange={(e)=>handleChange('bio', e.target.value)} className="w-full mt-1 p-2 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#191919]" rows={4} />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label>Skills (comma separated)</Label>
              <Input value={form.skills} onChange={(e)=>handleChange('skills', e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label>Account Tier</Label>
              <Input value={form.accountTier} onChange={(e)=>handleChange('accountTier', e.target.value)} className="mt-1" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditProfilePage;

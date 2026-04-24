"use client";

import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // ✅ Changed to NextAuth
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { MOCK_USERS } from "@/lib/mocks/user";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession(); // ✅ Use useSession
  const currentUser = session?.user; // ✅ Map to existing variable name

  const { users, updateUser } = useUserStore(); // ✅ Keep users and updateUser from store
  const { jobs } = useJobStore();

  const userJobs = useMemo(() => {
    if (!currentUser) return [];
    return (
      jobs
        ?.filter((job) => {
          if (!job) return false;
          const createdByUser = job.creator?.id === currentUser.id;
          const leading = job.leadTechnician?.id === currentUser.id;
          const assigned =
            job.assignedEmployees?.some((member) => member.id === currentUser.id) ?? false;
          return createdByUser || leading || assigned;
        })
        .sort((a, b) => {
          const aDate = new Date(a.createdAt ?? "").getTime();
          const bDate = new Date(b.createdAt ?? "").getTime();
          return bDate - aDate;
        }) || []
    );
  }, [jobs, currentUser]);

  const recentJobs = useMemo(() => userJobs.slice(0, 5), [userJobs]);
  const allUsers = useMemo(() => {
    if (users && users.length > 0) return users;
    return MOCK_USERS;
  }, [users]);

  const formatRoleLabel = (role?: string | null) => {
    if (!role) return "สมาชิกทีม";
    switch (role) {
      case "lead_technician":
        return "หัวหน้าแผนก";
      case "manager":
        return "ผู้จัดการแผนก";
      case "admin":
        return "ผู้ดูแลระบบ";
      case "employee":
        return "สมาชิกทีม";
      default:
        return role
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
    }
  };

  const formatStatusLabel = (status?: string | null) => {
    if (!status) return null;
    switch (status) {
      case "active":
        return "ใช้งาน";
      case "on_site":
        return "ปฏิบัติงานนอกสถานที่";
      case "training":
        return "ฝึกอบรม";
      case "on_leave":
        return "ลางาน";
      default:
        return status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
    }
  };

  const getStatusClasses = (status?: string | null) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "on_site":
        return "text-blue-600 dark:text-blue-400";
      case "training":
        return "text-amber-600 dark:text-amber-400";
      case "on_leave":
        return "text-gray-500 dark:text-gray-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const departmentTeam = useMemo(() => {
    if (!currentUser?.department) return [];
    const dept = currentUser.department;
    const order = { lead_technician: 0, manager: 1, admin: 2, employee: 3 };

    return allUsers
      .filter((person) => person.department === dept && person.id !== currentUser.id)
      .map((person) => ({
        id: person.id,
        name: person.name,
        imageUrl: person.imageUrl,
        department: dept,
        role: person.role,
        roleLabel: formatRoleLabel(person.role),
        status: person.status ?? "active",
      }))
      .sort((a, b) => {
        const rankA = order[a.role as keyof typeof order] ?? 4;
        const rankB = order[b.role as keyof typeof order] ?? 4;
        return rankA - rankB || a.name.localeCompare(b.name);
      });
  }, [allUsers, currentUser]);

  const collaborators = useMemo(() => {
    const map = new Map<string, { id: string; name: string; imageUrl?: string | null; department?: string | null; role?: string | null; status?: string | null }>();
    userJobs.forEach((job) => {
      job.assignedEmployees?.forEach((member) => {
        if (member.id !== currentUser?.id && !map.has(member.id)) {
          map.set(member.id, member);
        }
      });
      if (job.leadTechnician && job.leadTechnician.id !== currentUser?.id && !map.has(job.leadTechnician.id)) {
        map.set(job.leadTechnician.id, job.leadTechnician);
      }
    });
    return Array.from(map.values()).slice(0, 6);
  }, [userJobs, currentUser]);

  // Removed places calculation as it was unused

  // image cropper state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<"avatar" | "cover" | null>(null);

  const onCropComplete = (_: unknown, croppedPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (e: Event) => reject(e));
      img.setAttribute('crossOrigin', 'anonymous'); // needed for cross-origin images
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return canvas.toDataURL('image/jpeg');
  };
  const openCropper = (target: "avatar" | "cover", file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setEditingTarget(target);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (target: "avatar" | "cover") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openCropper(target, file);
  };

  const coverImage =
    currentUser?.coverImageUrl ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80";
  const cropAspect = editingTarget === "cover" ? 3.2 : 1;
  const cropShape = editingTarget === "avatar" ? "round" : "rect";
  const dialogTitle =
    editingTarget === "cover" ? "ปรับภาพพื้นหลัง" : "ปรับขนาดและตำแหน่งรูปโปรไฟล์";

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {currentUser ? (
          <>
            {/* Header hero */}
            <section className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] shadow-xl min-h-[180px]">
              <div className="absolute inset-0">
                <div
                  className="h-full bg-cover bg-no-repeat"
                  style={{
                    backgroundImage: `url('${coverImage}')`,
                    backgroundPosition: "top right",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0000]/80 to-[#080808]/70" />
              </div>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-4 right-4 inline-flex mr-5 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-gray-700 shadow hover:bg-white z-1000"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7h4l2-3h6l2 3h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11a3 3 0 100 6 3 3 0 000-6z"
                  />
                </svg>
                Change cover
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange("cover")}
              />
              <div className="relative z-10 w-full min-h-[180px] flex items-center px-6 sm:px-10 py-6 sm:py-8 mt-4 sm:mt-0">
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 w-full sm:w-auto text-center sm:text-left">
                    <label className="relative block group">
                      <input
                        ref={(el) => {
                          fileInputRef.current = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange("avatar")}
                      />

                      <div className="relative">
                        <div className="h-28 w-28 cursor-pointer rounded-full ring-4 ring-white/50 dark:ring-black/50 shadow-2xl overflow-hidden bg-white">
                          <Avatar className="h-full w-full rounded-full">
                            {currentUser?.imageUrl ? (
                              <AvatarImage src={currentUser.imageUrl} alt={currentUser?.name} />
                            ) : (
                              <AvatarFallback>
                                {(currentUser?.name || "")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center rounded-full transition-opacity opacity-0 group-hover:opacity-100">
                          <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm" />
                          <div className="relative z-10 p-2 bg-white/80 dark:bg-black/60 rounded-full cursor-pointer">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-black dark:text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7h4l2-3h6l2 3h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 11a3 3 0 100 6 3 3 0 000-6z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </label>

                    <div className="flex flex-col">
                      <p className="text-sm uppercase tracking-wide text-shadow-lg text-teal-100 dark:text-teal-200">
                        {currentUser?.department || "Team member"}
                      </p>
                      <h1 className="text-3xl font-semibold text-shadow-lg text-white drop-shadow-sm mt-1">
                        {currentUser?.name ?? "—"}
                      </h1>
                      <p className="text-white/80 text-shadow-lg drop-shadow-sm mt-0.5">{currentUser?.role ?? "-"}</p>
                      {currentUser?.employeeId && (
                        <p className="text-sm text-shadow-lg text-white/80 mt-1">ID: {currentUser.employeeId}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row justify-center sm:justify-end shrink-0">
                    <Button
                      variant="secondary"
                      className="bg-white text-gray-900 hover:bg-gray-100"
                      onClick={() => router.push("/dashboard/employee/profile/edit")}
                    >
                      Manage your account
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Cropper dialog */}
            <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
              <DialogContent className="max-w-xl w-full">
                <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div
                    className={`relative w-72 ${editingTarget === "cover" ? "h-44 rounded-2xl" : "h-72 rounded-full"
                      } overflow-hidden bg-gray-100 dark:bg-gray-800`}
                  >
                    {previewSrc && (
                      <Cropper
                        image={previewSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={cropAspect}
                        cropShape={cropShape}
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    )}
                  </div>

                  <div className="w-full px-6">
                    <label className="text-xs text-gray-500">ขยาย/ย่อ</label>
                    <input
                      type="range"
                      min={1}
                      max={editingTarget === "cover" ? 2.5 : 3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={async () => {
                        if (!previewSrc || !croppedAreaPixels || !currentUser) return;
                        const successMessage =
                          editingTarget === "cover"
                            ? "อัปเดตภาพพื้นหลังเรียบร้อย"
                            : "อัปเดตรูปโปรไฟล์เรียบร้อย";
                        try {
                          const croppedDataUrl = await getCroppedImg(previewSrc, croppedAreaPixels);
                          if (editingTarget === "cover") {
                            updateUser(currentUser.id, { coverImageUrl: croppedDataUrl });
                          } else {
                            updateUser(currentUser.id, { imageUrl: croppedDataUrl });
                          }
                          toast.success(successMessage);
                        } catch (err) {
                          console.error(err);
                          toast.error("ไม่สามารถบันทึกรูปได้");
                        }
                        setIsCropOpen(false);
                        setPreviewSrc(null);
                        setEditingTarget(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        if (coverInputRef.current) coverInputRef.current.value = "";
                      }}
                    >
                      บันทึก
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsCropOpen(false);
                        setPreviewSrc(null);
                        setZoom(1);
                        setCrop({ x: 0, y: 0 });
                        setEditingTarget(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        if (coverInputRef.current) coverInputRef.current.value = "";
                      }}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose />
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
              <aside className="space-y-6">
                <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4 underline-offset-4 underline">About</h3>
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-gray-500 ">Role</dt>
                      <dd className="text-gray-900 dark:text-white">{currentUser?.role ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Department</dt>
                      <dd className="text-gray-900 dark:text-white">{currentUser?.department ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Organization</dt>
                      <dd className="text-gray-900 dark:text-white">TechJob Platform</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Location</dt>
                      <dd className="text-gray-900 dark:text-white">{currentUser?.address ?? "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4 underline-offset-4 underline">Contact</h3>
                  <dl className="text-sm space-y-3">
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="text-gray-900 dark:text-white break-words">{currentUser?.email ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="text-gray-900 dark:text-white">{currentUser?.phone ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">LinkedIn</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {currentUser?.linkedin ? (
                          <a href={currentUser.linkedin} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400">
                            View profile
                          </a>
                        ) : (
                          "-"
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4 underline-offset-4 underline">Teams</h3>
                  <Button variant="outline" className="w-full opacity-50 cursor-not-allowed" disabled>
                    Create a team
                  </Button>
                  <p className="text-xs text-gray-500 mt-3">Contact your administrator to create a new team or workspace.</p>
                </div>
              </aside>

              <main className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Worked on - Left side */}
                  <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Works Progress</h2>
                      <button className="text-sm text-teal-600 dark:text-teal-400 hover:underline" onClick={() => router.push("/dashboard/employee/jobs")}>
                        View all
                      </button>
                    </div>
                    {recentJobs.length > 0 ? (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200/50 dark:[&::-webkit-scrollbar-track]:bg-gray-800/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                        {recentJobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-white/5 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</p>
                              <p className="text-xs text-gray-500">
                                {job.departments?.join(", ") || "General"} • {job.creator?.name || "Unknown"}
                              </p>
                            </div>
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 capitalize shrink-0">
                              {job.status?.replace("_", " ") || "pending"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No recent projects yet.</div>
                    )}
                  </div>

                  {/* Works with - Right side */}
                  <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Works with</h2>
                      {(departmentTeam.length ? departmentTeam : collaborators).length > 3 && (
                        <span className="text-xs text-gray-500">
                          {(departmentTeam.length ? departmentTeam : collaborators).length} teammates
                        </span>
                      )}
                    </div>
                    {(departmentTeam.length ? departmentTeam : collaborators).length ? (
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200/50 dark:[&::-webkit-scrollbar-track]:bg-gray-800/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                        {(departmentTeam.length ? departmentTeam : collaborators).map((person) => (
                          <div key={person.id} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              {person.imageUrl ? (
                                <AvatarImage src={person.imageUrl} alt={person.name} />
                              ) : (
                                <AvatarFallback>{person.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{person.name}</p>
                              <p className="text-xs text-gray-500">
                                {person.department || currentUser?.department || "General team"} •{" "}
                                {formatRoleLabel(person.role ?? undefined)}
                              </p>
                              {(() => {
                                const detail = person.status
                                  ? person.status
                                  : allUsers.find((u) => u.id === person.id)?.status;
                                const statusLabel = formatStatusLabel(detail ?? null);
                                return statusLabel ? (
                                  <p className={`text-xs ${getStatusClasses(detail ?? null)}`}>{statusLabel}</p>
                                ) : null;
                              })()}
                            </div>
                          </div>

                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No collaborators just yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">เกี่ยวกับฉัน</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{currentUser?.bio ?? "ยังไม่มีข้อมูล"}</p>
                  {currentUser?.skills?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {currentUser.skills.map((skill) => (
                        <span key={skill} className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </main>
            </div>
          </>
        ) : (
          <div className="max-w-3xl mx-auto bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No user selected. Choose a user from the selector to view their profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProfilePage;


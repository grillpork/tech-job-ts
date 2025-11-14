"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import  Cropper  from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { currentUser, users, switchUserById, logout, resetUsers, updateUser } = useUserStore();
  const { jobs } = useJobStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ensure mock users are loaded into the store if empty (helps in dev)
    if (!users || users.length === 0) {
      resetUsers();
    }

    // If URL contains ?id=..., switch to that user automatically
    const id = searchParams?.get?.("id");
    if (id) {
      // avoid unnecessary switch if already the same
      if (!users || users.length === 0 || (currentUser && currentUser.id !== id)) {
        // Try switching — switchUserById will warn if not found
        switchUserById(id);
      }
    }

    // If no currentUser after loading mocks, default to admin user (TCH-0001) if present
    if ((!currentUser || !currentUser.id) && users && users.length > 0) {
      const preferred = users.find((u) => u.employeeId === "TCH-0001") || users.find((u) => u.id === "user-admin-1") || users[0];
      if (preferred) switchUserById(preferred.id);
    }
  }, [users, resetUsers, searchParams, switchUserById, currentUser]);

  const handleSwitch = (id: string) => {
    if (!id) return;
    switchUserById(id);
  };
  // image cropper state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const onCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (e) => reject(e));
      img.setAttribute('crossOrigin', 'anonymous'); // needed for cross-origin images
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
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
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        {/* top selector + actions */}
        <div className="flex items-center justify-between mb-4 gap-4">
          
        </div>

        {currentUser ? (
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
            {/* Left sidebar */}
            <aside className="bg-white/5 dark:bg-[#2a2a2a]  border border-gray-200 dark:border-gray-800 rounded-lg p-4 min-w-0">
              <div className="flex flex-col items-center gap-4">
                {/* Avatar with file input: click to change profile image. Hover shows camera overlay and blurred backdrop */}
                <label className="relative block">
                  <input
                    ref={(el) => { fileInputRef.current = el; }}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        setPreviewSrc(dataUrl);
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                        setIsCropOpen(true);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />

                  <div className="relative">
                    <div className="h-28 w-28 cursor-pointer">
                      <Avatar className="h-28 w-28">
                        {currentUser?.imageUrl ? (
                          <AvatarImage src={currentUser.imageUrl} alt={currentUser?.name} />
                        ) : (
                          <AvatarFallback>{(currentUser?.name || "").split(" ").map((n)=>n[0]).join("").slice(0,2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>

                    {/* overlay: blurred backdrop + camera icon shown on hover */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-full transition-opacity opacity-0 hover:opacity-100">
                      <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm" />
                      <div className="relative z-10 p-2 bg-white/80 dark:bg-black/60 rounded-full">
                        {/* simple camera svg */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2-3h6l2 3h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100 6 3 3 0 000-6z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Cropper dialog — FB/IG style circular crop */}
                <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
                  <DialogContent className="max-w-xl w-full">
                    <DialogHeader>
                      <DialogTitle>ปรับขนาดและตำแหน่งรูปโปรไฟล์</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="relative w-72 h-72 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {previewSrc && (
                          <Cropper
                            image={previewSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                          />
                        )}
                        {/* circular mask (optional) - already cropShape="round" provides circle crop UI */}
                      </div>

                      <div className="w-full px-6">
                        <label className="text-xs text-gray-500">ขยาย/ย่อ</label>
                        <input
                          type="range"
                          min={1}
                          max={3}
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
                            try {
                              const croppedDataUrl = await getCroppedImg(previewSrc, croppedAreaPixels);
                              updateUser(currentUser.id, { imageUrl: croppedDataUrl });
                              switchUserById(currentUser.id);
                              toast.success('อัปเดตรูปโปรไฟล์เรียบร้อย');
                            } catch (err) {
                              try {
                                const croppedDataUrl = await getCroppedImg(previewSrc, croppedAreaPixels);
                                (useUserStore as any).getState()?.updateUser?.(currentUser.id, { imageUrl: croppedDataUrl });
                                (useUserStore as any).getState()?.switchUserById?.(currentUser.id);
                                toast.success('อัปเดตรูปโปรไฟล์เรียบร้อย');
                              } catch (_e) {
                                toast && toast.error && toast.error('ไม่สามารถบันทึกรูปได้');
                              }
                            }
                            setIsCropOpen(false);
                            setPreviewSrc(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
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
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >ยกเลิก</Button>
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose />
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="text-center min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white">{currentUser?.name ?? '—'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.role ?? '-'}</div>
                  {currentUser?.employeeId && (
                    <div className="text-xs text-gray-500 mt-1">ID: {currentUser.employeeId}</div>
                  )}
                </div>
              </div>

              <nav className="mt-6">
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
                  <li className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-orange-500 font-medium">Personal Details</li>
                  <li className="px-2 py-1 rounded hover:bg_gray-100 dark:hover:bg-gray-800 cursor-pointer">Account Details</li>
                  <li className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">Security</li>
                  <li className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">Notifications</li>
                  <li className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">Settings</li>
                </ul>
              </nav>
            </aside>

            {/* Right content: two cards */}
            <main className="space-y-6 min-w-0">
              <div className="relative rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#2a2a2a] shadow-2xl  p-6">
                <div className="absolute top-4 right-4">
                  <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/profile/edit')}>Edit</Button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Profile</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{currentUser?.name ?? '-'}</p>

                    <p className="text-gray-500 dark:text-gray-400 mt-4">Employee ID</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.employeeId ?? '-'}</p>

                    <p className="text-gray-500 dark:text-gray-400 mt-4">GitHub</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.github ? <a href={currentUser.github} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400">View</a> : '-'}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.email ?? '-'}</p>

                    <p className="text-gray-500 dark:text-gray-400 mt-4">Department</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.department ?? '-'}</p>

                    <p className="text-gray-500 dark:text-gray-400 mt-4">Phone</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.phone ?? '-'}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">Role</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.role ?? '-'}</p>

                    <p className="text-gray-500 dark:text-gray-400 mt-4">Joined</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.joinedAt ? new Date(currentUser.joinedAt).toLocaleDateString() : '-'}</p>

                    <p className="text-gray-500 dark:text-gray-400 mt-4">Location</p>
                    <p className="text-gray-900 dark:text-white break-words">{currentUser?.address ?? '-'}</p>
                  </div>
                </div>

                {/* Bio + Skills */}
                <div className="mt-6">
                  <p className="text-gray-500 dark:text-gray-400">Bio</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-line break-words">{currentUser?.bio ?? '-'}</p>

                  {currentUser?.skills && currentUser.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentUser.skills.map((s) => (
                        <span key={s} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#2a2a2a]  shadow-2xl p-6 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">Account Tier</p>
                    <p className="text-gray-900 dark:text-white font-medium">{currentUser?.accountTier ?? '-'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">Referral Code</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.referralCode ?? '-'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">Account Progress</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.accountProgressTier ?? '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm mt-6">
                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">Employment Type</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.employmentType ?? '-'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-500 dark:text-gray-400">LinkedIn</p>
                    <p className="text-gray-900 dark:text-white">{currentUser?.linkedin ? <a href={currentUser.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400">Profile</a> : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Logout button moved below the profile cards */}
              <div className="mt-4">
                <Button variant="destructive" size="sm" onClick={() => { logout(); }}>
                  ออกจากระบบ
                </Button>
              </div>
            </main>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No user selected. Choose a user from the selector to view their profile.</p>
            <div />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;


// Small stat helper component
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MOCK_USERS } from "@/lib/mocks/user";
import { Edit, ArrowLeft, Briefcase, CheckCircle2, Timer, CalendarClock, Facebook, Github, MessageCircle } from "lucide-react";

export default function UserProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const { users, currentUser } = useUserStore();
  const { jobs } = useJobStore();

  const user = users.find((u) => u.id === userId);

  // --- Derived Data ---

  const userJobs = useMemo(() => {
    if (!user) return [];
    return (
      jobs
        ?.filter((job) => {
          if (!job) return false;
          const createdByUser = job.creator?.id === user.id;
          const leading = job.leadTechnician?.id === user.id;
          const assigned =
            job.assignedEmployees?.some((member: any) => member.id === user.id) ?? false;
          return createdByUser || leading || assigned;
        })
        .sort((a, b) => {
          const aDate = new Date(a.createdAt ?? "").getTime();
          const bDate = new Date(b.createdAt ?? "").getTime();
          return bDate - aDate;
        }) || []
    );
  }, [jobs, user]);

  const recentJobs = useMemo(() => userJobs.slice(0, 5), [userJobs]);

  const allUsers = useMemo(() => {
    if (users && users.length > 0) return users;
    return MOCK_USERS;
  }, [users]);

  // --- Formatters ---

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
    if (!user?.department) return [];
    const dept = user.department;
    const order = { lead_technician: 0, manager: 1, admin: 2, employee: 3 };

    return allUsers
      .filter((person) => person.department === dept && person.id !== user.id)
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
  }, [allUsers, user]);

  const collaborators = useMemo(() => {
    const map = new Map<string, { id: string; name: string; imageUrl?: string | null; department?: string | null; role?: string | null }>();
    userJobs.forEach((job) => {
      job.assignedEmployees?.forEach((member: any) => {
        if (member.id !== user?.id && !map.has(member.id)) {
          map.set(member.id, member);
        }
      });
      if (job.leadTechnician && job.leadTechnician.id !== user?.id && !map.has(job.leadTechnician.id)) {
        map.set(job.leadTechnician.id, job.leadTechnician);
      }
    });
    return Array.from(map.values()).slice(0, 6);
  }, [userJobs, user]);

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg text-gray-600 mb-4">ไม่พบข้อมูลผู้ใช้</p>
        <Button onClick={() => router.push('/dashboard/admin/users')}>กลับไปหน้ารายชื่อผู้ใช้</Button>
      </div>
    );
  }

  const employmentDuration = useMemo(() => {
    if (!user?.joinedAt) return "-";
    const start = new Date(user.joinedAt);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ปี`);
    if (months > 0) parts.push(`${months} เดือน`);
    if (days > 0) parts.push(`${days} วัน`);

    if (parts.length === 0) return "วันนี้";
    return parts.join(" ");
  }, [user?.joinedAt]);

  const coverImage =
    user.coverImageUrl ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80";

  // Check if the current logged-in user is an admin
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> กลับไปหน้ารายชื่อผู้ใช้
          </Button>
        </div>

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



          <div className="relative z-10 px-6 sm:px-10 pt-6 pb-4">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                <div className="flex items-end gap-4">
                  <div className="relative block">
                    <div className="relative -mt-8">
                      <div className="h-28 w-28 rounded-full ring-4 ring-white dark:ring-[#141414] shadow-2xl overflow-hidden bg-white">
                        <Avatar className="h-full w-full rounded-full">
                          {user.imageUrl ? (
                            <AvatarImage src={user.imageUrl} alt={user.name} />
                          ) : (
                            <AvatarFallback>
                              {(user.name || "")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                    </div>
                  </div>

                  <div className="pb-2">
                    <p className="text-sm uppercase tracking-wide text-shadow-lg text-teal-100 dark:text-teal-200">
                      {user.department || "สมาชิกทีม"}
                    </p>
                    <h1 className="text-3xl font-semibold text-shadow-lg text-white drop-shadow-sm mt-2">
                      {user.name}
                    </h1>
                    <p className="text-white/80 text-shadow-lg drop-shadow-sm mt-0.5">{formatRoleLabel(user.role) || "-"}</p>
                    {user.employeeId && (
                      <p className="text-sm text-shadow-lg text-white/80 mt-1">ID: {user.employeeId}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-6">
            <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4 underline-offset-4 underline">เกี่ยวกับ</h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500 ">บทบาท</dt>
                  <dd className="text-gray-900 dark:text-white mt-0.5">{formatRoleLabel(user.role) ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">แผนก</dt>
                  <dd className="text-gray-900 dark:text-white mt-0.5">{user.department ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">องค์กร</dt>
                  <dd className="text-gray-900 dark:text-white mt-0.5">TechJob Platform</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ที่อยู่</dt>
                  <dd className="text-gray-900 dark:text-white mt-0.5">{user.address ?? "-"}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-lg h-[calc(vh-320px)]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4 underline-offset-4 underline">ข้อมูลติดต่อ</h3>
              <dl className="text-sm space-y-4">
                <div>
                  <dt className="text-gray-500 mb-1">อีเมล</dt>
                  <dd className="text-gray-900 dark:text-white break-all">{user.email ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-1">เบอร์โทรศัพท์</dt>
                  <dd className="text-gray-900 dark:text-white">{user.phone ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-1 flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                  </dt>
                  <dd className="text-gray-900 dark:text-white">
                    {user.facebook ? (
                      <a href={user.facebook} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline truncate block">
                        {user.facebook}
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-1 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-500" /> Line ID
                  </dt>
                  <dd className="text-gray-900 dark:text-white">
                    {user.lineId ? (
                      <span className="truncate block">{user.lineId}</span>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-1 flex items-center gap-2">
                    <Github className="h-4 w-4" /> GitHub
                  </dt>
                  <dd className="text-gray-900 dark:text-white">
                    {user.github ? (
                      <a href={user.github} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline truncate block">
                        View Profile
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-1">LinkedIn</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {user.linkedin ? (
                      <a href={user.linkedin} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline truncate block">
                        View profile
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Worked on - Left side */}
              <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">งานที่กำลังดำเนินการ</h2>
                </div>
                {recentJobs.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200/50 dark:[&::-webkit-scrollbar-track]:bg-gray-800/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-white/5 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</p>
                          <p className="text-xs text-gray-500">
                            {job.departments?.join(", ") || "ทั่วไป"} • {job.creator?.name || "ไม่ระบุ"}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 capitalize shrink-0">
                          {job.status === "pending" ? "รอดำเนินการ" : job.status?.replace("_", " ") || "รอดำเนินการ"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">ยังไม่มีโครงการล่าสุด</div>
                )}
              </div>

              {/* Works with - Right side */}
              <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ทำงานร่วมกับ</h2>
                  {(departmentTeam.length ? departmentTeam : collaborators).length > 3 && (
                    <span className="text-xs text-gray-500">
                      {(departmentTeam.length ? departmentTeam : collaborators).length} เพื่อนร่วมทีม
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
                            {(person as any).department || user?.department || "ทีมทั่วไป"} •{" "}
                            {formatRoleLabel((person as any).role ?? undefined)}
                          </p>
                          {(() => {
                            const detail = (person as any).status
                              ? (person as any).status
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
                  <p className="text-sm text-gray-500">ยังไม่มีผู้ร่วมงาน</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">เกี่ยวกับฉัน</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{user.bio ?? "ยังไม่มีข้อมูล"}</p>
              {user.skills?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shadow-sm">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">งานทั้งหมด</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userJobs.length}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">เสร็จสิ้น</p>
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      {userJobs.filter((j) => j.status === "completed").length}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">กำลังดำเนินการ</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {userJobs.filter((j) => j.status === "in_progress").length}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">อายุงาน</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {employmentDuration}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
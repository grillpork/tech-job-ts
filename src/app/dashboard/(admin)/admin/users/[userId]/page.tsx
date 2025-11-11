// "use client";

// import { useState, useMemo } from "react";
// import { redirect, useParams } from "next/navigation";
// import { useUserStore } from "@/stores/features/userStore";
// import { useJobStore } from "@/stores/features/jobStore";
// import {
//   Avatar,
//   AvatarFallback,
//   AvatarImage,
// } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   CheckCheck,
//   CircleDotDashed,
//   LogIn,
//   Users,
//   ArrowRight,
// } from "lucide-react";
// import Link from "next/link";

// // --- We'll derive data from stores (jobs & users) and add a small attendance mock ---

// export default function UserAnalyticsPage() {
//   const [selectedDate, setSelectedDate] = useState(13);

//   const params = useParams();
//   const userId = params?.userId as string | undefined;

//   const users = useUserStore((s) => s.users);
//   const jobs = useJobStore((s) => s.jobs);

//   const user = users.find((u) => u.id === userId);

//   // Jobs related to this user
//   const userJobs = useMemo(() => {
//     if (!userId) return [] as typeof jobs;
//     return jobs.filter((job) => {
//       const isAssigned = job.assignedEmployees?.some((a) => a.id === userId);
//       const isCreator = job.creator?.id === userId;
//       const isLead = job.leadTechnician?.id === userId;
//       return !!(isAssigned || isCreator || isLead);
//     });
//   }, [jobs, userId]);

//   // Simple attendance mock: collect unique startDates from jobs + a few recent dates
//   const attendanceDates = useMemo(() => {
//     const dates = new Set<string>();
//     userJobs.forEach((j) => {
//       if (j.startDate) dates.add(j.startDate);
//       else dates.add(j.createdAt.slice(0, 10));
//     });
//     // add a couple of recent mock check-ins
//     const now = new Date();
//     for (let i = 1; i <= 5; i++) {
//       const d = new Date(now);
//       d.setDate(now.getDate() - i * 2);
//       dates.add(d.toISOString().slice(0, 10));
//     }
//     return Array.from(dates).sort().reverse();
//   }, [userJobs]);

//   const activeDaysCount = attendanceDates.length;

//   // Analytics
//   const completedCount = userJobs.filter((j) => j.status === "completed").length;
//   const inProgressCount = userJobs.filter(
//     (j) => j.status === "in_progress",
//   ).length;

//   const analyticsStats = [
//     {
//       title: "งานที่ทำเสร็จแล้ว",
//       value: String(completedCount),
//       description: "งานทั้งหมดที่เสร็จสมบูรณ์",
//       icon: <CheckCheck className="h-5 w-5 text-green-500" />,
//     },
//     {
//       title: "จำนวนงานที่ทำอยู่",
//       value: String(inProgressCount),
//       description: "Tasks in progress",
//       icon: <CircleDotDashed className="h-5 w-5 text-blue-500" />,
//     },
//     {
//       title: "จำนวนการเข้างาน (30 วัน)",
//       value: String(activeDaysCount),
//       description: "Active days in last 30 days",
//       icon: <LogIn className="h-5 w-5 text-gray-500" />,
//     },
//   ];

//   // Job history derived from userJobs
//   const jobHistory = userJobs.map((j) => ({
//     id: j.id,
//     taskName: j.title,
//     project: j.department || "-",
//     status:
//       j.status === "completed"
//         ? "Completed"
//         : j.status === "in_progress"
//         ? "In Progress"
//         : String(j.status),
//     date: (j.startDate || j.createdAt).slice(0, 10),
//   }));

//   // Agenda dates (next 7 days)
//   const today = new Date();
//   const agendaDates = Array.from({ length: 7 }).map((_, i) => {
//     const d = new Date(today);
//     d.setDate(today.getDate() + i);
//     return {
//       weekday: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
//       day: d.getDate(),
//     };
//   });

//   const userAgenda = useMemo(() => {
//     return userJobs.map((j, idx) => {
//       // derive day from startDate or createdAt
//       const dateStr = j.startDate || j.createdAt || undefined;
//       const day = dateStr ? new Date(dateStr).getDate() : new Date().getDate();

//       const team = (j.assignedEmployees ?? []).map((emp: any) => {
//         const u = users.find((x) => x.id === emp.id);
//         return {
//           id: emp.id,
//           img: u?.imageUrl ?? "",
//           fallback: (u?.name ?? emp.id ?? "U").toString().charAt(0),
//         };
//       });

//       return {
//         id: `${j.id ?? idx}`,
//         day,
//         title: j.title,
//         time: dateStr
//           ? new Date(dateStr).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             })
//           : "09:00-11:00",
//         icon: <Users className="h-5 w-5 text-muted-foreground" />,
//         team,
//       };
//     });
//   }, [userJobs, users]);

//   const filteredAgenda = userAgenda.filter((item) => item.day === selectedDate);

//   return (
//     <div className="flex min-h-screen w-full flex-col">
//       <div className="flex flex-1 flex-col gap-8 p-4 md:flex-row md:items-start md:p-8 lg:p-10">
//         {/* === Main Content Area === */}
//         <main className="flex-1">
//           <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
//             User Analytics
//           </h1>

//           {/* 1. Stat Cards */}
//           <div className="grid gap-4 md:grid-cols-3 mb-6">
//             {analyticsStats.map((stat) => (
//               <Card key={stat.title}>
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">
//                     {stat.title}
//                   </CardTitle>
//                   {stat.icon}
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{stat.value}</div>
//                   <p className="text-xs text-muted-foreground">
//                     {stat.description}
//                   </p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* 2. Job History */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Job History</CardTitle>
//               <CardDescription>
//                 ประวัติงานที่ได้รับมอบหมายล่าสุด
//               </CardDescription>
//             </CardHeader>

//             {/* === ⭐️ จุดที่แก้ไข (จากรอบที่แล้ว) ⭐️ === */}
//             <CardContent className="p-6 pt-0 pb-0">
//               <div className="max-h-[452.5px] space-y-4 overflow-y-auto pr-4">
//                 {jobHistory.map((job) => (
//                   <Card key={job.id}>
//                     <CardContent className="p-4">
//                       <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
//                         {/* Left side: Task Name & Project */}
//                         <div>
//                           <p className="font-semibold">{job.taskName}</p>
//                           <p className="text-sm text-muted-foreground">
//                             {job.project}
//                           </p>
//                         </div>
//                         {/* Right side: Status & Date */}
//                         <div className="flex flex-row-reverse sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-start gap-2">
//                           <Badge
//                             variant={
//                               job.status === "Completed"
//                                 ? "default"
//                                 : job.status === "In Progress"
//                                 ? "outline"
//                                 : "destructive"
//                             }
//                             className={`${
//                               job.status === "Completed"
//                                 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
//                                 : ""
//                             } shrink-0`}
//                           >
//                             {job.status}
//                           </Badge>
//                           <p className="text-xs text-muted-foreground shrink-0">
//                             {job.date}
//                           </p>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </main>

//         {/* === Right Sidebar Area === */}
//         {/* === ⭐️ จุดที่แก้ไข ⭐️ === */}
//         {/* 1. เพิ่ม flex flex-col gap-6 (หรือ gap-8) เพื่อจัดช่องไฟระหว่าง Card */}
//         <aside className="w-full md:w-1/3 lg:w-1/4 xl:max-w-sm md:sticky md:top-8 flex flex-col gap-6">
          
//           {/* 2. หุ้ม Profile ด้วย <Card> */}
//           <Card>
//             <CardContent className="pt-6 flex flex-col items-center space-y-2">
//               <Avatar className="h-20 w-20 mb-2">
//                 <AvatarImage
//                   src={user?.imageUrl ?? undefined}
//                   alt={user?.name ?? "User"}
//                 />
//                 <AvatarFallback>
//                   {(user?.name ?? "User")
//                     .split(" ")
//                     .map((n) => n[0])
//                     .join("")}
//                 </AvatarFallback>
//               </Avatar>
//               <h3 className="text-xl font-semibold">
//                 {user?.name ?? "Unknown"}
//               </h3>
//               <p className="text-sm text-muted-foreground">
//                 {user?.role ?? "-"}
//               </p>
//               <Badge
//                 variant="outline"
//                 className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-100"
//               >
//                 {user ? "Available" : "Unknown"}
//               </Badge>
//             </CardContent>
//           </Card>

//           {/* 3. หุ้ม Agenda ด้วย <Card> */}
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <CardTitle className="text-lg">My Agenda</CardTitle>
//               <Button variant="link" size="sm" className="p-0 h-auto">
//                 View all
//               </Button>
//             </CardHeader>
//             <CardContent>
//               {/* --- 1. แถบเลือกวันที่ --- */}
//               <div className="grid grid-cols-7 gap-1 text-center mb-4">
//                 {agendaDates.map((date) => (
//                   <button
//                     key={date.day}
//                     onClick={() => setSelectedDate(date.day)}
//                     className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
//                       selectedDate === date.day
//                         ? "bg-primary text-primary-foreground"
//                         : "hover:bg-muted"
//                     }`}
//                   >
//                     <span
//                       className={`text-xs ${
//                         selectedDate === date.day
//                           ? "text-primary-foreground/70"
//                           : "text-muted-foreground"
//                       }`}
//                     >
//                       {date.weekday}
//                     </span>
//                     <span className="font-bold">{date.day}</span>
//                   </button>
//                 ))}
//               </div>

//               {/* --- 2. รายการงาน --- */}
//               <div className="flex flex-col space-y-3">
//                 {filteredAgenda.length > 0 ? (
//                   filteredAgenda.map((item) => (
//                     <div
//                       key={item.id}
//                       className="flex items-center justify-between rounded-lg border bg-background p-3.5 cursor-pointer"
//                       onClick={() =>
//                         redirect(`/dashboard/admin/jobs/${item.id}`)
//                       }
//                     >
//                       {/* ส่วนซ้าย: ไอคอน + ชื่องาน + เวลา */}
//                       <div className="flex items-center gap-3">
//                         {/* {item.icon} */}
//                         <div>
//                           <p className="text-sm font-semibold">
//                             {item.id}
//                             {item.title}
//                           </p>
//                           <p className="text-xs text-muted-foreground">
//                             {item.time}
//                           </p>
//                         </div>
//                       </div>

//                       {/* ส่วนขวา: โปรไฟล์กลุ่ม */}
//                       <div className="flex -space-x-2 overflow-hidden">
//                         {item.team.slice(0, 2).map((member) => ( // แสดงสูงสุด 2 คน
//                           <Avatar
//                             key={member.id}
//                             className="h-6 w-6 border-2 border-background"
//                           >
//                             <AvatarImage src={member.img} />
//                             <AvatarFallback>{member.fallback}</AvatarFallback>
//                           </Avatar>
//                         ))}
//                         {item.team.length > 2 && ( // ถ้ามีมากกว่า 2 คน
//                           <Avatar className="h-6 w-6 border-2 border-background">
//                             <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
//                               +{item.team.length - 2}
//                             </AvatarFallback>
//                           </Avatar>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-sm text-muted-foreground text-center py-4">
//                     ไม่มี Agenda ในวันที่เลือก
//                   </p>
//                 )}
//               </div>

//               {/* --- 3. ปุ่มด้านล่าง --- */}
//               <Button variant="outline" className="w-full mt-6">
//                 All upcoming events <ArrowRight className="ml-2 h-4 w-4" />
//               </Button>
//             </CardContent>
//           </Card>
//         </aside>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { redirect, useParams } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCheck,
  CircleDotDashed,
  LogIn,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// --- We'll derive data from stores (jobs & users) and add a small attendance mock ---

export default function UserAnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState(13);

  const params = useParams()
  const userId = params?.userId as string | undefined

  const users = useUserStore((s) => s.users)
  const jobs = useJobStore((s) => s.jobs)

  const user = users.find((u) => u.id === userId)

  // Jobs related to this user
  const userJobs = useMemo(() => {
    if (!userId) return [] as typeof jobs
    return jobs.filter((job) => {
      const isAssigned = job.assignedEmployees?.some((a) => a.id === userId)
      const isCreator = job.creator?.id === userId
      const isLead = job.leadTechnician?.id === userId
      return !!(isAssigned || isCreator || isLead)
    })
  }, [jobs, userId])

  // Simple attendance mock: collect unique startDates from jobs + a few recent dates
  const attendanceDates = useMemo(() => {
    const dates = new Set<string>()
    userJobs.forEach((j) => {
      if (j.startDate) dates.add(j.startDate)
      else dates.add(j.createdAt.slice(0, 10))
    })
    // add a couple of recent mock check-ins
    const now = new Date()
    for (let i = 1; i <= 5; i++) {
      const d = new Date(now)
      d.setDate(now.getDate() - i * 2)
      dates.add(d.toISOString().slice(0, 10))
    }
    return Array.from(dates).sort().reverse()
  }, [userJobs])

  const activeDaysCount = attendanceDates.length

  // Analytics
  const completedCount = userJobs.filter((j) => j.status === "completed").length
  const inProgressCount = userJobs.filter((j) => j.status === "in_progress").length

  const analyticsStats = [
    {
      title: "งานที่ทำเสร็จแล้ว",
      value: String(completedCount),
      description: "งานทั้งหมดที่เสร็จสมบูรณ์",
      icon: <CheckCheck className="h-5 w-5 text-green-500" />,
    },
    {
      title: "จำนวนงานที่ทำอยู่",
      value: String(inProgressCount),
      description: "Tasks in progress",
      icon: <CircleDotDashed className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "จำนวนการเข้างาน (30 วัน)",
      value: String(activeDaysCount),
      description: "Active days in last 30 days",
      icon: <LogIn className="h-5 w-5 text-gray-500" />,
    },
  ]

  // Job history derived from userJobs
  const jobHistory = userJobs.map((j) => ({
    id: j.id,
    taskName: j.title,
    project: j.department || "-",
    status: j.status === "completed" ? "Completed" : j.status === "in_progress" ? "In Progress" : String(j.status),
    date: (j.startDate || j.createdAt).slice(0, 10),
  }))

  // Agenda dates (next 7 days)
  const today = new Date()
  const agendaDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return { weekday: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0,2), day: d.getDate() }
  })

  const userAgenda = useMemo(() => {
    return userJobs.map((j, idx) => {
      // derive day from startDate or createdAt
      const dateStr = j.startDate || j.createdAt || undefined
      const day = dateStr ? new Date(dateStr).getDate() : new Date().getDate()

      const team = (j.assignedEmployees ?? []).map((emp: any) => {
        const u = users.find((x) => x.id === emp.id)
        return {
          id: emp.id,
          img: u?.imageUrl ?? "",
          fallback: (u?.name ?? emp.id ?? "U").toString().charAt(0),
        }
      })

      return {
        id: `${j.id ?? idx}`,
        day,
        title: j.title,
        time: dateStr
          ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "09:00-11:00",
        icon: <Users className="h-5 w-5 text-muted-foreground" />,
        team,
      }
    })
  }, [userJobs, users])

  const filteredAgenda = userAgenda.filter((item) => item.day === selectedDate)

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-1 flex-col gap-8 p-4 md:flex-row md:items-start md:p-8 lg:p-10">
        {/* === Main Content Area === */}
        <main className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-6">
            User Analytics
          </h1>

          {/* 1. Stat Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {analyticsStats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 2. Job History */}
          <Card>
            <CardHeader>
              <CardTitle>Job History</CardTitle>
              <CardDescription>
                ประวัติงานที่ได้รับมอบหมายล่าสุด
              </CardDescription>
            </CardHeader>

            {/* === ⭐️ จุดที่แก้ไข ⭐️ === */}
            {/* เพิ่ม className="p-6 pt-0 pb-0" เพื่อลบ padding-bottom */}
            <CardContent className="p-6 pt-0 pb-0">
              
              <div className="max-h-[452.5px] space-y-4 overflow-y-auto pr-4">
                {jobHistory.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                        {/* Left side: Task Name & Project */}
                        <div>
                          <p className="font-semibold">{job.taskName}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.project}
                          </p>
                        </div>
                        {/* Right side: Status & Date */}
                        <div className="flex flex-row-reverse sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-start gap-2">
                          <Badge
                            variant={
                              job.status === "Completed"
                                ? "default"
                                : job.status === "In Progress"
                                ? "outline"
                                : "destructive"
                            }
                            className={`${
                              job.status === "Completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : ""
                            } shrink-0`}
                          >
                            {job.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground shrink-0">
                            {job.date}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* === Right Sidebar Area === */}
        <aside className="w-full md:w-1/3 lg:w-1/4 xl:max-w-sm md:sticky md:top-8">
          
          {/* === ⭐️ จุดที่แก้ไข ⭐️ === */}
          {/* 3. & 4. รวม User Profile และ Agenda ไว้ใน Card เดียวกัน */}
          <Card>
            {/* 3. User Profile Card (Part) */}
            <CardContent className="pt-6 flex flex-col items-center space-y-2">
              <Avatar className="h-20 w-20 mb-2">
                <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.name ?? "User"} />
                <AvatarFallback>
                  {(user?.name ?? "User")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{user?.name ?? "Unknown"}</h3>
              <p className="text-sm text-muted-foreground">{user?.role ?? "-"}</p>
              <Badge
                variant="outline"
                className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-100"
              >
                {user ? "Available" : "Unknown"}
              </Badge>
            </CardContent>

            {/* 4. Agenda / ปฏิทินงาน (Part) */}
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Agenda</CardTitle>
              <Button variant="link" size="sm" className="p-0 h-auto">
                View all
              </Button>
            </CardHeader>
            <CardContent>
              {/* --- 1. แถบเลือกวันที่ --- */}
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                {agendaDates.map((date) => (
                  <button
                    key={date.day}
                    onClick={() => setSelectedDate(date.day)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                      selectedDate === date.day
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        selectedDate === date.day
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {date.weekday}
                    </span>
                    <span className="font-bold">{date.day}</span>
                  </button>
                ))}
              </div>

              {/* --- 2. รายการงาน --- */}
              <div className="flex flex-col space-y-3">
                {filteredAgenda.length > 0 ? (
                  filteredAgenda.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border bg-background p-3.5 cursor-pointer"
                      onClick={() => redirect(`/dashboard/admin/jobs/${item.id}`)}
                    >
                      {/* ส่วนซ้าย: ไอคอน + ชื่องาน + เวลา */}
                      <div className="flex items-center gap-3">
                        {/* {item.icon} */}
                        <div>
                          <p className="text-sm font-semibold">
                            {item.id}
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.time}
                          </p>
                        </div>
                      </div>

                      {/* ส่วนขวา: โปรไฟล์กลุ่ม */}
                      <div className="flex -space-x-2 overflow-hidden">
                        {item.team.slice(0, 2).map((member) => ( // แสดงสูงสุด 2 คน
                          <Avatar
                            key={member.id}
                            className="h-6 w-6 border-2 border-background"
                          >
                            <AvatarImage src={member.img} />
                            <AvatarFallback>{member.fallback}</AvatarFallback>
                          </Avatar>
                        ))}
                        {item.team.length > 2 && ( // ถ้ามีมากกว่า 2 คน
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                              +{item.team.length - 2}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    ไม่มี Agenda ในวันที่เลือก
                  </p>
                )}
              </div>

              {/* --- 3. ปุ่มด้านล่าง --- */}
              <Button variant="outline" className="w-full mt-6">
                All upcoming events <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
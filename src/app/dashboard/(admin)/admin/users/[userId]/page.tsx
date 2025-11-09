"use client";

import { useState } from "react";
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

// --- Mock Data ---
const userProfile = {
  name: "John Doe",
  role: "Junior Web Developer",
  avatarUrl: "https://github.com/shadcn.png",
  availability: "Available",
};

const analyticsStats = [
  {
    title: "งานที่ทำเสร็จแล้ว",
    value: "42",
    description: "งานทั้งหมดที่เสร็จสมบูรณ์",
    icon: <CheckCheck className="h-5 w-5 text-green-500" />,
  },
  {
    title: "จำนวนงานที่ทำอยู่",
    value: "5",
    description: "Tasks in progress",
    icon: <CircleDotDashed className="h-5 w-5 text-blue-500" />,
  },
  {
    title: "จำนวนการเข้างาน (30 วัน)",
    value: "28",
    description: "Active days in last 30 days",
    icon: <LogIn className="h-5 w-5 text-gray-500" />,
  },
];

const jobHistory = [
  {
    id: "JOB-001",
    taskName: "Develop Landing Page",
    project: "Project Phoenix",
    status: "Completed",
    date: "2025-11-05",
  },
  {
    id: "JOB-002",
    taskName: "Setup Authentication",
    project: "Tech Job App",
    status: "Completed",
    date: "2025-11-01",
  },
  {
    id: "JOB-003",
    taskName: "Fix API Bug",
    project: "Internal Tools",
    status: "In Progress",
    date: "2025-11-09",
  },
  {
    id: "JOB-004",
    taskName: "Design Dashboard UI",
    project: "Project Phoenix",
    status: "Declined",
    date: "2025-10-28",
  },
  {
    id: "JOB-005",
    taskName: "Refactor Database Schema",
    project: "Tech Job App",
    status: "In Progress",
    date: "2025-11-10",
  },
  {
    id: "JOB-006",
    taskName: "Write E2E Tests",
    project: "Project Phoenix",
    status: "Completed",
    date: "2025-10-30",
  },
  {
    id: "JOB-007",
    taskName: "Deploy to Vercel",
    project: "Tech Job App",
    status: "Completed",
    date: "2025-11-11",
  },
];

const agendaDates = [
  { weekday: "Mo", day: 12 },
  { weekday: "Tu", day: 13 },
  { weekday: "We", day: 14 },
  { weekday: "Th", day: 15 },
  { weekday: "Fr", day: 16 },
  { weekday: "Sa", day: 17 },
  { weekday: "Su", day: 18 },
];

const userAgenda = [
  {
    id: "A-1",
    day: 13,
    title: "Calm & Focus Group",
    time: "12:30-13:30",
    icon: <Users className="h-5 w-5 text-muted-foreground" />,
    team: [
      { id: "t1", name: "A", fallback: "A", img: "/avatars/01.png" },
      { id: "t2", name: "B", fallback: "B", img: "/avatars/02.png" },
      { id: "t3", name: "C", fallback: "C", img: "/avatars/03.png" },
      { id: "t5", name: "D", fallback: "D", img: "/avatars/05.png" },
    ],
  },
  {
    id: "A-2",
    day: 13,
    title: "1:1 with T. Morgan",
    time: "14:30-15:15",
    icon: <Users className="h-5 w-5 text-muted-foreground" />,
    team: [{ id: "t4", name: "M", fallback: "M", img: "/avatars/04.png" }],
  },
  {
    id: "A-3",
    day: 13,
    title: "1:1 with S. Green",
    time: "16:30-17:00",
    icon: <Users className="h-5 w-5 text-muted-foreground" />,
    team: [{ id: "t2", name: "B", fallback: "B", img: "/avatars/02.png" }],
  },
  {
    id: "A-4",
    day: 13,
    title: "1:1 with M. Carter",
    time: "18:00-19:00",
    icon: <Users className="h-5 w-5 text-muted-foreground" />,
    team: [{ id: "t5", name: "C", fallback: "C", img: "/avatars/05.png" }],
  },
  {
    id: "A-5",
    day: 14,
    title: "Project Phoenix Sync",
    time: "10:00-11:00",
    icon: <Users className="h-5 w-5 text-muted-foreground" />,
    team: [
      { id: "t1", name: "A", fallback: "A", img: "/avatars/01.png" },
      { id: "t2", name: "B", fallback: "B", img: "/avatars/02.png" },
    ],
  },
];
// --- End Mock Data ---

export default function UserAnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState(13);

  const filteredAgenda = userAgenda.filter(
    (item) => item.day === selectedDate
  );

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
          {/* 3. User Profile Card */}
          <Card className="mb-6">
            <CardContent className="pt-6 flex flex-col items-center space-y-2">
              <Avatar className="h-20 w-20 mb-2">
                <AvatarImage
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                />
                <AvatarFallback>
                  {userProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{userProfile.name}</h3>
              <p className="text-sm text-muted-foreground">
                {userProfile.role}
              </p>
              <Badge
                variant="outline"
                className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-100"
              >
                {userProfile.availability}
              </Badge>
            </CardContent>
          </Card>

          {/* 4. Agenda / ปฏิทินงาน */}
          <Card>
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
                      className="flex items-center justify-between rounded-lg border bg-background p-3.5"
                    >
                      {/* ส่วนซ้าย: ไอคอน + ชื่องาน + เวลา */}
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <div>
                          <p className="text-sm font-semibold">
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
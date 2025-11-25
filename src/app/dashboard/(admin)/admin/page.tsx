"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { useReportStore } from "@/stores/features/reportStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Users,
  Settings,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

export default function AdminWelcomePage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { jobs } = useJobStore();
  const { reports } = useReportStore();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("สวัสดีตอนเช้า");
    else if (hour < 18) setGreeting("สวัสดีตอนบ่าย");
    else setGreeting("สวัสดีตอนเย็น");
  }, []);

  // Calculate stats
  const stats = React.useMemo(() => {
    const pendingJobs = jobs.filter(j => j.status === "pending" || j.status === "pending_approval").length;
    const inProgressJobs = jobs.filter(j => j.status === "in_progress").length;
    const urgentReports = reports.filter(r => r.priority === "urgent" && r.status !== "resolved" && r.status !== "closed").length;
    const openReports = reports.filter(r => r.status === "open").length;

    return { pendingJobs, inProgressJobs, urgentReports, openReports };
  }, [jobs, reports]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-5xl z-10 space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={item} className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-muted/50 backdrop-blur-sm border mb-4">
            <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-normal bg-background/80">
              Admin Dashboard v2.0
            </Badge>
            <span className="text-xs text-muted-foreground px-3">
              {dayjs().format("D MMMM YYYY")}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {greeting}, {currentUser?.name || "Admin"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ยินดีต้อนรับกลับสู่ระบบจัดการงานซ่อมบำรุง นี่คือภาพรวมสถานะงานของคุณในวันนี้
          </p>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg bg-background/60 backdrop-blur-xl ring-1 ring-border/50 hover:ring-primary/50 transition-all cursor-pointer group" onClick={() => router.push('/dashboard/admin/jobs')}>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold">{stats.pendingJobs}</h3>
                <p className="text-sm text-muted-foreground font-medium">งานรอดำเนินการ</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-background/60 backdrop-blur-xl ring-1 ring-border/50 hover:ring-blue-500/50 transition-all cursor-pointer group" onClick={() => router.push('/dashboard/admin/jobs')}>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold">{stats.inProgressJobs}</h3>
                <p className="text-sm text-muted-foreground font-medium">งานกำลังทำ</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-background/60 backdrop-blur-xl ring-1 ring-border/50 hover:ring-red-500/50 transition-all cursor-pointer group" onClick={() => router.push('/dashboard/admin/reports')}>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold">{stats.urgentReports}</h3>
                <p className="text-sm text-muted-foreground font-medium">รายงานเร่งด่วน</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-background/60 backdrop-blur-xl ring-1 ring-border/50 hover:ring-green-500/50 transition-all cursor-pointer group" onClick={() => router.push('/dashboard/admin/reports')}>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <div className="p-3 rounded-2xl bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold">{stats.openReports}</h3>
                <p className="text-sm text-muted-foreground font-medium">รายงานใหม่</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Actions */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-xl cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1"
            onClick={() => router.push('/dashboard/admin/dashboard')}
          >
            <div className="relative z-10 space-y-4">
              <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">เข้าสู่ Dashboard</h3>
                <p className="text-primary-foreground/80 text-sm mt-1">ดูภาพรวมและสถิติทั้งหมด</p>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
                  เริ่มต้นใช้งาน <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
            {/* Abstract Pattern */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </div>

          <div
            className="group relative overflow-hidden rounded-3xl bg-white dark:bg-card border p-8 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
            onClick={() => router.push('/dashboard/admin/jobs/create')}
          >
            <div className="relative z-10 space-y-4">
              <div className="p-3 bg-muted w-fit rounded-xl">
                <Briefcase className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">สร้างงานใหม่</h3>
                <p className="text-muted-foreground text-sm mt-1">มอบหมายงานให้ทีมช่าง</p>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  สร้างงาน <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div
            className="group relative overflow-hidden rounded-3xl bg-white dark:bg-card border p-8 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
            onClick={() => router.push('/dashboard/admin/users')}
          >
            <div className="relative z-10 space-y-4">
              <div className="p-3 bg-muted w-fit rounded-xl">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">จัดการผู้ใช้</h3>
                <p className="text-muted-foreground text-sm mt-1">ดูแลบัญชีพนักงานและสิทธิ์</p>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  จัดการ <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div variants={item} className="flex justify-center pt-12">
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer" onClick={() => router.push('/dashboard/admin/notifications')}>
              <Bell className="h-4 w-4" />
              <span>การแจ้งเตือน</span>
            </div>
            <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer" onClick={() => router.push('/dashboard/admin/calendar')}>
              <Calendar className="h-4 w-4" />
              <span>ปฏิทินงาน</span>
            </div>
            <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer" onClick={() => router.push('/dashboard/admin/settings')}>
              <Settings className="h-4 w-4" />
              <span>ตั้งค่าระบบ</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
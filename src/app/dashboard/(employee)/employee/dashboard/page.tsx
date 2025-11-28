"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import NumberFlow from "@number-flow/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCheck,
  CircleDotDashed,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Award,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ChartArea,
  CalendarClock,
  ClipboardCheck,
  ListTodo,
} from "lucide-react";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

const chartConfig = {
  completed: { label: "เสร็จสมบูรณ์", color: "#22c55e" },
  in_progress: { label: "กำลังดำเนินการ", color: "#0ea5e9" },
  pending: { label: "รอดำเนินการ", color: "#f59e0b" },
  total: { label: "ทั้งหมด", color: "#8b5cf6" },
} satisfies ChartConfig;

const COLORS = {
  completed: "#22c55e",
  in_progress: "#0ea5e9",
  pending: "#f59e0b",
  cancelled: "#ef4444",
  rejected: "#dc2626",
};

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { jobs } = useJobStore();
  const [timeRange, setTimeRange] = useState("30d");

  // กรองงานที่เกี่ยวข้องกับผู้ใช้ปัจจุบัน
  const userJobs = useMemo(() => {
    if (!currentUser) return [];

    return jobs.filter((job) => {
      const isAssigned = job.assignedEmployees?.some((emp) => emp.id === currentUser.id);
      const isCreator = job.creator?.id === currentUser.id;
      const isLead = job.leadTechnician?.id === currentUser.id;
      return !!(isAssigned || isCreator || isLead);
    });
  }, [jobs, currentUser]);

  // คำนวณช่วงวันที่
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 30);
    }

    return { startDate, endDate: now };
  }, [timeRange]);

  // กรองงานตามช่วงวันที่
  const filteredJobs = useMemo(() => {
    return userJobs.filter((job) => {
      const jobDate = job.createdAt ? parseISO(job.createdAt) : new Date();
      return jobDate >= dateRange.startDate && jobDate <= dateRange.endDate;
    });
  }, [userJobs, dateRange]);

  // คำนวณข้อมูลช่วงก่อนหน้า
  const previousRangeJobs = useMemo(() => {
    const rangeDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const prevStart = subDays(dateRange.startDate, rangeDays);
    const prevEnd = dateRange.startDate;

    return userJobs.filter((job) => {
      const jobDate = job.createdAt ? parseISO(job.createdAt) : new Date();
      return jobDate >= prevStart && jobDate < prevEnd;
    });
  }, [userJobs, dateRange, timeRange]);

  // สถิติภาพรวม
  const stats = useMemo(() => {
    const total = filteredJobs.length;
    const completed = filteredJobs.filter((j) => j.status === "completed").length;
    const inProgress = filteredJobs.filter((j) => j.status === "in_progress").length;
    const pending = filteredJobs.filter((j) => j.status === "pending").length;
    const cancelled = filteredJobs.filter((j) => j.status === "cancelled").length;
    const rejected = filteredJobs.filter((j) => j.status === "rejected").length;

    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
    const avgCompletionTime = calculateAvgCompletionTime(filteredJobs);

    // คำนวณการเปลี่ยนแปลง
    const prevTotal = previousRangeJobs.length;
    const prevCompleted = previousRangeJobs.filter((j) => j.status === "completed").length;
    const prevInProgress = previousRangeJobs.filter((j) => j.status === "in_progress").length;

    // ฟังก์ชันคำนวณเปอร์เซ็นต์ที่ถูกต้อง
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0 && current === 0) return 0;
      if (previous === 0 && current > 0) return 100;
      if (previous > 0 && current === 0) return -100;
      return ((current - previous) / previous) * 100;
    };

    const totalChange = calculateChange(total, prevTotal);
    const completedChange = calculateChange(completed, prevCompleted);
    const inProgressChange = calculateChange(inProgress, prevInProgress);

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      rejected,
      completionRate: parseFloat(completionRate),
      avgCompletionTime,
      totalChange,
      completedChange,
      inProgressChange,
    };
  }, [filteredJobs, previousRangeJobs]);

  // ข้อมูลกราฟตามวันที่
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: dateRange.startDate,
      end: dateRange.endDate,
    });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayJobs = filteredJobs.filter((job) => {
        const jobDate = job.createdAt ? format(parseISO(job.createdAt), "yyyy-MM-dd") : "";
        return jobDate === dayStr;
      });

      return {
        date: format(day, "MM/dd"),
        completed: dayJobs.filter((j) => j.status === "completed").length,
        in_progress: dayJobs.filter((j) => j.status === "in_progress").length,
        pending: dayJobs.filter((j) => j.status === "pending").length,
        total: dayJobs.length,
      };
    });
  }, [filteredJobs, dateRange]);

  // Mini chart data (ทุก 3 วัน)
  const miniData = useMemo(() => {
    return chartData.filter((_, index) => index % 3 === 0);
  }, [chartData]);

  // ข้อมูลกราฟตามสถานะ (Pie Chart)
  const statusData = useMemo(() => {
    return [
      { name: "เสร็จสมบูรณ์", value: stats.completed, color: COLORS.completed },
      { name: "กำลังดำเนินการ", value: stats.inProgress, color: COLORS.in_progress },
      { name: "รอดำเนินการ", value: stats.pending, color: COLORS.pending },
      { name: "ยกเลิก", value: stats.cancelled, color: COLORS.cancelled },
      { name: "ปฏิเสธ", value: stats.rejected, color: COLORS.rejected },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // งานล่าสุด
  const recentJobs = useMemo(() => {
    return [...filteredJobs]
      .sort((a, b) => {
        const dateA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [filteredJobs]);

  // Summary stats for header
  const summaryStats = useMemo(() => [
    { label: "งานที่ดำเนินการ", value: stats.inProgress, change: stats.inProgressChange },
    { label: "งานที่เสร็จสิ้น", value: stats.completed, change: stats.completedChange },
    { label: "อัตราความสำเร็จ", value: stats.completionRate, change: stats.completedChange, isPercent: true },
  ], [stats]);

  // Quick actions
  const quickActions = useMemo(() => [
    {
      title: "ดูงานของฉัน",
      description: "ตรวจสอบงานที่ได้รับมอบหมาย",
      icon: CalendarClock,
      onClick: () => router.push("/dashboard/employee/jobs"),
    },
    {
      title: "ดูปฏิทินงาน",
      description: "รายการงานที่รอดำเนินการ",
      icon: ListTodo,
      onClick: () => router.push("/dashboard/employee/calendar"),
    },
  ], [router]);

  if (!currentUser) {
    return (
      <div className="p-6">
        <p className="text-gray-600">กรุณาเข้าสู่ระบบ</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-r from-primary/10 via-sky-100/40 to-transparent dark:from-primary/15 dark:via-primary/5 dark:to-transparent p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-background/60 backdrop-blur text-xs">อัปเดตเรียลไทม์</Badge>
              <span className="text-xs text-muted-foreground">Sync status • OK</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">แดชบอร์ดพนักงาน</h1>
              <p className="text-sm text-muted-foreground mt-1">
                ภาพรวมงานและประสิทธิภาพการทำงานของคุณ
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px] h-9 bg-background/80 border-muted-foreground/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 วันล่าสุด</SelectItem>
                  <SelectItem value="30d">30 วันล่าสุด</SelectItem>
                  <SelectItem value="90d">3 เดือนล่าสุด</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-9 border-muted-foreground/20" onClick={() => router.push('/dashboard/employee/jobs')}>
                ดูงานทั้งหมด
              </Button>
            </div>
          </div>
          {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-shrink-0 w-full lg:w-auto">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-background/80 backdrop-blur border border-white/40 dark:border-white/5 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">
                  <NumberFlow value={stat.value} format={{ notation: "compact" }} />
                  {stat.isPercent && "%"}
                </p>
                <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${stat.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {stat.change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  <span>{Math.abs(stat.change).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {(["completed", "in_progress", "pending"] as const).map((key) => {
          const value = key === "completed" ? stats.completed : key === "in_progress" ? stats.inProgress : stats.pending;
          const change = key === "completed" ? stats.completedChange : key === "in_progress" ? stats.inProgressChange : 0;
          const isUp = change >= 0;

          return (
            <Card
              key={key}
              className="flex flex-row justify-between px-6 py-5 rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border-l-4"
              style={{ borderLeftColor: chartConfig[key].color }}
            >
              <div className="flex flex-col justify-between">
                <span className="text-muted-foreground text-sm font-medium">
                  {chartConfig[key].label}
                </span>
                <div className="mt-2">
                  <span className="text-3xl font-bold tracking-tight">
                    <NumberFlow value={value} format={{ notation: "compact" }} />
                  </span>
                </div>
                {/* <div className="flex items-center gap-1 text-xs mt-2 font-medium">
                  {isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={isUp ? "text-emerald-500" : "text-rose-500"}>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1 font-normal">เทียบกับก่อนหน้า</span>
                </div> */}
              </div>
              <div className="w-24 h-16 self-center opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniData}>
                    <Area
                      type="monotone"
                      dataKey={key}
                      stroke={chartConfig[key].color}
                      fill={chartConfig[key].color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Area Chart */}
          <Card className="shadow-sm border-none ring-1 ring-border/50 bg-gradient-to-b from-background via-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ChartArea className="h-5 w-5 text-primary" />
                  แนวโน้มงาน
                </CardTitle>
                <CardDescription>ความคืบหน้าของงานในแต่ละวัน</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {(["completed", "in_progress", "pending"] as const).map((key) => (
                      <linearGradient id={`colorGradient-${key}`} key={key} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor={chartConfig[key].color} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={chartConfig[key].color} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    minTickGap={30}
                    tickFormatter={(value) => value}
                    className="text-xs text-muted-foreground font-medium"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs text-muted-foreground font-medium"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                      />
                    }
                  />
                  {(["completed", "in_progress", "pending"] as const).map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={chartConfig[key].color}
                      fill={`url(#colorGradient-${key})`}
                      strokeWidth={2}
                      fillOpacity={0.4}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">งานล่าสุด</CardTitle>
              <CardDescription>งานที่ได้รับมอบหมายล่าสุด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-start gap-4 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group cursor-pointer"
                      onClick={() => router.push(`/dashboard/employee/jobs/${job.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{job.title}</h4>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {job.description || "ไม่มีคำอธิบาย"}
                        </p>
                        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                          {job.departments && job.departments.length > 0 && (
                            <>
                              <Badge variant="outline" className="text-[10px] h-5 px-2">
                                {job.departments.join(", ")}
                              </Badge>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            </>
                          )}
                          <span>
                            {job.createdAt
                              ? format(parseISO(job.createdAt), "dd/MM/yyyy")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <p className="text-sm font-medium">ยังไม่มีงานในระบบ</p>
                    <p className="text-xs text-muted-foreground mt-1">งานใหม่จะแสดงที่นี่</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">

          {/* Pie Chart - สถานะงาน */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">สถานะงาน</CardTitle>
              <CardDescription>สัดส่วนงานตามสถานะ</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">ทางลัดที่ใช้บ่อย</CardTitle>
              <CardDescription>จัดการงานได้ทันที</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={action.onClick}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/40 transition-all text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-70" />
                </button>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Helper Component: Status Badge
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    completed: {
      label: "เสร็จสมบูรณ์",
      className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    },
    in_progress: {
      label: "กำลังดำเนินการ",
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    },
    pending: {
      label: "รอดำเนินการ",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
    cancelled: {
      label: "ยกเลิก",
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    },
    rejected: {
      label: "ปฏิเสธ",
      className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
    },
    pending_approval: {
      label: "รออนุมัติ",
      className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <Badge variant="outline" className={`${config.className} text-[10px] h-5 px-2 capitalize shrink-0 font-normal`}>
      {config.label}
    </Badge>
  );
}

// Helper Function: คำนวณเวลาเฉลี่ยในการทำงานเสร็จ
function calculateAvgCompletionTime(jobs: any[]): number {
  const completedJobs = jobs.filter(
    (job) => job.status === "completed" && job.startDate && job.endDate
  );

  if (completedJobs.length === 0) return 0;

  const totalDays = completedJobs.reduce((sum, job) => {
    const start = parseISO(job.startDate);
    const end = parseISO(job.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);

  return Math.round(totalDays / completedJobs.length);
}

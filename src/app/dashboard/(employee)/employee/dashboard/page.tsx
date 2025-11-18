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
  Calendar,
  Award,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const chartConfig = {
  completed: { label: "เสร็จสมบูรณ์", color: "hsl(var(--chart-1))" },
  in_progress: { label: "กำลังดำเนินการ", color: "hsl(var(--chart-2))" },
  pending: { label: "รอดำเนินการ", color: "hsl(var(--chart-3))" },
  total: { label: "ทั้งหมด", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const COLORS = {
  completed: "#22c55e",
  in_progress: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#ef4444",
  rejected: "#dc2626",
};

export default function EmployeeDashboardPage() {
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
      case "1y":
        startDate = subDays(now, 365);
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
    
    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      rejected,
      completionRate: parseFloat(completionRate),
      avgCompletionTime,
    };
  }, [filteredJobs]);

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

  // ข้อมูลกราฟตามแผนก
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, number>();
    
    filteredJobs.forEach((job) => {
      if (job.departments && job.departments.length > 0) {
        job.departments.forEach((dept) => {
          deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });
      }
    });

    return Array.from(deptMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredJobs]);

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

  if (!currentUser) {
    return (
      <div className="p-6">
        <p className="text-gray-600">กรุณาเข้าสู่ระบบ</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 md:p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              สรุปการทำงานและประสิทธิภาพของคุณ
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="เลือกช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 วันล่าสุด</SelectItem>
              <SelectItem value="30d">30 วันล่าสุด</SelectItem>
              <SelectItem value="90d">90 วันล่าสุด</SelectItem>
              <SelectItem value="1y">1 ปีล่าสุด</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberFlow value={stats.total} />
              </div>
              <p className="text-xs text-muted-foreground">
                ในช่วง {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : timeRange === "90d" ? "90" : "365"} วันล่าสุด
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เสร็จสมบูรณ์</CardTitle>
              <CheckCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                <NumberFlow value={stats.completed} />
              </div>
              <p className="text-xs text-muted-foreground">
                อัตราสำเร็จ {stats.completionRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
              <CircleDotDashed className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                <NumberFlow value={stats.inProgress} />
              </div>
              <p className="text-xs text-muted-foreground">
                งานที่กำลังทำอยู่
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ประสิทธิภาพ</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.completionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.avgCompletionTime > 0 
                  ? `เฉลี่ย ${stats.avgCompletionTime} วัน/งาน`
                  : "ยังไม่มีข้อมูล"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Area Chart - งานตามวันที่ */}
          <Card>
            <CardHeader>
              <CardTitle>งานตามวันที่</CardTitle>
              <CardDescription>
                แสดงจำนวนงานที่ได้รับมอบหมายในแต่ละวัน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.completed} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.completed} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.in_progress} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.in_progress} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      if (timeRange === "1y") {
                        return value.split("/")[0];
                      }
                      return value;
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke={COLORS.completed}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="in_progress"
                    stroke={COLORS.in_progress}
                    fillOpacity={1}
                    fill="url(#colorInProgress)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stroke={COLORS.pending}
                    fillOpacity={1}
                    fill={COLORS.pending}
                    stackId="1"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - สถานะงาน */}
          <Card>
            <CardHeader>
              <CardTitle>สถานะงาน</CardTitle>
              <CardDescription>
                แสดงสัดส่วนงานตามสถานะ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
        </div>

        {/* Bar Chart - งานตามแผนก */}
        {departmentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>งานตามแผนก</CardTitle>
              <CardDescription>
                แสดงจำนวนงานที่ทำในแต่ละแผนก
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={COLORS.in_progress} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>งานล่าสุด</CardTitle>
            <CardDescription>
              งานที่ได้รับมอบหมายล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <h4 className="font-semibold">{job.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.description || "ไม่มีคำอธิบาย"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {job.departments && job.departments.length > 0 && (
                            <Badge variant="outline">
                              {job.departments.join(", ")}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {job.createdAt
                              ? format(parseISO(job.createdAt), "dd/MM/yyyy")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  ยังไม่มีงานในระบบ
                </p>
              )}
            </div>
          </CardContent>
        </Card>
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
    <Badge variant="outline" className={config.className}>
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

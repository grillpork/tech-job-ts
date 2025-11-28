"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import NumberFlow from "@number-flow/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChartArea,
  Bug,
  AlertCircle,
  Lightbulb,
  FileText,
  MoreHorizontal,
  CalendarClock,
  ClipboardCheck,
  PlusCircle
} from "lucide-react";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useReportStore } from "@/stores/features/reportStore";
import type { Job } from "@/stores/features/jobStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const description = "Interactive Dashboard";

const chartConfig = {
  complete: { label: "เสร็จสิ้น", color: "#22c55e" },
  progressing: { label: "กำลังดำเนินการ", color: "#0ea5e9" },
  pending: { label: "รอดำเนินการ", color: "#a3a3a3" },
} satisfies ChartConfig;

const CHART_WINDOW_DAYS = 180;

const statusToChartKey: Record<Job["status"], keyof typeof chartConfig | null> = {
  pending: "pending",
  in_progress: "progressing",
  pending_approval: "pending",
  completed: "complete",
  cancelled: "pending",
  rejected: "pending",
};

const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48'];

export default function Page() {
  const router = useRouter();
  const [timeRange, setTimeRange] = React.useState("7d");
  const [reportFilter, setReportFilter] = React.useState("week");
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("complete");

  const { users } = useUserStore();
  const jobs = useJobStore((s) => s.jobs);
  const inventories = useInventoryStore((s) => s.inventories);
  const reports = useReportStore((s) => s.reports);

  const inventoryHasUsage = React.useMemo(
    () => jobs.some((j: any) => Array.isArray((j as any).usedInventory) && (j as any).usedInventory.length > 0),
    [jobs]
  );

  const topDepartments = React.useMemo(() => {
    const counts = jobs.reduce<Record<string, number>>((acc, job) => {
      // @ts-ignore - Accessing departments array which exists on Job type but might be missing in strict type def
      const departments = job.departments || [];

      if (Array.isArray(departments) && departments.length > 0) {
        departments.forEach((dept: string) => {
          if (dept && dept.trim() !== "") {
            acc[dept] = (acc[dept] || 0) + 1;
          }
        });
      } else {
        const unassigned = "ไม่ระบุแผนก";
        acc[unassigned] = (acc[unassigned] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [jobs]);

  const topInventory = React.useMemo(() => {
    const anyUsage = inventoryHasUsage;

    if (anyUsage) {
      const counts: Record<string, number> = {};
      jobs.forEach((j: any) => {
        (j.usedInventory || []).forEach((item: any) => {
          const id = item.id as string;
          const qty = typeof item.qty === "number" ? item.qty : 1;
          counts[id] = (counts[id] || 0) + qty;
        });
      });

      return Object.entries(counts)
        .map(([id, count]) => ({ id, count, name: inventories.find((i) => i.id === id)?.name || id }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    return inventories
      .slice()
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((i) => ({ id: i.id, name: i.name, count: i.quantity }));
  }, [jobs, inventories, inventoryHasUsage]);

  const graphKeys = React.useMemo(() => (["complete", "progressing", "pending"] as const), []);

  const rangeDays = React.useMemo(() => (timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90), [timeRange]);

  const allChartData = React.useMemo(() => {
    const end = dayjs().endOf("day");
    const start = end.subtract(CHART_WINDOW_DAYS - 1, "day");
    const data: { date: string; complete: number; progressing: number; pending: number }[] = [];
    const dateMap = new Map<string, { date: string; complete: number; progressing: number; pending: number }>();

    for (let i = 0; i < CHART_WINDOW_DAYS; i++) {
      const date = start.add(i, "day");
      const key = date.format("YYYY-MM-DD");
      const entry = { date: key, complete: 0, progressing: 0, pending: 0 };
      data.push(entry);
      dateMap.set(key, entry);
    }

    jobs.forEach((job: Job) => {
      if (!job?.createdAt) return;
      const jobDate = dayjs(job.createdAt);
      if (!jobDate.isValid()) return;
      if (jobDate.isBefore(start, "day") || jobDate.isAfter(end, "day")) return;
      const chartKey = statusToChartKey[job.status];
      if (!chartKey) return;
      const key = jobDate.format("YYYY-MM-DD");
      const entry = dateMap.get(key);
      if (entry) {
        entry[chartKey] += 1;
      }
    });

    return data;
  }, [jobs]);

  const filteredData = React.useMemo(() => {
    if (allChartData.length === 0) return [];
    return allChartData.slice(-rangeDays);
  }, [allChartData, rangeDays]);

  const hasFilteredData = React.useMemo(
    () =>
      filteredData.some(
        (entry) => entry.complete > 0 || entry.progressing > 0 || entry.pending > 0
      ),
    [filteredData]
  );

  const chartData = React.useMemo(
    () => (hasFilteredData ? filteredData : allChartData),
    [hasFilteredData, filteredData, allChartData]
  );

  const total = React.useMemo(
    () => ({
      complete: chartData.reduce((acc, curr) => acc + curr.complete, 0),
      progressing: chartData.reduce((acc, curr) => acc + curr.progressing, 0),
      pending: chartData.reduce((acc, curr) => acc + curr.pending, 0),
    }),
    [chartData]
  );

  const previousRangeData = React.useMemo(() => {
    if (allChartData.length === 0 || !hasFilteredData) return [];
    const endIndex = Math.max(0, allChartData.length - rangeDays);
    const startIndex = Math.max(0, endIndex - rangeDays);
    return allChartData.slice(startIndex, endIndex);
  }, [allChartData, rangeDays, hasFilteredData]);

  const previousTotals = React.useMemo(
    () => ({
      complete: previousRangeData.reduce((acc, curr) => acc + curr.complete, 0),
      progressing: previousRangeData.reduce((acc, curr) => acc + curr.progressing, 0),
      pending: previousRangeData.reduce((acc, curr) => acc + curr.pending, 0),
    }),
    [previousRangeData]
  );

  const percentChange = (key: keyof typeof chartConfig) => {
    const prev = previousTotals[key];
    const curr = total[key];
    // ถ้าทั้งสองเป็น 0 ให้ return 0
    if (prev === 0 && curr === 0) return 0;
    // ถ้า prev เป็น 0 แต่ curr > 0 ให้ return 100 (เพิ่มขึ้น 100%)
    if (prev === 0 && curr > 0) return 100;
    // ถ้า prev > 0 แต่ curr เป็น 0 ให้ return -100 (ลดลง 100%)
    if (prev > 0 && curr === 0) return -100;
    // คำนวณเปอร์เซ็นต์ปกติ
    return ((curr - prev) / prev) * 100;
  };

  const miniData = React.useMemo(() => {
    return chartData.filter((_, index) => index % 3 === 0);
  }, [chartData]);

  const filteredReports = React.useMemo(() => {
    const now = dayjs();
    return reports.filter(r => {
      const reportDate = dayjs(r.createdAt);
      if (reportFilter === "week") return reportDate.isAfter(now.subtract(1, 'week'));
      if (reportFilter === "month") return reportDate.isAfter(now.subtract(1, 'month'));
      if (reportFilter === "year") return reportDate.isAfter(now.subtract(1, 'year'));
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [reports, reportFilter]);



  const quickActions = React.useMemo(() => ([
    {
      title: "เช็กตารางงาน",
      description: "ดูคิวงานที่ต้องทำและการมอบหมายล่าสุด",
      icon: CalendarClock,
      onClick: () => router.push("/dashboard/admin/jobs"),
    },
    {
      title: "สร้างสต็อกใหม่",
      description: "เพิ่มวัสดุหรืออุปกรณ์ที่ต้องใช้",
      icon: PlusCircle,
      onClick: () => router.push("/dashboard/admin/inventorys"),
    },
  ]), [router]);

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
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">ศูนย์ควบคุมผู้ดูแลระบบ</h1>
              <p className="text-sm text-muted-foreground mt-1">
                ภาพรวมสถานะงาน รายงาน และสต็อกแบบโต้ตอบ เพื่อช่วยตัดสินใจได้เร็วขึ้น
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
              <Button variant="outline" className="h-9 border-muted-foreground/20" onClick={() => router.push('/dashboard/admin/reports')}>
                ดูรายงานทั้งหมด
              </Button>
              <Button onClick={() => router.push('/dashboard/admin/jobs/create')} className="h-9 shadow-sm gap-2">
                <span>สร้างงานใหม่</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {graphKeys.map((chart) => {
          const pct = percentChange(chart);
          const isUp = pct >= 0;
          return (
            <Card
              key={chart}
              className={`flex flex-row justify-between px-6 py-5 rounded-xl shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-l-4 ${activeChart === chart ? 'ring-2 ring-primary/20' : ''}`}
              style={{ borderLeftColor: chartConfig[chart].color }}
              onClick={() => setActiveChart(chart)}
            >
              <div className="flex flex-col justify-between">
                <span className="text-muted-foreground text-sm font-medium">
                  {chartConfig[chart].label}
                </span>
                <div className="mt-2">
                  <span className="text-3xl font-bold tracking-tight">
                    <NumberFlow value={total[chart]} format={{ notation: "compact" }} />
                  </span>
                </div>
                {/* <div className="flex items-center gap-1 text-xs mt-2 font-medium">
                  {isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={isUp ? "text-emerald-500" : "text-rose-500"}>
                    {Math.abs(pct).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1 font-normal">vs previous</span>
                </div> */}
              </div>
              <div className="w-24 h-16 self-center opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniData}>
                    <Area
                      type="monotone"
                      dataKey={chart}
                      stroke={chartConfig[chart].color}
                      fill={chartConfig[chart].color}
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
                <CardDescription>ประสิทธิภาพงานรายวัน</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {graphKeys.map((key) => (
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
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                        labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      />
                    }
                  />
                  {graphKeys.map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={chartConfig[key].color}
                      fill={`url(#colorGradient-${key})`}
                      strokeWidth={key === activeChart ? 3 : 1.5}
                      fillOpacity={key === activeChart ? 0.6 : 0.25}
                      activeDot={key === activeChart ? { r: 6, strokeWidth: 0, className: "animate-pulse" } : undefined}
                      opacity={key === activeChart ? 1 : 0.6}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* System Reports */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">รายงานระบบ</CardTitle>
                <CardDescription>ปัญหา บั๊ก และคำร้องล่าสุด</CardDescription>
              </div>
              <Tabs value={reportFilter} onValueChange={setReportFilter} className="w-auto">
                <TabsList className="h-8 bg-muted/50">
                  <TabsTrigger value="week" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">สัปดาห์</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">เดือน</TabsTrigger>
                  <TabsTrigger value="year" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">ปี</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <div className="p-3 rounded-full bg-muted/50 mb-3">
                      <FileText className="h-6 w-6 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">ไม่พบรายงานในช่วงเวลานี้</p>
                    <p className="text-xs text-muted-foreground mt-1">กลับมาตรวจสอบภายหลังหรือปรับตัวกรอง</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div key={report.id} className="flex items-start gap-4 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/admin/reports/${report.id}`)}>
                      <div className={`mt-1 p-2 rounded-full shrink-0 shadow-sm ${report.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                        report.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                        {report.type === 'bug' ? <Bug className="h-4 w-4" /> :
                          report.type === 'incident' ? <AlertCircle className="h-4 w-4" /> :
                            report.type === 'improvement' ? <Lightbulb className="h-4 w-4" /> :
                              <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{report.title}</h4>
                          <Badge variant="secondary" className="text-[10px] h-5 px-2 capitalize shrink-0 font-normal bg-muted/50">
                            {report.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {report.description || "ไม่มีคำอธิบาย"}
                        </p>
                        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Avatar className="h-4 w-4 border">
                              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{report.reporter.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{report.reporter.name}</span>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>{dayjs(report.createdAt).fromNow()}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 pt-4 border-t flex justify-center">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" onClick={() => router.push('/dashboard/admin/reports')}>
                  ดูรายงานทั้งหมด
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">

          {/* Top Departments */}
          <Card className="shadow-sm border-none ring-1 ring-border/50 h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">อันดับแผนก</CardTitle>
              <CardDescription>จำนวนงานสูงสุด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {topDepartments.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">ไม่มีข้อมูล</div>
                ) : (
                  topDepartments.map((d, idx) => (
                    <div key={d.name} className="flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 text-xs font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{d.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.round((d.count / Math.max(1, topDepartments[0].count)) * 100))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8 text-right tabular-nums">{d.count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Inventory (Horizontal Bar Chart) */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">อันดับการเบิกวัสดุ</CardTitle>
              <CardDescription>รายการสูงสุดตามจำนวน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  <span>รายการ</span>
                  <span>หน่วย</span>
                </div>
                {topInventory.length === 0 ? (
                  <div className="flex items-center justify-center h-[260px] text-xs text-muted-foreground">
                    ไม่มีข้อมูลวัสดุ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={topInventory}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                      barCategoryGap={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/30" />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={140}
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0];
                            return (
                              <div className="bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-xs animate-in fade-in zoom-in-95 duration-200">
                                <p className="font-semibold mb-1">{item.payload.name}</p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-muted-foreground">{item.value} หน่วย</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={18}>
                        {topInventory.map((entry, index) => (
                          <Cell key={`bar-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {topInventory.length > 0 && (
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
                    <span>รวมทั้งหมด</span>
                    <span className="font-semibold text-foreground">
                      <NumberFlow value={topInventory.reduce((a, b) => a + b.count, 0)} format={{ notation: "compact" }} />
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">ทางลัดที่ใช้บ่อย</CardTitle>
              <CardDescription>จัดการงานสำคัญได้ทันที</CardDescription>
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

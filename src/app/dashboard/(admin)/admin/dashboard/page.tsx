/* eslint-disable */
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
  TrendingUp,
  AlertTriangle,
  PackageSearch,
  CheckCircle2,
  Clock,
  Briefcase,
  ArrowRight,
  PlusCircle,
  FileText,
  AlertCircle,
  MoreHorizontal,
  Lightbulb,
  Bug,
  CalendarClock
} from "lucide-react";
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useReportStore } from "@/stores/features/reportStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const chartConfig = {
  complete: { label: "เสร็จสิ้น", color: "#22c55e" },
  progressing: { label: "กำลังดำเนินการ", color: "#0ea5e9" },
  pending: { label: "รอดำเนินการ", color: "#a3a3a3" },
} satisfies ChartConfig;

const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#e11d48'];

export default function Page() {
  const router = useRouter();
  const [timeRange, setTimeRange] = React.useState("7d");
  const [reportFilter, setReportFilter] = React.useState("week");
  const [summary, setSummary] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const jobs = useJobStore((s) => s.jobs);
  const inventories = useInventoryStore((s) => s.inventories);
  const reports = useReportStore((s) => s.reports);

  // Fetch real analytics from API
  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/analytics/summary');
      const result = await res.json();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSummary();
  }, [jobs, inventories, reports]); // Refresh when main stores change

  const topDepartments = React.useMemo(() => {
    const counts = jobs.reduce<Record<string, number>>((acc, job) => {
      const departments = (job as any).departments || [];
      if (Array.isArray(departments) && departments.length > 0) {
        departments.forEach((dept: string) => {
          if (dept && dept.trim() !== "") acc[dept] = (acc[dept] || 0) + 1;
        });
      } else {
        acc["ไม่ระบุแผนก"] = (acc["ไม่ระบุแผนก"] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [jobs]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between gap-6 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                Real-time Analytics
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                System Live
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                ศูนย์วิเคราะห์ข้อมูลอัจฉริยะ
              </h1>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                ภาพรวมประสิทธิภาพงาน สภาพคล่องของพัสดุ และแนวโน้มความสำเร็จของโปรเจกต์
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
               <Button onClick={() => router.push('/dashboard/admin/jobs/create')} size="lg" className="shadow-lg shadow-primary/20 gap-2 px-6">
                <span>สร้างงานใหม่</span>
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.push('/dashboard/admin/reports')} className="px-6">
                ดูรายงานระบบ
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:self-end">
            <Card className="bg-background/40 backdrop-blur border-dashed shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">งานเสร็จทั้งหมด</p>
                        <p className="text-2xl font-bold tabular-nums">{summary?.jobs.completed}</p>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all border-none ring-1 ring-border group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <Clock className="h-20 w-20" />
            </div>
            <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">งานรอดำเนินการ</p>
                <h3 className="text-4xl font-bold mt-2"><NumberFlow value={summary?.jobs.pending || 0} /></h3>
                <div className="mt-4 flex items-center gap-2 text-xs text-orange-500 font-semibold bg-orange-500/10 w-fit px-2 py-1 rounded-full">
                    <AlertCircle className="h-3 w-3" />
                    ต้องรีบเร่งจัดการ
                </div>
            </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-none ring-1 ring-border group overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <Briefcase className="h-20 w-20" />
            </div>
            <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">งานกำลังดำเนินการ</p>
                <h3 className="text-4xl font-bold mt-2 text-sky-600"><NumberFlow value={summary?.jobs.in_progress || 0} /></h3>
                <p className="text-xs text-muted-foreground mt-4 font-medium">Active Tasks อยู่ในกระบวนการ</p>
            </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-none ring-1 ring-border group overflow-hidden border-b-4 border-b-emerald-500">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-emerald-500">
                <CheckCircle2 className="h-20 w-20" />
            </div>
            <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">ความสำเร็จสะสม</p>
                <h3 className="text-4xl font-bold mt-2 text-emerald-600"><NumberFlow value={summary?.jobs.completed || 0} /></h3>
                <p className="text-xs text-muted-foreground mt-4 font-medium italic">ส่งมอบงานสำเร็จแล้ว</p>
            </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-none ring-1 ring-border group overflow-hidden bg-rose-50 dark:bg-rose-950/20">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-rose-500">
                <AlertTriangle className="h-20 w-20" />
            </div>
            <CardContent className="p-6">
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">แจ้งเตือนสินค้าใกล้หมด</p>
                <h3 className="text-4xl font-bold mt-2 text-rose-600"><NumberFlow value={summary?.inventory.lowStockCount || 0} /></h3>
                <div className="mt-4 flex items-center gap-2 cursor-pointer hover:underline text-rose-600 font-bold" onClick={() => router.push('/dashboard/admin/inventorys')}>
                    ตรวจสอบคลัง <ArrowRight className="h-4 w-4" />
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2/3) */}
        <Card className="lg:col-span-2 shadow-sm border-none ring-1 ring-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                <div>
                   <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        แนวโน้มความสำเร็จในการปิดงาน
                   </CardTitle>
                   <CardDescription>สถิติจบงานย้อนหลัง 6 เดือน</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="pt-8 bg-gradient-to-b from-muted/5 to-transparent">
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <AreaChart data={summary?.trends.completionTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: 'currentColor', fontSize: 12}} 
                            tickMargin={15}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'currentColor', fontSize: 12}} />
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-background border rounded-xl shadow-xl p-3 animate-in zoom-in-95">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">{payload[0].payload.name}</p>
                                            <p className="text-lg font-bold">ปิดงานได้ {payload[0].value} ใบ</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#22c55e" 
                            fillOpacity={1} 
                            fill="url(#colorComplete)" 
                            strokeWidth={3}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>

        {/* Inventory Requests & Alerts (1/3) */}
        <div className="space-y-6">
            <Card className="shadow-lg border-none ring-1 ring-border group hover:ring-primary/40 transition-all overflow-hidden relative">
                 <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <PackageSearch className="h-24 w-24" />
                </div>
                <CardHeader className="pb-2 bg-primary/5 border-b mb-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <PackageSearch className="h-5 w-5 text-primary" />
                        คำร้องขอเบิกวัสดุ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center py-6 text-center">
                        <h4 className="text-5xl font-extrabold text-foreground tracking-tighter">
                            <NumberFlow value={summary?.inventory.pendingRequests || 0} />
                        </h4>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">รอเจ้าหน้าที่อนุมัติ</p>
                        <Button 
                            onClick={() => router.push('/dashboard/admin/inventorys')} 
                            className="mt-6 w-full rounded-2xl h-12 gap-2 shadow-lg hover:shadow-primary/30 transition-shadow"
                        >
                            จัดการคำร้องทันที <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none ring-1 ring-border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">อันดับแผนกที่รับงานสูงสุด</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {topDepartments.map((d, idx) => (
                        <div key={d.name} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {idx + 1}
                                </span>
                                <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{d.name}</span>
                            </div>
                            <Badge variant="secondary" className="font-mono bg-muted/50">{d.count}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Reports and Bottom Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        <Card className="lg:col-span-2 shadow-sm border-none ring-1 ring-border">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
                <div>
                   <CardTitle className="text-lg font-bold">รายงานระบบล่าสุด</CardTitle>
                   <CardDescription>การแจ้งเตือนและเหตุการณ์ล่าสุด</CardDescription>
                </div>
                <Tabs value={reportFilter} onValueChange={setReportFilter} className="bg-muted/50 p-1 rounded-lg">
                    <TabsList className="bg-transparent h-8">
                        <TabsTrigger value="week" className="text-xs">7 วัน</TabsTrigger>
                        <TabsTrigger value="month" className="text-xs">30 วัน</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {filteredReports.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">ไม่พบรายการในช่วงเวลานี้</div>
                    ) : (
                        filteredReports.map((report) => (
                            <div key={report.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/admin/reports/${report.id}`)}>
                                <div className={`p-2 rounded-xl h-fit shadow-sm ${report.priority === 'urgent' ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                                    {report.type === 'bug' ? <Bug className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold truncate">{report.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[9px] h-4 py-0 font-normal">{report.type}</Badge>
                                        <span className="text-xs text-muted-foreground font-medium">{report.reporter.name}</span>
                                        <span className="text-[10px] text-muted-foreground/50">•</span>
                                        <span className="text-xs text-muted-foreground">{dayjs(report.createdAt).fromNow()}</span>
                                    </div>
                                </div>
                                <Badge variant={report.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px] px-2 py-0.5">
                                    {report.priority}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t flex justify-center">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline" onClick={() => router.push('/dashboard/admin/reports')}>
                        ดูรายงานทั้งหมดในระบบ
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-none ring-1 ring-border bg-rose-500/5 dark:bg-rose-500/10 border-t-4 border-t-rose-500">
            <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                    พัสดุใกล้หมด (Critical)
                </CardTitle>
                <CardDescription>รายการที่ตำกว่าจุดสั่งซื้อขั้นต่ำ</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {summary?.inventory.lowStockItems.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground font-semibold">พัสดุในคลังเพียงพอทุกรายการ</p>
                        </div>
                    ) : (
                        summary?.inventory.lowStockItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-background border shadow-sm group hover:border-rose-300 transition-colors">
                                <div className="min-w-0 flex-1 mr-3">
                                    <p className="text-sm font-bold truncate">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500" style={{ width: `${(item.quantity / item.minStock) * 100}%` }} />
                                        </div>
                                        <p className="text-[11px] text-rose-500 font-bold whitespace-nowrap">
                                            {item.quantity} / {item.minStock} หน่วย
                                        </p>
                                    </div>
                                </div>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shrink-0 group-hover:bg-primary group-hover:text-white transition-colors" onClick={() => router.push('/dashboard/admin/inventorys')}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                    
                    {summary?.inventory.lowStockItems.length > 0 && (
                        <Button variant="outline" className="w-full mt-4 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => router.push('/dashboard/admin/inventorys')}>
                            จัดการใบสั่งซื้อพัสดุ
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

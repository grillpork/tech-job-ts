"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
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
import { chartData } from "@/lib/mocks/chart-date";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ChartArea, 
  Bug, 
  AlertCircle, 
  Lightbulb, 
  FileText,
  MoreHorizontal
} from "lucide-react";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useReportStore } from "@/stores/features/reportStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const description = "Interactive Dashboard";

const chartConfig = {
  complete: { label: "Complete", color: "hsl(var(--chart-1))" },
  progressing: { label: "Progressing", color: "hsl(var(--chart-2))" },
  pending: { label: "Pending", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Page() {
  const router = useRouter();
  const [timeRange, setTimeRange] = React.useState("30d");
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
        const unassigned = "Unassigned";
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

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date("2024-06-30");
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - days);
    return chartData.filter((item) => new Date(item.date) >= startDate);
  }, [timeRange]);

  const total = React.useMemo(
    () => ({
      complete: filteredData.reduce((acc, curr) => acc + curr.complete, 0),
      progressing: filteredData.reduce((acc, curr) => acc + curr.progressing, 0),
      pending: filteredData.reduce((acc, curr) => acc + curr.pending, 0),
    }),
    [filteredData]
  );

  const previousData = React.useMemo(() => {
    const referenceDate = new Date("2024-06-30");
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const endDate = new Date(referenceDate);
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - days * 2);
    const prevRange = chartData.filter(
      (item) =>
        new Date(item.date) >= startDate && new Date(item.date) < endDate
    );
    return {
      complete: prevRange.reduce((acc, curr) => acc + curr.complete, 0),
      progressing: prevRange.reduce((acc, curr) => acc + curr.progressing, 0),
      pending: prevRange.reduce((acc, curr) => acc + curr.pending, 0),
    };
  }, [timeRange]);

  const percentChange = (key: keyof typeof chartConfig) => {
    const prev = previousData[key];
    const curr = total[key];
    if (prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  const miniData = React.useMemo(() => {
    return filteredData.filter((_, index) => index % 3 === 0);
  }, [filteredData]);

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

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of jobs, reports, and inventory metrics.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push('/dashboard/admin/jobs/create')} className="hidden sm:inline-flex h-9 shadow-sm">
            New Job
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {(["complete", "progressing", "pending"] as const).map((chart) => {
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
                <div className="flex items-center gap-1 text-xs mt-2 font-medium">
                  {isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={isUp ? "text-emerald-500" : "text-rose-500"}>
                    {Math.abs(pct).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1 font-normal">vs previous</span>
                </div>
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
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ChartArea className="h-5 w-5 text-primary" />
                  Job Trends
                </CardTitle>
                <CardDescription>Daily job performance over time</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartConfig[activeChart].color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chartConfig[activeChart].color} stopOpacity={0} />
                    </linearGradient>
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
                  <Area
                    type="monotone"
                    dataKey={activeChart}
                    stroke={chartConfig[activeChart].color}
                    fill="url(#colorGradient)"
                    strokeWidth={2.5}
                    activeDot={{ r: 6, strokeWidth: 0, className: "animate-pulse" }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* System Reports */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">System Reports</CardTitle>
                <CardDescription>Recent issues, bugs, and requests</CardDescription>
              </div>
              <Tabs value={reportFilter} onValueChange={setReportFilter} className="w-auto">
                <TabsList className="h-8 bg-muted/50">
                  <TabsTrigger value="week" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Week</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Month</TabsTrigger>
                  <TabsTrigger value="year" className="text-xs h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Year</TabsTrigger>
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
                    <p className="text-sm font-medium">No reports found for this period</p>
                    <p className="text-xs text-muted-foreground mt-1">Check back later or adjust filters</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div key={report.id} className="flex items-start gap-4 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/admin/reports/${report.id}`)}>
                      <div className={`mt-1 p-2 rounded-full shrink-0 shadow-sm ${
                        report.priority === 'urgent' ? 'bg-red-50 text-red-600' : 
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
                          {report.description || "No description provided"}
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
                  View All Reports
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
              <CardTitle className="text-base font-semibold">Top Departments</CardTitle>
              <CardDescription>By job volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {topDepartments.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">No data available</div>
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

          {/* Top Inventory (Pie Chart) */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Inventory Distribution</CardTitle>
              <CardDescription>Top items by quantity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full relative mt-2">
                {topInventory.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    No inventory data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topInventory}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="count"
                        cornerRadius={4}
                        strokeWidth={0}
                      >
                        {topInventory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-xs animate-in fade-in zoom-in-95 duration-200">
                                <p className="font-semibold mb-1">{payload[0].name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                                  <span className="text-muted-foreground">{payload[0].value} units</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span className="text-xs text-muted-foreground font-medium ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                   <div className="text-center">
                      <span className="text-3xl font-bold block tracking-tight text-foreground">
                        <NumberFlow value={topInventory.reduce((a, b) => a + b.count, 0)} format={{ notation: "compact" }} />
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Items</span>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

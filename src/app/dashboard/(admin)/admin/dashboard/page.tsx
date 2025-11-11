"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import NumberFlow from "@number-flow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { chartData } from "@/lib/mocks/chart-date";
import { ArrowUpRight, ArrowDownRight, ChartArea } from "lucide-react";
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { redirect } from "next/navigation";

export const description = "Interactive Area + Bar chart with NumberFlow";

const chartConfig = {
  complete: { label: "Complete", color: "var(--chart-1)" },
  progressing: { label: "Progressing", color: "var(--chart-2)" },
  pending: { label: "Pending", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function Page() {
  const [timeRange, setTimeRange] = React.useState("30d");
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("complete");
  const { users, currentUser, isAuthenticated } = useUserStore();
  const jobs = useJobStore((s) => s.jobs);
  const inventories = useInventoryStore((s) => s.inventories);

  const inventoryHasUsage = React.useMemo(
    () => jobs.some((j: any) => Array.isArray((j as any).usedInventory) && (j as any).usedInventory.length > 0),
    [jobs]
  );

  const topDepartments = React.useMemo(() => {
    const counts = jobs.reduce<Record<string, number>>((acc, job) => {
      const dept = job.department && job.department.trim() !== "" ? job.department : "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [jobs]);

  const topInventory = React.useMemo(() => {
    // Heuristic: if jobs reference usedInventory (with qty), sum quantities; otherwise fallback to quantity
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

    // Fallback: show top items by quantity
    return inventories
      .slice()
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((i) => ({ id: i.id, name: i.name, count: i.quantity }));
  }, [jobs, inventories]);

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
      progressing: filteredData.reduce(
        (acc, curr) => acc + curr.progressing,
        0
      ),
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of jobs, users and recent activity</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => redirect('/dashboard/admin/jobs/create')} className="hidden sm:inline-flex">New Job</Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {([
            "complete",
            "progressing",
            "pending",
          ] as (keyof typeof chartConfig)[]).map((chart) => {
            const pct = percentChange(chart);
            const isUp = pct >= 0;
            return (
              <Card
                key={chart}
                className="flex flex-row justify-between px-4 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-sm bg-card"
                onClick={() => setActiveChart(chart)}
              >
                <div>
                  <span className="text-muted-foreground text-xs">
                    {chartConfig[chart].label}
                  </span>
                  <span className="text-3xl font-bold flex items-end gap-2">
                    <NumberFlow
                      value={total[chart]}
                      format={{ notation: "compact" }}
                    />
                  </span>
                  <div className="flex items-center gap-1 text-sm mt-1 flex-wrap">
                    {isUp ? (
                      <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-500" />
                    )}
                    <span
                      className={`${
                        isUp ? "text-green-500" : "text-red-500"
                      } font-medium`}
                    >
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {timeRange === "7d"
                        ? "vs last week"
                        : timeRange === "30d"
                        ? "vs last month"
                        : "vs last 3 months"}
                    </span>
                  </div>
                </div>
                <div className="w-24 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniData}>
                      <Area
                        type="monotone"
                        fill="none"
                        dataKey={chart}
                        stroke={
                          chart === "complete"
                            ? "var(--chart-1)"
                            : chart === "progressing"
                            ? "var(--chart-2)"
                            : "var(--chart-3)"
                        }
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
                );
              })}
            </div>

              {/* Area Chart */}
              <Card className="py-4 w-full gap-2 sm:py-0">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-2">
              <div className="flex items-center gap-2">
                <ChartArea />
                <h2 className="text-lg font-semibold">Job Progress Overview</h2>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[160px] rounded-lg hidden sm:flex">
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardContent className="px-2 sm:p-0">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={filteredData}>
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${activeChart})`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${activeChart})`}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={1}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey="views"
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={activeChart}
                    stroke={`var(--color-${activeChart})`}
                    fill="url(#colorGradient)"
                    strokeWidth={1}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
            
          </Card>
 <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Recent activity</h3>
                  <p className="text-xs text-muted-foreground">Latest users and actions</p>
                </div>
                <Badge>Live</Badge>
              </div>

              <Separator className="my-3" />

              <div className="space-y-3">
                {users.slice(0, 6).map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Avatar>
                      {user.imageUrl ? (
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                      ) : (
                        <AvatarFallback>{(user.name || "").charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.role}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Joined recently</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Recent activity / quick actions on right */}
          <div className="grid grid-cols-1 gap-4 lg:hidden" />
        </div>

        <aside className="space-y-4">
         

         

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Top Departments</h3>
                    <p className="text-xs text-muted-foreground">Departments with most jobs (top 5)</p>
                  </div>
                  <Badge>Live</Badge>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2">
                  {topDepartments.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No departments or jobs yet</div>
                  ) : (
                    topDepartments.map((d, idx) => (
                      <div key={d.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-sm font-semibold">{idx + 1}.</div>
                          <div>
                            <div className="text-sm font-medium">{d.name}</div>
                            <div className="text-xs text-muted-foreground">{d.count} jobs</div>
                          </div>
                        </div>
                        <div className="w-24">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-primary"
                              style={{ width: `${Math.min(100, Math.round((d.count / Math.max(1, topDepartments[0].count)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Top Inventory</h3>
                    <p className="text-xs text-muted-foreground">Most used (or highest quantity) items</p>
                  </div>
                  <Badge>Live</Badge>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2">
                  {topInventory.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No inventory defined</div>
                  ) : (
                    topInventory.map((it, idx) => (
                      <div key={it.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-sm font-semibold">{idx + 1}.</div>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {inventories.find((inv) => inv.id === it.id)?.imageUrl ? (
                                <AvatarImage src={inventories.find((inv) => inv.id === it.id)?.imageUrl || ""} alt={it.name} />
                              ) : (
                                <AvatarFallback>{(it.name || "").split(" ").map(s => s.charAt(0)).slice(0,2).join("")}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{it.name}</div>
                              <div className="text-xs text-muted-foreground">{it.count} {inventoryHasUsage ? "uses" : "qty"}</div>
                            </div>
                          </div>
                        </div>
                        <div className="w-24">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-emerald-500"
                              style={{ width: `${Math.min(100, Math.round((it.count / Math.max(1, topInventory[0].count)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

             <Card>
            <CardContent>
              <h3 className="text-sm font-semibold">Quick actions</h3>
              <div className="mt-3 flex flex-col gap-2">
                <Button>New Job</Button>
                <Button variant="outline">Export CSV</Button>
                <Button variant="ghost">Manage users</Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

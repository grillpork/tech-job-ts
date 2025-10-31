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
import MapMockup from "@/components/map/MapMockup";

export const description = "Interactive Area + Bar chart with NumberFlow";

const chartConfig = {
  complete: { label: "Complete", color: "var(--chart-1)" },
  progressing: { label: "Progressing", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function Page() {
  const [timeRange, setTimeRange] = React.useState("30d");
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("complete");

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
      (item) => new Date(item.date) >= startDate && new Date(item.date) < endDate
    );
    return {
      complete: prevRange.reduce((acc, curr) => acc + curr.complete, 0),
      progressing: prevRange.reduce((acc, curr) => acc + curr.progressing, 0),
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
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6 w-full">
      {/* Left Column */}
      <div className="flex flex-col gap-4 w-full md:w-2/3">
        {/* Summary Cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {(["complete", "progressing"] as (keyof typeof chartConfig)[]).map((chart) => {
            const pct = percentChange(chart);
            const isUp = pct >= 0;
            return (
              <Card
                key={chart}
                className="flex-1 flex flex-row justify-between px-4 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-md cursor-pointer transition hover:bg-muted/50"
                onClick={() => setActiveChart(chart)}
              >
                <div>
                  <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                  <span className="text-3xl font-bold flex items-end gap-2">
                    <NumberFlow value={total[chart]} format={{ notation: "compact" }} />
                  </span>
                  <div className="flex items-center gap-1 text-sm mt-1 flex-wrap">
                    {isUp ? (
                      <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-500" />
                    )}
                    <span className={`${isUp ? "text-green-500" : "text-red-500"} font-medium`}>
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {timeRange === "7d" ? "vs last week" : timeRange === "30d" ? "vs last month" : "vs last 3 months"}
                    </span>
                  </div>
                </div>
                <div className="w-24 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={miniData}>
                      <Bar
                        dataKey={chart}
                        fill={chart === "complete" ? "var(--chart-1)" : "var(--chart-2)"}
                        radius={[4, 4, 0, 0]}
                        barSize={6}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Area Chart */}
        <Card className="py-4 gap-2 sm:py-0">
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
          <CardContent className="px-2 sm:p-6 space-y-10">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={filteredData} margin={{ left: 12, right: 12 }}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${activeChart})`} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={`var(--color-${activeChart})`} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Map */}
      <Card className="w-full md:w-1/3 h-[400px] sm:h-[500px] overflow-clip">
        <MapMockup />
      </Card>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, RadarChart, PolarGrid, PolarAngleAxis, Radar, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const cognitiveScores = [
  { month: "Jan", memory: 72, attention: 65 },
  { month: "Feb", memory: 68, attention: 70 },
  { month: "Mar", memory: 74, attention: 68 },
  { month: "Apr", memory: 71, attention: 75 },
  { month: "May", memory: 76, attention: 72 },
  { month: "Jun", memory: 78, attention: 74 },
];

const activityData = [
  { day: "Mon", steps: 4200, activeMin: 32 },
  { day: "Tue", steps: 3800, activeMin: 28 },
  { day: "Wed", steps: 5100, activeMin: 45 },
  { day: "Thu", steps: 4600, activeMin: 38 },
  { day: "Fri", steps: 3200, activeMin: 25 },
  { day: "Sat", steps: 6200, activeMin: 55 },
  { day: "Sun", steps: 5800, activeMin: 50 },
];

const medicationData = [
  { name: "Taken", value: 82, fill: "var(--chart-1)" },
  { name: "Missed", value: 12, fill: "var(--chart-2)" },
  { name: "Late", value: 6, fill: "var(--chart-3)" },
];

const radarData = [
  { domain: "Memory", score: 74 },
  { domain: "Language", score: 68 },
  { domain: "Attention", score: 81 },
  { domain: "Reasoning", score: 65 },
  { domain: "Orientation", score: 78 },
  { domain: "Social", score: 70 },
];

const lineConfig = {
  memory: { label: "Memory", color: "var(--chart-1)" },
  attention: { label: "Attention", color: "var(--chart-2)" },
} satisfies ChartConfig;

const barConfig = {
  steps: { label: "Steps", color: "var(--chart-1)" },
  activeMin: { label: "Active Min", color: "var(--chart-2)" },
} satisfies ChartConfig;

const pieConfig = {
  taken: { label: "Taken", color: "var(--chart-1)" },
  missed: { label: "Missed", color: "var(--chart-2)" },
  late: { label: "Late", color: "var(--chart-3)" },
} satisfies ChartConfig;

const radarConfig = {
  score: { label: "Score", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col overflow-hidden p-4">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
        {/* Cognitive Scores Over Time */}
        <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow min-h-0">
          <div className="p-4 pb-2">
            <h2 className="text-sm font-semibold">Cognitive Scores</h2>
            <p className="text-xs text-muted-foreground">Memory & attention over 6 months</p>
          </div>
          <div className="flex-1 p-4 pt-0 min-h-0">
            <ChartContainer config={lineConfig} className="h-full w-full">
              <LineChart data={cognitiveScores}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[55, 90]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line dataKey="memory" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line dataKey="attention" type="monotone" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        {/* Daily Activity */}
        <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow min-h-0">
          <div className="p-4 pb-2">
            <h2 className="text-sm font-semibold">Daily Activity</h2>
            <p className="text-xs text-muted-foreground">Steps & active minutes this week</p>
          </div>
          <div className="flex-1 p-4 pt-0 min-h-0">
            <ChartContainer config={barConfig} className="h-full w-full">
              <BarChart data={activityData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="steps" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeMin" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Medication Adherence */}
        <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow min-h-0">
          <div className="p-4 pb-2">
            <h2 className="text-sm font-semibold">Medication Adherence</h2>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="flex-1 p-4 pt-0 min-h-0">
            <ChartContainer config={pieConfig} className="h-full w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Pie data={medicationData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius="60%">
                  {medicationData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>

        {/* Cognitive Domain Radar */}
        <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow min-h-0">
          <div className="p-4 pb-2">
            <h2 className="text-sm font-semibold">Cognitive Domains</h2>
            <p className="text-xs text-muted-foreground">Current assessment snapshot</p>
          </div>
          <div className="flex-1 p-4 pt-0 min-h-0">
            <ChartContainer config={radarConfig} className="h-full w-full">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Radar dataKey="score" fill="var(--chart-1)" fillOpacity={0.3} stroke="var(--chart-1)" strokeWidth={2} />
              </RadarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </main>
  );
}

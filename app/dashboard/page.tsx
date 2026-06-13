"use client";

import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  XAxis, YAxis, ReferenceLine,
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { kpiData, BASELINES, medicationEncoded, moodEncoded } from "@/lib/mock-kpi-data";
import { CognitiveDeclineChart } from "@/components/cognitive-decline-chart";

const activityData = [
  { day: "Mon", steps: 4200, activeMin: 32 },
  { day: "Tue", steps: 3800, activeMin: 28 },
  { day: "Wed", steps: 5100, activeMin: 45 },
  { day: "Thu", steps: 4600, activeMin: 38 },
  { day: "Fri", steps: 3200, activeMin: 25 },
  { day: "Sat", steps: 6200, activeMin: 55 },
  { day: "Sun", steps: 5800, activeMin: 50 },
];

const barConfig = {
  steps: { label: "Steps", color: "var(--chart-1)" },
  activeMin: { label: "Active Min", color: "var(--chart-2)" },
} satisfies ChartConfig;

const fluencyConfig = { verbalFluency: { label: "Animals Named", color: "var(--chart-1)" } } satisfies ChartConfig;
const storyConfig = { storyRecallDetails: { label: "Details Recalled", color: "var(--chart-2)" }, storyRecallSpeakingTime: { label: "Speaking Time (s)", color: "var(--chart-3)" } } satisfies ChartConfig;
const namingConfig = { namingAccuracy: { label: "Accuracy %", color: "var(--chart-1)" }, wordFindingFailures: { label: "Word-Finding Failures", color: "var(--chart-4)" } } satisfies ChartConfig;
const wordRecallConfig = { immediateWordRecall: { label: "Immediate", color: "var(--chart-1)" }, delayedWordRecall: { label: "Delayed", color: "var(--chart-2)" } } satisfies ChartConfig;
const orientationConfig = { temporalOrientation: { label: "Orientation Score", color: "var(--chart-3)" } } satisfies ChartConfig;
const stopWordConfig = { stopWordFraction: { label: "Stop Word Fraction", color: "var(--chart-4)" } } satisfies ChartConfig;
const speakingTimeConfig = { speakingTimeFluency: { label: "Fluency Task", color: "var(--chart-1)" }, speakingTimeStoryRecall: { label: "Story Recall", color: "var(--chart-2)" } } satisfies ChartConfig;
const repetitionConfig = { repetitionCount: { label: "Repetitions", color: "var(--chart-5)" } } satisfies ChartConfig;

const latest = kpiData[kpiData.length - 1];

const medColorMap: Record<string, string> = {
  Confirmed: "var(--chart-1)",
  Uncertain: "var(--chart-3)",
  Missed: "var(--chart-2)",
};
const moodColorMap: Record<string, string> = {
  Cheerful: "var(--chart-1)",
  Neutral: "var(--chart-3)",
  Flat: "var(--chart-4)",
  Anxious: "var(--chart-2)",
  Agitated: "var(--chart-5)",
};
const medCurrentColor = medColorMap[latest.medicationAdherence];
const moodCurrentColor = moodColorMap[latest.mood];
const safetyFlagCount = kpiData.filter((d) => d.safetyFlag).length;

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow min-h-0">
      <div className="p-4 pb-2 shrink-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="p-4 pt-0 flex-1 min-h-0">{children}</div>
    </div>
  );
}

function StatCard({
  title, current, currentColor, meta, dots,
}: {
  title: string;
  current: string;
  currentColor: string;
  meta: string;
  dots: { color: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <div>
        <span className="text-2xl font-bold" style={{ color: currentColor }}>{current}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dots.map((d, i) => (
          <div
            key={i}
            className="size-3.5 rounded-full"
            style={{ backgroundColor: d.color, opacity: 0.85 }}
            title={d.label}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">← 14-day history (hover for date)</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col p-4 gap-4 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Mary Chen · 76</h1>
          <p className="text-xs text-muted-foreground">Early MCI · Last call {latest.date}</p>
        </div>
        {safetyFlagCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5">
            <span className="size-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-destructive">{safetyFlagCount} safety flag{safetyFlagCount > 1 ? "s" : ""} in 14 days</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0 gap-4">
        <TabsList className="w-fit shrink-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Language & Memory</TabsTrigger>
          <TabsTrigger value="speech">Speech & Behavior</TabsTrigger>
          <TabsTrigger value="wellness">Wellness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-1 min-h-0 mt-0">
          <CognitiveDeclineChart />
        </TabsContent>

        <TabsContent value="memory" className="flex flex-col flex-1 min-h-0 gap-4 mt-0">
          <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">
            <ChartCard title="Verbal Fluency" subtitle="Unique animals named in 60 s (baseline 14)">
              <ChartContainer config={fluencyConfig} className="h-full w-full">
                <LineChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 20]} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={BASELINES.verbalFluency} stroke="var(--chart-2)" strokeDasharray="4 2" label={{ value: "baseline", position: "right", fontSize: 9, fill: "var(--chart-2)" }} />
                  <ReferenceLine y={BASELINES.verbalFluency * 0.8} stroke="var(--chart-4)" strokeDasharray="2 2" label={{ value: "−20% alert", position: "right", fontSize: 9, fill: "var(--chart-4)" }} />
                  <Line dataKey="verbalFluency" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Story Recall" subtitle="Details recalled (0–10) + speaking time (s)">
              <ChartContainer config={storyConfig} className="h-full w-full">
                <LineChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={BASELINES.storyRecallDetails} stroke="var(--chart-2)" strokeDasharray="4 2" />
                  <Line dataKey="storyRecallDetails" type="monotone" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line dataKey="storyRecallSpeakingTime" type="monotone" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Object Naming" subtitle="Accuracy % and word-finding failures">
              <ChartContainer config={namingConfig} className="h-full w-full">
                <LineChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={BASELINES.namingAccuracy} stroke="var(--chart-1)" strokeDasharray="4 2" />
                  <Line dataKey="namingAccuracy" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line dataKey="wordFindingFailures" type="monotone" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 3 }} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Word Recall" subtitle="Immediate and delayed (0–3)">
              <ChartContainer config={wordRecallConfig} className="h-full w-full">
                <LineChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="immediateWordRecall" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line dataKey="delayedWordRecall" type="monotone" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Temporal Orientation" subtitle="Day / date / month / year (0–4)">
              <ChartContainer config={orientationConfig} className="h-full w-full">
                <LineChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={4} stroke="var(--chart-3)" strokeDasharray="4 2" />
                  <Line dataKey="temporalOrientation" type="monotone" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="speech" className="flex flex-col flex-1 min-h-0 gap-4 mt-0">
          <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">
            <ChartCard title="Stop Word Fraction" subtitle="Filler words as proportion of total speech">
              <ChartContainer config={stopWordConfig} className="h-full w-full">
                <LineChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} domain={[0.25, 0.55]} tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(2)} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => (v as number).toFixed(2)} />} />
                  <ReferenceLine y={BASELINES.stopWordFraction} stroke="var(--chart-3)" strokeDasharray="4 2" label={{ value: "baseline", position: "right", fontSize: 9, fill: "var(--chart-3)" }} />
                  <ReferenceLine y={BASELINES.stopWordFraction + 0.15} stroke="var(--chart-2)" strokeDasharray="2 2" label={{ value: "+15% alert", position: "right", fontSize: 9, fill: "var(--chart-2)" }} />
                  <Line dataKey="stopWordFraction" type="monotone" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Repetition Within Call" subtitle="Times patient repeated a phrase or question">
              <ChartContainer config={repetitionConfig} className="h-full w-full">
                <BarChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={3} stroke="var(--chart-4)" strokeDasharray="4 2" label={{ value: "flag ≥3", position: "right", fontSize: 9, fill: "var(--chart-4)" }} />
                  <Bar dataKey="repetitionCount" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Speaking Time per Task" subtitle="Fluency and story recall windows (seconds)">
              <ChartContainer config={speakingTimeConfig} className="h-full w-full">
                <BarChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={BASELINES.speakingTimeFluency} stroke="var(--chart-1)" strokeDasharray="4 2" />
                  <ReferenceLine y={BASELINES.speakingTimeStoryRecall} stroke="var(--chart-2)" strokeDasharray="4 2" />
                  <Bar dataKey="speakingTimeFluency" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="speakingTimeStoryRecall" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="wellness" className="flex flex-col flex-1 min-h-0 gap-4 mt-0">
          <div className="shrink-0 grid grid-cols-3 gap-4">
            <StatCard
              title="Medication adherence"
              current={latest.medicationAdherence}
              currentColor={medCurrentColor}
              meta="14-day history · green = Confirmed · yellow = Uncertain · red = Missed"
              dots={medicationEncoded.map((d) => ({ color: medColorMap[d.label] ?? "var(--muted)", label: `${d.date}: ${d.label}` }))}
            />
            <StatCard
              title="Mood & affect"
              current={latest.mood}
              currentColor={moodCurrentColor}
              meta="14-day history · green = Cheerful · yellow = Neutral · orange = Flat · red = Anxious"
              dots={moodEncoded.map((d) => ({ color: moodColorMap[d.label] ?? "var(--muted)", label: `${d.date}: ${d.label}` }))}
            />
            <StatCard
              title="Safety flags"
              current={safetyFlagCount === 0 ? "None" : `${safetyFlagCount} flag${safetyFlagCount > 1 ? "s" : ""}`}
              currentColor={safetyFlagCount === 0 ? "var(--chart-1)" : "var(--chart-2)"}
              meta="Falls, wandering, or distress · red = flagged · green = clear"
              dots={kpiData.map((d) => ({ color: d.safetyFlag ? "var(--chart-2)" : "var(--chart-1)", label: `${d.date}: ${d.safetyFlag ? "Flagged" : "Clear"}` }))}
            />
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
            <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow min-h-0">
              <div className="p-4 pb-2 shrink-0">
                <h2 className="text-sm font-semibold">Daily Activity</h2>
                <p className="text-xs text-muted-foreground">Steps & active minutes this week</p>
              </div>
              <div className="p-4 pt-0 flex-1 min-h-0">
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

            <ChartCard title="Call Duration" subtitle="Minutes per completed call">
              <ChartContainer config={{ callDurationMinutes: { label: "Duration (min)", color: "var(--chart-1)" } }} className="h-full w-full">
                <BarChart data={kpiData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickLine={false} axisLine={false} domain={[0, 12]} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="callDurationMinutes" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

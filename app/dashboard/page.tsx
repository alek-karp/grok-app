"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { CognitiveDeclineChart } from "@/components/cognitive-decline-chart";
import { Badge } from "@/components/ui/badge";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  DashboardKpiEntry,
  DashboardKpiPayload,
} from "@/lib/dashboard-kpi";
import { BASELINES } from "@/lib/mock-kpi-data";
import { storage } from "@/lib/storage";

const activityData = [
  { day: "Mon", steps: 4200, activeMin: 32 },
  { day: "Tue", steps: 3800, activeMin: 28 },
  { day: "Wed", steps: 5100, activeMin: 45 },
  { day: "Thu", steps: 4600, activeMin: 38 },
  { day: "Fri", steps: 3200, activeMin: 25 },
  { day: "Sat", steps: 6200, activeMin: 55 },
  { day: "Sun", steps: 5800, activeMin: 50 },
];

const chartTick = { fontSize: 14 };
const barConfig = {
  steps: { label: "Steps", color: "var(--chart-1)" },
  activeMin: { label: "Active Min", color: "var(--chart-2)" },
} satisfies ChartConfig;

const fluencyConfig = {
  verbalFluency: { label: "Animals Named", color: "var(--chart-1)" },
} satisfies ChartConfig;
const storyConfig = {
  storyRecallDetails: { label: "Details Recalled", color: "var(--chart-2)" },
  storyRecallSpeakingTime: {
    label: "Speaking Time (s)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;
const namingConfig = {
  namingAccuracy: { label: "Accuracy %", color: "var(--chart-1)" },
  wordFindingFailures: {
    label: "Word-Finding Failures",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;
const wordRecallConfig = {
  immediateWordRecall: { label: "Immediate", color: "var(--chart-1)" },
  delayedWordRecall: { label: "Delayed", color: "var(--chart-2)" },
} satisfies ChartConfig;
const orientationConfig = {
  temporalOrientation: { label: "Orientation Score", color: "var(--chart-3)" },
} satisfies ChartConfig;
const stopWordConfig = {
  stopWordFraction: { label: "Stop Word Fraction", color: "var(--chart-4)" },
} satisfies ChartConfig;
const lexicalConfig = {
  lexicalDiversity: { label: "Lexical Diversity", color: "var(--chart-3)" },
} satisfies ChartConfig;
const speakingTimeConfig = {
  speakingTimeFluency: { label: "Fluency Task", color: "var(--chart-1)" },
  speakingTimeStoryRecall: { label: "Story Recall", color: "var(--chart-2)" },
} satisfies ChartConfig;
const repetitionConfig = {
  repetitionCount: { label: "Repetitions", color: "var(--chart-5)" },
} satisfies ChartConfig;

const medColorMap: Record<string, string> = {
  Confirmed: "var(--chart-1)",
  Uncertain: "var(--chart-3)",
  Missed: "var(--chart-2)",
  "Not assessed": "var(--muted-foreground)",
};
const moodColorMap: Record<string, string> = {
  Cheerful: "var(--chart-1)",
  Neutral: "var(--chart-3)",
  Flat: "var(--chart-4)",
  Anxious: "var(--chart-2)",
  Agitated: "var(--chart-5)",
  "Not assessed": "var(--muted-foreground)",
};

type NumericKpiKey = {
  [K in keyof DashboardKpiEntry]: DashboardKpiEntry[K] extends number | null
    ? K
    : never;
}[keyof DashboardKpiEntry];


function hasAnyValue(data: DashboardKpiEntry[], keys: NumericKpiKey[]) {
  return data.some((entry) =>
    (keys as (keyof DashboardKpiEntry)[]).some(
      (key) => typeof entry[key] === "number",
    ),
  );
}

function chartInterval(data: DashboardKpiEntry[]) {
  return data.length > 16 ? Math.ceil(data.length / 8) : 0;
}

function currentColor(map: Record<string, string>, value: string) {
  return map[value] ?? "var(--muted-foreground)";
}

function ChartCard({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-72 flex-col rounded-xl border bg-card text-card-foreground shadow">
      <div className="shrink-0 p-4 pb-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="min-h-0 flex-1 p-4 pt-0">
        {empty ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No assessed values yet.
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  current,
  currentColor,
  meta,
  dots,
}: {
  title: string;
  current: string;
  currentColor: string;
  meta: string;
  dots: { color: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div>
        <span className="text-2xl font-bold" style={{ color: currentColor }}>
          {current}
        </span>
        <p className="mt-0.5 text-sm text-muted-foreground">{meta}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dots.map((d, index) => (
          <div
            key={`${d.label}-${d.color}-${index}`}
            className="size-3.5 rounded-full"
            style={{ backgroundColor: d.color, opacity: 0.85 }}
            title={d.label}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Recent call history. Hover dots for dates.
      </p>
    </div>
  );
}

function RecentCallPanel({
  latest,
  count,
  loading,
  error,
  trendSummary,
  trendLoading,
}: {
  latest: DashboardKpiEntry | undefined;
  count: number;
  loading: boolean;
  error: string | null;
  trendSummary: string | null;
  trendLoading: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-col rounded-xl border bg-card p-4 text-card-foreground shadow">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Summary</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading call history…"
              : latest
                ? `${count} call${count === 1 ? "" : "s"} · last on ${latest.date}`
                : "No calls recorded yet"}
          </p>
        </div>
        {error && (
          <Badge variant="destructive">Unavailable</Badge>
        )}
      </div>

      {latest ? (
        trendLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Analyzing call history…
          </p>
        ) : trendSummary ? (
          <p className="text-sm leading-relaxed">{trendSummary}</p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {latest.summary || "No summary available."}
          </p>
        )
      ) : (
        <div className="flex min-h-64 flex-1 items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
          {loading
            ? "Loading your call history…"
            : "Run a call or use the mock switch to preview the dashboard with sample history."}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [actualData, setActualData] = useState<DashboardKpiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedName, setStoredName] = useState("");
  const [trendSummary, setTrendSummary] = useState<string | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadKpis() {
      const phone = storage.getPhone();
      const name = storage.getName();
      setStoredName(name);

      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/kpi/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            name,
            patientId: phone ? undefined : "mary-demo",
            limit: 60,
          }),
        });

        if (!res.ok) {
          throw new Error(`KPI history returned ${res.status}`);
        }

        const payload = (await res.json()) as DashboardKpiPayload;
        if (!ignore) setActualData(payload.rows);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unable to load KPIs");
          setActualData([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadKpis();

    return () => {
      ignore = true;
    };
  }, []);

  const data = actualData;
  const latest = data.at(-1);
  const patientName = latest?.patientName ?? (storedName || "Current patient");
  const patientDetail = "Cognitive health tracking";

  useEffect(() => {
    if (data.length === 0) {
      setTrendSummary(null);
      return;
    }
    let ignore = false;
    setTrendLoading(true);
    fetch("/api/trend-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: data, patientName }),
    })
      .then((r) => r.json())
      .then((d: { summary?: string | null }) => {
        if (!ignore) setTrendSummary(d.summary ?? null);
      })
      .catch(() => {
        if (!ignore) setTrendSummary(null);
      })
      .finally(() => {
        if (!ignore) setTrendLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [data, patientName]);
  const safetyFlagCount = data.filter((d) => d.safetyFlag).length;
  const medCurrent = latest?.medicationAdherence ?? "Not assessed";
  const moodCurrent = latest?.mood ?? "Not assessed";
  const medCurrentColor = currentColor(medColorMap, medCurrent);
  const moodCurrentColor = currentColor(moodColorMap, moodCurrent);
  const xInterval = chartInterval(data);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold">
            {patientName} - {patientDetail}
          </h1>
          <p className="text-sm text-muted-foreground">
            Last call {latest?.date ?? "not available"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {safetyFlagCount > 0 && (
            <Badge variant="destructive">
              {safetyFlagCount} safety flag{safetyFlagCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="mt-[25px] flex min-h-0 flex-1 flex-col gap-4"
      >
        <TabsList className="w-fit shrink-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Language & Memory</TabsTrigger>
          <TabsTrigger value="speech">Speech & Behavior</TabsTrigger>
          <TabsTrigger value="wellness">Wellness</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="mt-0 grid min-h-[560px] flex-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
        >
          <CognitiveDeclineChart data={data} />
          <RecentCallPanel
            latest={latest}
            count={data.length}
            loading={loading}
            error={error}
            trendSummary={trendSummary}
            trendLoading={trendLoading}
          />
        </TabsContent>

        <TabsContent
          value="memory"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
        >
          <div className="grid flex-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            <ChartCard
              title="Verbal Fluency"
              subtitle="Unique animals named in 60 s (baseline 14)"
              empty={!hasAnyValue(data, ["verbalFluency"])}
            >
              <ChartContainer config={fluencyConfig} className="h-full w-full">
                <LineChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 20]}
                    tick={chartTick}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine
                    y={BASELINES.verbalFluency}
                    stroke="var(--chart-2)"
                    strokeDasharray="4 2"
                    label={{
                      value: "baseline",
                      position: "right",
                      fontSize: 14,
                      fill: "var(--chart-2)",
                    }}
                  />
                  <ReferenceLine
                    y={BASELINES.verbalFluency * 0.8}
                    stroke="var(--chart-4)"
                    strokeDasharray="2 2"
                    label={{
                      value: "-20% alert",
                      position: "right",
                      fontSize: 14,
                      fill: "var(--chart-4)",
                    }}
                  />
                  <Line
                    connectNulls
                    dataKey="verbalFluency"
                    type="monotone"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="Story Recall"
              subtitle="Details recalled (0-10) plus speaking time when available"
              empty={
                !hasAnyValue(data, [
                  "storyRecallDetails",
                  "storyRecallSpeakingTime",
                ])
              }
            >
              <ChartContainer config={storyConfig} className="h-full w-full">
                <LineChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={chartTick} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine
                    y={BASELINES.storyRecallDetails}
                    stroke="var(--chart-2)"
                    strokeDasharray="4 2"
                  />
                  <Line
                    connectNulls
                    dataKey="storyRecallDetails"
                    type="monotone"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    connectNulls
                    dataKey="storyRecallSpeakingTime"
                    type="monotone"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="Object Naming"
              subtitle="Accuracy percent and word-finding failures"
              empty={
                !hasAnyValue(data, ["namingAccuracy", "wordFindingFailures"])
              }
            >
              <ChartContainer config={namingConfig} className="h-full w-full">
                <LineChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={chartTick} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine
                    y={BASELINES.namingAccuracy}
                    stroke="var(--chart-1)"
                    strokeDasharray="4 2"
                  />
                  <Line
                    connectNulls
                    dataKey="namingAccuracy"
                    type="monotone"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    connectNulls
                    dataKey="wordFindingFailures"
                    type="monotone"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="Word Recall"
              subtitle="Immediate and delayed recall (0-3)"
              empty={
                !hasAnyValue(data, ["immediateWordRecall", "delayedWordRecall"])
              }
            >
              <ChartContainer
                config={wordRecallConfig}
                className="h-full w-full"
              >
                <LineChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 3]}
                    ticks={[0, 1, 2, 3]}
                    tick={chartTick}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    connectNulls
                    dataKey="immediateWordRecall"
                    type="monotone"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    connectNulls
                    dataKey="delayedWordRecall"
                    type="monotone"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="Temporal Orientation"
              subtitle="Day, date, month, and year (0-4)"
              empty={!hasAnyValue(data, ["temporalOrientation"])}
            >
              <ChartContainer
                config={orientationConfig}
                className="h-full w-full"
              >
                <LineChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    tick={chartTick}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine
                    y={4}
                    stroke="var(--chart-3)"
                    strokeDasharray="4 2"
                  />
                  <Line
                    connectNulls
                    dataKey="temporalOrientation"
                    type="monotone"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent
          value="speech"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
        >
          <div className="grid flex-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            <ChartCard
              title="Stop Word Fraction"
              subtitle="Filler and function words as a proportion of speech"
              empty={!hasAnyValue(data, ["stopWordFraction"])}
            >
              <ChartContainer config={stopWordConfig} className="h-full w-full">
                <LineChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0.25, 0.55]}
                    tick={chartTick}
                    tickFormatter={(v) => v.toFixed(2)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => (v as number).toFixed(2)}
                      />
                    }
                  />
                  <ReferenceLine
                    y={BASELINES.stopWordFraction}
                    stroke="var(--chart-3)"
                    strokeDasharray="4 2"
                    label={{
                      value: "baseline",
                      position: "right",
                      fontSize: 14,
                      fill: "var(--chart-3)",
                    }}
                  />
                  <ReferenceLine
                    y={BASELINES.stopWordFraction + 0.15}
                    stroke="var(--chart-2)"
                    strokeDasharray="2 2"
                    label={{
                      value: "+15% alert",
                      position: "right",
                      fontSize: 14,
                      fill: "var(--chart-2)",
                    }}
                  />
                  <Line
                    connectNulls
                    dataKey="stopWordFraction"
                    type="monotone"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="Lexical Diversity"
              subtitle="Type-token ratio from patient speech"
              empty={!hasAnyValue(data, ["lexicalDiversity"])}
            >
              <ChartContainer config={lexicalConfig} className="h-full w-full">
                <LineChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 1]}
                    tick={chartTick}
                    tickFormatter={(v) => v.toFixed(2)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => (v as number).toFixed(2)}
                      />
                    }
                  />
                  <Line
                    connectNulls
                    dataKey="lexicalDiversity"
                    type="monotone"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="Repetition Within Call"
              subtitle="Times patient repeated a phrase or question"
              empty={!hasAnyValue(data, ["repetitionCount"])}
            >
              <ChartContainer
                config={repetitionConfig}
                className="h-full w-full"
              >
                <BarChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tick={chartTick}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine
                    y={3}
                    stroke="var(--chart-4)"
                    strokeDasharray="4 2"
                    label={{
                      value: "flag >=3",
                      position: "right",
                      fontSize: 14,
                      fill: "var(--chart-4)",
                    }}
                  />
                  <Bar
                    dataKey="repetitionCount"
                    fill="var(--chart-5)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard
              title="Speaking Time per Task"
              subtitle="Fluency and story recall windows in seconds"
              empty={
                !hasAnyValue(data, [
                  "speakingTimeFluency",
                  "speakingTimeStoryRecall",
                ])
              }
            >
              <ChartContainer
                config={speakingTimeConfig}
                className="h-full w-full"
              >
                <BarChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={chartTick} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine
                    y={BASELINES.speakingTimeFluency}
                    stroke="var(--chart-1)"
                    strokeDasharray="4 2"
                  />
                  <ReferenceLine
                    y={BASELINES.speakingTimeStoryRecall}
                    stroke="var(--chart-2)"
                    strokeDasharray="4 2"
                  />
                  <Bar
                    dataKey="speakingTimeFluency"
                    fill="var(--chart-1)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="speakingTimeStoryRecall"
                    fill="var(--chart-2)"
                    radius={[3, 3, 0, 0]}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent
          value="wellness"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
        >
          <div className="grid shrink-0 gap-4 lg:grid-cols-3">
            <StatCard
              title="Medication adherence"
              current={medCurrent}
              currentColor={medCurrentColor}
              meta="Green confirmed, yellow uncertain, red missed, gray not assessed"
              dots={data.map((d) => ({
                color: medColorMap[d.medicationAdherence] ?? "var(--muted)",
                label: `${d.date}: ${d.medicationAdherence}`,
              }))}
            />
            <StatCard
              title="Mood & affect"
              current={moodCurrent}
              currentColor={moodCurrentColor}
              meta="Green cheerful, yellow neutral, orange flat, red anxious"
              dots={data.map((d) => ({
                color: moodColorMap[d.mood] ?? "var(--muted)",
                label: `${d.date}: ${d.mood}`,
              }))}
            />
            <StatCard
              title="Safety flags"
              current={
                safetyFlagCount === 0
                  ? "None"
                  : `${safetyFlagCount} flag${safetyFlagCount > 1 ? "s" : ""}`
              }
              currentColor={
                safetyFlagCount === 0 ? "var(--chart-1)" : "var(--chart-2)"
              }
              meta="Falls, wandering, acute confusion, distress, or help requests"
              dots={data.map((d) => ({
                color: d.safetyFlag ? "var(--chart-2)" : "var(--chart-1)",
                label: `${d.date}: ${d.safetyFlag ? "Flagged" : "Clear"}`,
              }))}
            />
          </div>

          <div className="grid flex-1 gap-4 lg:grid-cols-2">
            <div className="flex min-h-72 flex-col rounded-xl border bg-card text-card-foreground shadow">
              <div className="shrink-0 p-4 pb-2">
                <h2 className="text-sm font-semibold">Daily Activity</h2>
                <p className="text-sm text-muted-foreground">
                  Demo steps and active minutes for the week
                </p>
              </div>
              <div className="min-h-0 flex-1 p-4 pt-0">
                <ChartContainer config={barConfig} className="h-full w-full">
                  <BarChart data={activityData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={chartTick}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={chartTick}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="steps"
                      fill="var(--chart-1)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="activeMin"
                      fill="var(--chart-2)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <ChartCard
              title="Call Duration"
              subtitle="Minutes per completed call when available"
              empty={!hasAnyValue(data, ["callDurationMinutes"])}
            >
              <ChartContainer
                config={{
                  callDurationMinutes: {
                    label: "Duration (min)",
                    color: "var(--chart-1)",
                  },
                }}
                className="h-full w-full"
              >
                <BarChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={chartTick}
                    interval={xInterval}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 12]}
                    tick={chartTick}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="callDurationMinutes"
                    fill="var(--chart-1)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

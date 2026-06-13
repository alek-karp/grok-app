"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DashboardKpiEntry } from "@/lib/dashboard-kpi";
import { cn } from "@/lib/utils";

const BASELINE_WINDOW = 7;
const RANGE_OPTIONS = [14, 30, 60] as const;
type Range = (typeof RANGE_OPTIONS)[number];

const config = {
  composite: { label: "Composite", color: "var(--chart-1)" },
  language: { label: "Language", color: "var(--chart-2)" },
  memory: { label: "Memory", color: "var(--chart-3)" },
  orientation: { label: "Orientation", color: "var(--chart-4)" },
} satisfies ChartConfig;

type ChartDatum = {
  date: string;
  composite: number | null;
  language: number | null;
  memory: number | null;
  orientation: number | null;
};

function average(values: Array<number | null>): number | null {
  const numeric = values.filter((value): value is number => value != null);
  if (numeric.length === 0) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function normalizeScore(value: number | null, max: number): number | null {
  if (value == null) return null;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function buildChartData(data: DashboardKpiEntry[]): ChartDatum[] {
  return data.map((d) => {
    const fluency = normalizeScore(d.verbalFluency, 20);
    const naming = d.namingAccuracy;
    const immediateRecall = normalizeScore(d.immediateWordRecall, 3);
    const delayedRecall = normalizeScore(d.delayedWordRecall, 3);
    const wordRecall = average([immediateRecall, delayedRecall]);
    const story = normalizeScore(d.storyRecallDetails, 10);
    const orient = normalizeScore(d.temporalOrientation, 4);
    const language = average([fluency, naming]);
    const memory = average([wordRecall, story]);
    const composite = average([language, memory, orient]);

    return {
      date: d.date,
      composite: composite == null ? null : Math.round(composite),
      language: language == null ? null : Math.round(language),
      memory: memory == null ? null : Math.round(memory),
      orientation: orient == null ? null : Math.round(orient),
    };
  });
}

function baselineBounds(allChartData: ChartDatum[]) {
  const baselineComposites = allChartData
    .slice(0, BASELINE_WINDOW)
    .map((d) => d.composite)
    .filter((value): value is number => value != null);

  if (baselineComposites.length === 0) return null;

  const baselineMean =
    baselineComposites.reduce((a, b) => a + b, 0) / baselineComposites.length;
  const baselineVariance =
    baselineComposites.length > 1
      ? baselineComposites.reduce((s, v) => s + (v - baselineMean) ** 2, 0) /
        (baselineComposites.length - 1)
      : 0;
  const baselineSd = Math.sqrt(baselineVariance);

  return {
    mean: Math.round(baselineMean),
    upper: Math.round(baselineMean + 2 * baselineSd),
    lower: Math.round(baselineMean - 2 * baselineSd),
  };
}

export function CognitiveDeclineChart({ data }: { data: DashboardKpiEntry[] }) {
  const [range, setRange] = useState<Range>(30);

  const allChartData = buildChartData(data);
  const chartData = allChartData.slice(-range);
  const bounds = baselineBounds(allChartData);
  const hasDomainData = allChartData.some((d) => d.composite != null);
  const baselineVisible =
    allChartData.length >= BASELINE_WINDOW &&
    chartData.some((d) => d.date === allChartData[0].date);
  const baselineLastDate = allChartData[BASELINE_WINDOW - 1]?.date;
  const monitoringFirstDate =
    allChartData[BASELINE_WINDOW]?.date ?? allChartData[0]?.date;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-4 pb-2 shrink-0 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Cognitive Decline</h2>
          <p className="text-sm text-muted-foreground">
            Assessed domains normalized 0-100. Null tasks are left as gaps.
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-2 py-1 text-sm font-medium transition-colors",
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 pt-0 flex-1 min-h-0">
        {hasDomainData ? (
          <ChartContainer config={config} className="h-full w-full">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
            >
              {baselineVisible && baselineLastDate && (
                <ReferenceArea
                  x1={chartData[0].date}
                  x2={baselineLastDate}
                  fill="hsl(var(--muted))"
                  fillOpacity={0.4}
                />
              )}
              {bounds && monitoringFirstDate && chartData.length > 0 && (
                <ReferenceArea
                  x1={monitoringFirstDate}
                  x2={chartData[chartData.length - 1].date}
                  y1={bounds.lower}
                  y2={bounds.upper}
                  fill="hsl(142 72% 29%)"
                  fillOpacity={0.12}
                />
              )}
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 14 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 14 }}
                tickFormatter={(v) => `${v}`}
              />
              {bounds && (
                <ReferenceLine
                  y={bounds.mean}
                  stroke="hsl(142 72% 29%)"
                  strokeDasharray="4 3"
                  strokeOpacity={0.7}
                />
              )}
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => `${v}`} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                connectNulls
                dataKey="language"
                type="monotone"
                stroke="var(--chart-2)"
                strokeWidth={1.5}
                dot={{ r: 3 }}
                strokeOpacity={0.7}
              />
              <Line
                connectNulls
                dataKey="memory"
                type="monotone"
                stroke="var(--chart-3)"
                strokeWidth={1.5}
                dot={{ r: 3 }}
                strokeOpacity={0.7}
              />
              <Line
                connectNulls
                dataKey="orientation"
                type="monotone"
                stroke="var(--chart-4)"
                strokeWidth={1.5}
                dot={{ r: 3 }}
                strokeOpacity={0.7}
              />
              <Line
                connectNulls
                dataKey="composite"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No assessed memory, language, or orientation tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}

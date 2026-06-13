"use client";

import { useState } from "react";
import { kpiData } from "@/lib/mock-kpi-data";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis,
  ReferenceLine, ReferenceArea,
} from "recharts";

const BASELINE_WINDOW = 7;
const RANGE_OPTIONS = [14, 30, 60] as const;
type Range = typeof RANGE_OPTIONS[number];

const allChartData = kpiData.map((d) => {
  const fluency   = (d.verbalFluency / 20) * 100;
  const naming    = d.namingAccuracy;
  const recall    = ((d.immediateWordRecall + d.delayedWordRecall) / 6) * 100;
  const story     = (d.storyRecallDetails / 10) * 100;
  const orient    = (d.temporalOrientation / 4) * 100;

  return {
    date:        d.date,
    composite:   Math.round((fluency + naming + recall + story + orient) / 5),
    language:    Math.round((fluency + naming) / 2),
    memory:      Math.round((recall + story) / 2),
    orientation: Math.round(orient),
  };
});

const baselineComposites = allChartData.slice(0, BASELINE_WINDOW).map((d) => d.composite);
const baselineMean = baselineComposites.reduce((a, b) => a + b, 0) / baselineComposites.length;
const baselineVariance = baselineComposites.reduce((s, v) => s + (v - baselineMean) ** 2, 0) / (baselineComposites.length - 1);
const baselineSd = Math.sqrt(baselineVariance);
const sdUpper = Math.round(baselineMean + 2 * baselineSd);
const sdLower = Math.round(baselineMean - 2 * baselineSd);

const config = {
  composite:   { label: "Composite",   color: "var(--chart-1)" },
  language:    { label: "Language",    color: "var(--chart-2)" },
  memory:      { label: "Memory",      color: "var(--chart-3)" },
  orientation: { label: "Orientation", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function CognitiveDeclineChart() {
  const [range, setRange] = useState<Range>(30);

  const chartData = allChartData.slice(-range);
  const baselineVisible = chartData.some((d) => d.date === allChartData[0].date);
  const baselineLastDate = allChartData[BASELINE_WINDOW - 1].date;
  const monitoringFirstDate = allChartData[BASELINE_WINDOW].date;

  return (
    <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow flex-1 min-h-0">
      <div className="p-4 pb-2 shrink-0 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Cognitive Decline</h2>
          <p className="text-sm text-muted-foreground">
            All domains normalised 0–100 · green band = personal baseline ±2σ (composite)
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 pt-0 flex-1 min-h-0">
        <ChartContainer config={config} className="h-full w-full">
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            {baselineVisible && (
              <ReferenceArea x1={chartData[0].date} x2={baselineLastDate} fill="hsl(var(--muted))" fillOpacity={0.4} />
            )}
            <ReferenceArea
              x1={monitoringFirstDate}
              x2={chartData[chartData.length - 1].date}
              y1={sdLower}
              y2={sdUpper}
              fill="hsl(142 72% 29%)"
              fillOpacity={0.12}
            />
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
            <ReferenceLine y={Math.round(baselineMean)} stroke="hsl(142 72% 29%)" strokeDasharray="4 3" strokeOpacity={0.7} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}`} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="language"    type="monotone" stroke="var(--chart-2)" strokeWidth={1.5} dot={{ r: 3 }} strokeOpacity={0.7} />
            <Line dataKey="memory"      type="monotone" stroke="var(--chart-3)" strokeWidth={1.5} dot={{ r: 3 }} strokeOpacity={0.7} />
            <Line dataKey="orientation" type="monotone" stroke="var(--chart-4)" strokeWidth={1.5} dot={{ r: 3 }} strokeOpacity={0.7} />
            <Line dataKey="composite"   type="monotone" stroke="var(--chart-1)" strokeWidth={3}   dot={{ r: 4 }} />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}

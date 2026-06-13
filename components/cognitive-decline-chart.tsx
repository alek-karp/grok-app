"use client";

import { kpiData } from "@/lib/mock-kpi-data";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis,
  ReferenceLine, ReferenceArea,
} from "recharts";

const chartData = kpiData.map((d) => {
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

const config = {
  composite:   { label: "Composite",   color: "var(--chart-1)" },
  language:    { label: "Language",    color: "var(--chart-2)" },
  memory:      { label: "Memory",      color: "var(--chart-3)" },
  orientation: { label: "Orientation", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function CognitiveDeclineChart() {
  return (
    <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow flex-1 min-h-0">
      <div className="p-4 pb-2 shrink-0">
        <h2 className="text-sm font-semibold">Cognitive Decline</h2>
        <p className="text-xs text-muted-foreground">
          All domains normalised 0–100 · shading marks mild (yellow) and significant (red) decline zones
        </p>
      </div>
      <div className="p-4 pt-0 flex-1 min-h-0">
        <ChartContainer config={config} className="h-full w-full">
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <ReferenceArea y1={0}  y2={50} fill="var(--destructive)" fillOpacity={0.06} />
            <ReferenceArea y1={50} y2={70} fill="var(--chart-3)"    fillOpacity={0.06} />
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
            <ReferenceLine y={70} stroke="var(--chart-3)"    strokeDasharray="4 2" strokeOpacity={0.5} />
            <ReferenceLine y={50} stroke="var(--destructive)" strokeDasharray="4 2" strokeOpacity={0.5} />
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

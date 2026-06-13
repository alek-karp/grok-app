import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import type { DashboardKpiEntry } from "@/lib/dashboard-kpi";

export const dynamic = "force-dynamic";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-4.3";

function loadKnowledge(): string {
  try {
    return readFileSync(join(process.cwd(), "KNOWLEDGE.md"), "utf-8");
  } catch {
    return "";
  }
}

const KNOWLEDGE = loadKnowledge();

const SYSTEM_PROMPT = `You are a caring assistant helping family caregivers understand how their loved one with dementia is doing. You receive a summary of recent check-in calls and write a short, warm, plain-English update.

Rules:
- Write 2-4 sentences. No bullet points, no headers, no jargon.
- Speak plainly as if talking to a worried family member — not a doctor.
- Mention whether things seem stable, improving, or declining compared to earlier calls.
- Note the most recent call's mood and any concerns worth watching.
- If there are safety flags, mention them gently but clearly.
- Never use clinical terms like "verbal fluency score" or "temporal orientation" — say "naming animals" or "knowing today's date" instead.
- End on a human note when the data allows it.
- Ground your observations in the clinical research context below when relevant, but never quote studies directly — use the research only to inform your framing.

<research_context>
${KNOWLEDGE}
</research_context>`;

function buildDigest(rows: DashboardKpiEntry[], patientName: string): string {
  if (rows.length === 0) return "No call data available.";

  const latest = rows.at(-1)!;
  const earliest = rows[0];
  const callCount = rows.length;

  const trendNote = (
    key: keyof DashboardKpiEntry,
    label: string,
    higherIsBetter = true,
  ): string => {
    const first =
      typeof earliest[key] === "number" ? (earliest[key] as number) : null;
    const last =
      typeof latest[key] === "number" ? (latest[key] as number) : null;
    if (first == null || last == null) return "";
    const diff = last - first;
    if (Math.abs(diff) < 0.5) return `${label}: stable`;
    const direction =
      (diff > 0) === higherIsBetter ? "slightly improved" : "slightly declined";
    return `${label}: ${direction} (${first} → ${last})`;
  };

  const trends = [
    trendNote("verbalFluency", "animal naming game"),
    trendNote("immediateWordRecall", "remembering words right away"),
    trendNote("delayedWordRecall", "recalling words later"),
    trendNote("temporalOrientation", "knowing today's date", true),
    trendNote("wordFindingFailures", "trouble finding words", false),
    trendNote("repetitionCount", "repeating things in one call", false),
  ]
    .filter(Boolean)
    .join("; ");

  const safetyFlags = rows.filter((r) => r.safetyFlag).length;
  const recentMoods = rows
    .slice(-5)
    .map((r) => r.mood)
    .filter((m) => m !== "Not assessed");

  const lines = [
    `Patient: ${patientName}`,
    `Calls reviewed: ${callCount} (from ${earliest.date} to ${latest.date})`,
    `Most recent call: ${latest.date}`,
    `Mood on last call: ${latest.mood}`,
    `Medication on last call: ${latest.medicationAdherence}`,
    latest.safetyFlag
      ? `SAFETY FLAG on last call: ${latest.safetyFlagType ?? "yes"}`
      : "No safety flag on last call",
    safetyFlags > 0
      ? `Total safety flags across all calls: ${safetyFlags}`
      : "No safety flags across any call",
    recentMoods.length > 0
      ? `Recent moods (last 5 calls): ${recentMoods.join(", ")}`
      : "",
    trends ? `Cognitive trends: ${trends}` : "",
    latest.summary ? `Last call summary: ${latest.summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return lines;
}

export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "XAI_API_KEY not configured" }, { status: 500 });
  }

  let body: { rows?: DashboardKpiEntry[]; patientName?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = body.rows ?? [];
  const patientName = body.patientName ?? "your loved one";

  if (rows.length === 0) {
    return NextResponse.json({ summary: null });
  }

  const digest = buildDigest(rows, patientName);

  const res = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: digest },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[trend-summary] xAI error:", res.status, await res.text());
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const summary = data.choices?.[0]?.message?.content?.trim() ?? null;

  return NextResponse.json({ summary });
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-4.3";

const SYSTEM_PROMPT = `You are a warm, caring assistant helping a family caregiver understand their loved one's health monitoring charts. You have access to the full call history data for the current dashboard tab — use it to give specific, accurate answers.

Rules:
- Analyze the actual data you've been given. Reference specific dates, values, and changes when relevant.
- Use plain, everyday language. No clinical jargon.
- Translate metric names into plain speech: "verbal fluency" → "the animal-naming test", "temporal orientation" → "knowing today's date", "lexical diversity" → "variety of words used", "stop-word fraction" → "filler word usage".
- Be concise — 2–6 sentences unless the caregiver asks for detail.
- Never alarm unnecessarily, but be honest about concerning trends or specific drops you can see in the data.
- If you spot something notable in the data the caregiver didn't ask about (e.g., a sudden drop on a specific date), mention it briefly.
- If asked something not in the data, say so gently.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  let body: {
    messages?: ChatMessage[];
    context?: string;
    patientName?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const context = body.context ?? "";
  const patientName = body.patientName ?? "your loved one";

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const systemMessages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (context) {
    systemMessages.push({
      role: "system",
      content: `Current chart context for ${patientName}:\n${context}`,
    });
  }

  const res = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      messages: [
        ...systemMessages,
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    console.error("[dashboard-chat] xAI error:", res.status, await res.text());
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data.choices?.[0]?.message?.content?.trim() ?? "";

  return NextResponse.json({ reply });
}

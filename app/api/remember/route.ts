import { NextResponse } from "next/server";
import { rememberAboutPatient } from "@/lib/memory/supermemory";
import { DEMO_PATIENT } from "@/lib/voice/patient-profile";

export const dynamic = "force-dynamic";

type Turn = { role: "user" | "assistant"; text: string };

/**
 * Stores a finished call's transcript into the patient's long-term memory.
 * Supermemory extracts atomic memories from the text automatically, so we just
 * hand it a clean, labelled transcript. No-op when memory is disabled.
 *
 * Body: { patientId?: string, turns: { role, text }[] }
 */
export async function POST(request: Request) {
  let patientId = DEMO_PATIENT.id;
  let turns: Turn[] = [];

  try {
    const body = await request.json();
    if (body?.patientId) patientId = String(body.patientId);
    if (Array.isArray(body?.turns)) turns = body.turns as Turn[];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only store if the patient actually said something — skip empty / one-sided
  // calls so we don't pollute memory with greetings that went nowhere.
  const patientSpoke = turns.some(
    (t) => t.role === "user" && t.text.trim().length > 0,
  );
  if (!patientSpoke) {
    return NextResponse.json({ stored: false, reason: "no patient speech" });
  }

  const name = DEMO_PATIENT.preferredName;
  const companion = DEMO_PATIENT.companionName;
  const date = new Date().toISOString().slice(0, 10);

  const transcript = turns
    .filter((t) => t.text.trim())
    .map((t) => `${t.role === "user" ? name : companion}: ${t.text.trim()}`)
    .join("\n");

  const content = `Daily check-in call with ${name} on ${date}.\n\n${transcript}`;

  const result = await rememberAboutPatient(patientId, content, {
    kind: "call_transcript",
    date,
  });

  return NextResponse.json(result);
}

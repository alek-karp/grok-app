import { NextResponse } from "next/server";
import { rememberAboutPatient } from "@/lib/memory/supermemory";
import { resolvePatientProfile } from "@/lib/voice/resolve-patient";

export const dynamic = "force-dynamic";

type Turn = { role: "user" | "assistant"; text: string };

/**
 * Stores a finished call's transcript into the patient's long-term memory.
 * Supermemory extracts atomic memories from the text automatically, so we just
 * hand it a clean, labelled transcript. No-op when memory is disabled.
 *
 * Body: { phone?: string, patientId?: string, name?: string, turns: { role, text }[] }
 */
export async function POST(request: Request) {
  let body: {
    phone?: string;
    patientId?: string;
    name?: string;
    turns?: Turn[];
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const turns: Turn[] = Array.isArray(body.turns) ? body.turns : [];

  // Only store if the patient actually said something — skip empty / one-sided
  // calls so we don't pollute memory with greetings that went nowhere.
  const patientSpoke = turns.some(
    (t) => t.role === "user" && t.text.trim().length > 0,
  );
  if (!patientSpoke) {
    return NextResponse.json({ stored: false, reason: "no patient speech" });
  }

  // Resolve the real patient (DB-backed name + stable memory id).
  const patient = await resolvePatientProfile(body);
  const name = patient.preferredName;
  const companion = patient.companionName;
  const date = new Date().toISOString().slice(0, 10);

  const transcript = turns
    .filter((t) => t.text.trim())
    .map((t) => `${t.role === "user" ? name : companion}: ${t.text.trim()}`)
    .join("\n");

  const content = `Daily check-in call with ${name} on ${date}.\n\n${transcript}`;

  const result = await rememberAboutPatient(patient.id, content, {
    kind: "call_transcript",
    date,
  });

  return NextResponse.json(result);
}

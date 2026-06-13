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

  // Frame the transcript so memory extraction captures the longitudinal
  // cognitive picture (word-finding, recall, orientation, mood) as well as the
  // life details — this is what lets us "slowly learn" how they're tracking.
  const content = [
    `Daily check-in call between ${companion} and ${name} on ${date}.`,
    ``,
    `Remember both: (a) life details ${name} shares (people, events, feelings, routine), and (b) observations about how ${name} is doing cognitively in this call — any word-finding difficulty or substitutions, what they did and didn't recall (including anything ${companion} asked them to hold onto), their orientation to day/time/place, and their mood and energy. Note these factually and gently for tracking changes over time.`,
    ``,
    `Transcript:`,
    transcript,
  ].join("\n");

  const result = await rememberAboutPatient(patient.id, content, {
    kind: "call_transcript",
    date,
  });

  return NextResponse.json(result);
}

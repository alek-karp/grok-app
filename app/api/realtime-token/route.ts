import { NextResponse } from "next/server";
import { recallAboutPatient } from "@/lib/memory/supermemory";
import { buildCallInstructions } from "@/lib/voice/call-flow";
import { DEMO_PATIENT } from "@/lib/voice/patient-profile";

// Always run at request time — we never want to cache a short-lived token.
export const dynamic = "force-dynamic";

/**
 * Starts a call: mints a short-lived xAI ephemeral token AND builds the
 * memory-personalized system instructions — both server-side so neither the
 * xAI key nor the supermemory key ever reaches the browser.
 *
 * Returns: { value, expires_at, instructions, memoriesRecalled }
 *
 * Docs: https://docs.x.ai/developers/model-capabilities/audio/ephemeral-tokens
 */
export async function POST(request: Request) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 },
    );
  }

  // For the demo we only have one patient; a real app would resolve this from
  // the authenticated user.
  let patientId = DEMO_PATIENT.id;
  try {
    const body = await request.json();
    if (body?.patientId) patientId = String(body.patientId);
  } catch {
    // No body is fine — fall back to the demo patient.
  }

  // Recall what we learned in previous calls. No-op (returns []) when memory is
  // disabled, so this stays safe either way.
  const hits = await recallAboutPatient(
    patientId,
    `Recent life, family, health, mood, routine, and anything ${DEMO_PATIENT.preferredName} shared in past calls`,
    8,
  );
  const memories = hits.map((h) => h.memory);
  const instructions = buildCallInstructions(DEMO_PATIENT, memories);

  const res = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Token lifetime. Plenty for a single conversation; client reconnects mint a new one.
      expires_after: { seconds: 600 },
      // Bind the session model to the secret.
      session: { model: "grok-voice-think-fast-1.1" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: "Failed to mint ephemeral token", detail },
      { status: res.status },
    );
  }

  // Shape from xAI: { value: string, expires_at: number }
  const data = (await res.json()) as { value: string; expires_at: number };
  return NextResponse.json({
    value: data.value,
    expires_at: data.expires_at,
    instructions,
    memoriesRecalled: memories.length,
  });
}

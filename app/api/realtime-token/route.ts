import { NextResponse } from "next/server";

// Always run at request time — we never want to cache a short-lived token.
export const dynamic = "force-dynamic";

/**
 * Mints a short-lived xAI ephemeral token for the browser to authenticate the
 * Voice Agent WebSocket. The real API key stays on the server and is never sent
 * to the client.
 *
 * Docs: https://docs.x.ai/developers/model-capabilities/audio/ephemeral-tokens
 */
export async function POST() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 },
    );
  }

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

  // Shape: { value: string, expires_at: number }
  const data = await res.json();
  return NextResponse.json(data);
}

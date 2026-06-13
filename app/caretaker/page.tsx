"use client";

import { EarOff, Send, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

const SUGGESTIONS = [
  "Gently ask if they took their medication",
  "Ask about their family",
  "Check what day they think it is",
  "Ask how they slept",
  "Steer toward something happy they enjoy",
  "Start gently wrapping up the call",
];

type SentNote = { id: string; text: string; live: boolean; at: number };

export default function CaretakerPage() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SentNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const connected = phone.trim().length > 3;

  async function send(note: string) {
    const value = note.trim();
    if (!value || !connected) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, text: value }),
      });
      const data = (await res.json()) as { live?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSent((prev) => [
        { id: crypto.randomUUID(), text: value, live: !!data.live, at: Date.now() },
        ...prev,
      ]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-3.5rem)] w-full min-h-0 max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <EarOff className="size-5 text-amber-600" />
          <h1 className="text-2xl font-semibold tracking-tight">Caretaker</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Quietly guide the conversation. Your suggestions steer the assistant’s
          next reply — the person on the call never hears them or knows you’re
          here.
        </p>
      </header>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">
        <label className="text-xs font-medium text-muted-foreground">
          Who are you guiding?
        </label>
        <PhoneInput value={phone.replace(/^\+1/, "")} onChange={setPhone} />
        <Input
          placeholder="Their name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md"
        />
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          {connected ? (
            <>
              <Wifi className="size-3.5 text-green-600" /> Ready to guide
            </>
          ) : (
            <>
              <WifiOff className="size-3.5" /> Enter their phone number to begin
            </>
          )}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={!connected || sending}
            onClick={() => send(s)}
            className="rounded-full border border-amber-500/40 bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-amber-500/10 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={text}
          disabled={!connected || sending}
          placeholder="Whisper a suggestion…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(text);
          }}
          className="rounded-md"
        />
        <Button
          onClick={() => send(text)}
          disabled={!connected || sending || !text.trim()}
        >
          <Send className="size-4" />
          Send
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3">
        {sent.length === 0 ? (
          <p className="m-auto text-xs text-muted-foreground">
            Notes you send will appear here.
          </p>
        ) : (
          sent.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="flex-1 text-sm">{n.text}</span>
              <Badge variant={n.live ? "default" : "outline"}>
                {n.live ? "delivered" : "no live call"}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { Loader2, Mic, PhoneOff, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type TranscriptEntry,
  useGrokVoice,
  type VoiceStatus,
} from "./use-grok-voice";

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  listening: "Listening",
  speaking: "Cora is speaking",
  error: "Error",
};

const STATUS_VARIANT: Record<
  VoiceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  idle: "outline",
  connecting: "secondary",
  listening: "default",
  speaking: "secondary",
  error: "destructive",
};

/**
 * Reveals `target` gradually, like live typing. As more transcript arrives the
 * target grows and the reveal keeps pace — catching up fast when far behind so
 * it never lags noticeably behind the speaker.
 */
function useTypewriter(target: string): string {
  const [count, setCount] = useState(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  // Snap back if the target shrank (e.g. a fresh, shorter turn).
  useEffect(() => {
    setCount((c) => Math.min(c, target.length));
  }, [target]);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        const len = targetRef.current.length;
        if (c >= len) return c;
        const step = Math.max(1, Math.ceil((len - c) / 8));
        return Math.min(len, c + step);
      });
    }, 28);
    return () => clearInterval(id);
  }, []);

  return target.slice(0, count);
}

function TypewriterText({ text }: { text: string }) {
  const shown = useTypewriter(text);
  return (
    <>
      {shown}
      {shown.length < text.length ? (
        <span className="ml-0.5 animate-pulse opacity-60">▍</span>
      ) : null}
    </>
  );
}

function MessageBubble({ entry }: { entry: TranscriptEntry }) {
  const isUser = entry.role === "user";
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <span className="px-1 text-xs text-muted-foreground">
        {isUser ? "You" : "Cora"}
      </span>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background",
          !entry.final && "opacity-90",
        )}
      >
        {isUser ? (
          entry.text ? (
            <TypewriterText text={entry.text} />
          ) : (
            "…"
          )
        ) : (
          entry.text || "…"
        )}
      </div>
    </div>
  );
}

export default function PhonePage() {
  const { status, error, transcript, toolActivity, connect, disconnect } =
    useGrokVoice();
  const isLive = status === "listening" || status === "speaking";

  return (
    <div className="mx-auto flex h-[calc(100svh-3.5rem)] w-full min-h-0 max-w-2xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Phone</h1>
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          A continuous voice conversation with Cora. Speak naturally — she waits
          until you’ve finished before replying, and you can talk over her to
          interrupt. Use headphones for the cleanest experience.
        </p>
      </header>

      <div className="flex items-center gap-3">
        {!isLive ? (
          <Button
            size="lg"
            onClick={connect}
            disabled={status === "connecting"}
          >
            {status === "connecting" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Mic />
            )}
            {status === "connecting" ? "Connecting" : "Start call"}
          </Button>
        ) : (
          <Button size="lg" variant="destructive" onClick={disconnect}>
            <PhoneOff />
            End call
          </Button>
        )}

        {toolActivity ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Wrench className="size-3.5 animate-pulse" />
            {toolActivity}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Conversation className="min-h-0 flex-1 rounded-xl border border-border bg-muted/30">
        <ConversationContent className="gap-3">
          {transcript.length === 0 ? (
            <p className="m-auto text-sm text-muted-foreground">
              {isLive
                ? "Say hello to get started…"
                : "Transcript will appear here once the call starts."}
            </p>
          ) : (
            transcript.map((entry) => (
              <MessageBubble key={entry.id} entry={entry} />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <p className="text-xs text-muted-foreground">
        Proof-of-concept demo, not a medical device.
      </p>
    </div>
  );
}

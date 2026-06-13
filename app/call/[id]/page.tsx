"use client";

import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  Mic,
  PhoneOff,
  Wrench,
} from "lucide-react";
import { useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Persona } from "@/components/ai-elements/persona";
import type { PersonaState } from "@/components/ai-elements/persona";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type DebugEvent,
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

const VOICE_TO_PERSONA: Record<VoiceStatus, PersonaState> = {
  idle: "idle",
  connecting: "thinking",
  listening: "listening",
  speaking: "speaking",
  error: "idle",
};

function useTypewriter(target: string): string {
  const countRef = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    if (countRef.current > target.length) countRef.current = target.length;
  }, [target]);

  // We drive typewriter via a ref so it doesn't need state — callers that need
  // re-renders can wrap in their own state if needed. For simplicity here we
  // keep the simple useState approach.
  return target; // instant — persona is the visual focus, not text animation
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
          !entry.final && "opacity-70",
        )}
      >
        {entry.text || "…"}
      </div>
    </div>
  );
}

function shortTime(at: number): string {
  return new Date(at).toLocaleTimeString([], {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });
}

function KpiResult({ result }: { result: unknown }) {
  const r = (result ?? {}) as Record<string, unknown>;
  const fields: Array<[string, string]> = [];
  const add = (label: string, v: unknown) => {
    if (v !== null && v !== undefined && v !== "")
      fields.push([label, String(v)]);
  };
  add("mood", r.mood);
  add("sleep", r.sleep_quality);
  add("fluency", r.fluency_count);
  add("naming", r.naming_accuracy);
  add("word-find fails", r.word_finding_failures);
  add("immediate recall", r.immediate_recall);
  add("delayed words", r.delayed_recall_words);
  add("story details", r.story_recall_details);
  add("orientation", r.orientation_score);
  add("stop-word frac", r.stop_word_fraction);
  add("lexical div", r.lexical_diversity);
  add("repetition", r.repetition_count);
  add("medication", r.medication_status);
  add("x-session recall", r.cross_session_recall);
  add("safety", r.safety_flag);

  const observations = Array.isArray(r.observations_json)
    ? (r.observations_json as string[])
    : [];

  return (
    <div className="flex flex-col gap-2">
      {r.summary ? (
        <p className="text-xs text-foreground">{String(r.summary)}</p>
      ) : null}
      <div className="flex flex-wrap gap-1">
        {fields.map(([label, value]) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
          </span>
        ))}
      </div>
      {observations.length > 0 ? (
        <ul className="ml-1 list-disc pl-4 text-[11px] text-muted-foreground">
          {observations.map((o) => <li key={o}>{o}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

function DebugEventRow({ event }: { event: DebugEvent }) {
  if (event.kind === "tool") {
    const memories =
      event.result && typeof event.result === "object"
        ? ((event.result as { memories?: string[] }).memories ?? null)
        : null;
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <Wrench className="size-3.5 text-muted-foreground" />
          <span className="font-mono font-semibold">{event.name}</span>
          <span className="font-mono text-muted-foreground">
            {JSON.stringify(event.args)}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {event.status === "running" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              shortTime(event.at)
            )}
          </span>
        </div>
        {event.status !== "running" ? (
          memories ? (
            memories.length > 0 ? (
              <ul className="ml-1 list-disc pl-4 text-[11px] text-muted-foreground">
                {memories.map((m) => <li key={m}>{m}</li>)}
              </ul>
            ) : (
              <p className="pl-5 text-[11px] text-muted-foreground italic">
                no memories found
              </p>
            )
          ) : (
            <pre className="overflow-x-auto pl-5 text-[11px] text-muted-foreground">
              {JSON.stringify(event.result)}
            </pre>
          )
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-background px-3 py-2">
      <div className="flex items-center gap-2 text-xs">
        <BrainCircuit className="size-3.5 text-muted-foreground" />
        <span className="font-semibold">KPI extraction</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          {event.status === "extracting" ? (
            <><Loader2 className="size-3.5 animate-spin" /> extracting…</>
          ) : event.status === "done" ? (
            <><CheckCircle2 className="size-3.5 text-green-600" /> done</>
          ) : (
            "timed out"
          )}
        </span>
      </div>
      {event.status === "done" ? <KpiResult result={event.result} /> : null}
      {event.status === "timeout" ? (
        <p className="text-[11px] text-muted-foreground">
          No KPI row appeared in time (extraction may still be processing).
        </p>
      ) : null}
    </div>
  );
}

function TranscriptPanel({ transcript, isLive }: { transcript: TranscriptEntry[]; isLive: boolean }) {
  return (
    <div className="hidden md:flex min-h-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Transcript</p>
      <Conversation className="min-h-0 flex-1 rounded-xl border border-border bg-muted/30">
        <ConversationContent className="gap-3">
          {transcript.length === 0 ? (
            <p className="m-auto text-sm text-muted-foreground">
              {isLive ? "Listening…" : "Start a call to begin."}
            </p>
          ) : (
            transcript.map((entry) => (
              <MessageBubble key={entry.id} entry={entry} />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}

function DebugPanel({ events }: { events: DebugEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [events]);

  return (
    <div className="hidden md:flex min-h-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Debug</p>
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-muted/20">
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3"
        >
          {events.length === 0 ? (
            <p className="m-auto text-xs text-muted-foreground">
              Tool calls and KPI extraction will appear here.
            </p>
          ) : (
            events.map((e) => <DebugEventRow key={e.id} event={e} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function CallPage() {
  const { status, error, transcript, toolActivity, debugEvents, connect, disconnect } =
    useGrokVoice();
  const isLive = status === "listening" || status === "speaking";

  return (
    <div className="h-[calc(100svh-3.5rem)] grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6">
      {/* Left: transcript */}
      <TranscriptPanel transcript={transcript} isLive={isLive} />

      {/* Center: persona + controls */}
      <div className="flex flex-col items-center justify-center gap-6">
        <Persona
          className="size-48 md:size-64"
          state={VOICE_TO_PERSONA[status]}
          variant="halo"
        />

        <div className="flex flex-col items-center gap-3">
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

          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>

          {toolActivity ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Wrench className="size-3.5 animate-pulse" />
              {toolActivity}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-xs text-center">
            {error}
          </div>
        ) : null}
      </div>

      {/* Right: debug */}
      <DebugPanel events={debugEvents} />
    </div>
  );
}

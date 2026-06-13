"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildCallInstructions } from "@/lib/voice/call-flow";
import { DEMO_PATIENT } from "@/lib/voice/patient-profile";
import { base64PCM16ToInt16, float32ToBase64PCM16 } from "@/lib/voice/pcm";
import { PCMPlayer } from "@/lib/voice/player";
import { runClientTool, voiceTools } from "@/lib/voice/tools";

const SAMPLE_RATE = 24000;
const MODEL = "grok-voice-think-fast-1.1";
const REALTIME_URL = `wss://api.x.ai/v1/realtime?model=${MODEL}`;

// The Memento daily check-in call flow, personalized to the demo patient.
const SYSTEM_INSTRUCTIONS = buildCallInstructions(DEMO_PATIENT);

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

export type TranscriptEntry = {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
};

type ServerEvent = {
  type: string;
  [key: string]: unknown;
};

export function useGrokVoice() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [toolActivity, setToolActivity] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Streaming-transcript accumulators.
  const assistantTextRef = useRef("");
  // Pending async tool executions for the current response turn.
  const pendingToolsRef = useRef<Promise<void>[]>([]);
  // True while the assistant is producing a response. We use this to decide
  // when a user's turn is truly finished: their bubble is only finalized once
  // the assistant starts replying, so mid-sentence pauses don't split it.
  const speakingRef = useRef(false);
  // The user's current turn, accumulated across VAD segments so brief pauses
  // don't spawn multiple bubbles. `userSegmentsRef` holds completed segments;
  // `userLiveRef` holds the in-progress (cumulative) segment.
  const userSegmentsRef = useRef<string[]>([]);
  const userLiveRef = useRef("");

  const upsertStreaming = useCallback(
    (role: "user" | "assistant", text: string) => {
      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === role && !last.final) {
          const next = prev.slice(0, -1);
          next.push({ ...last, text });
          return next;
        }
        return [
          ...prev,
          { id: crypto.randomUUID(), role, text, final: false },
        ];
      });
    },
    [],
  );

  const finalizeStreaming = useCallback(
    (role: "user" | "assistant", text?: string) => {
      setTranscript((prev) => {
        const idx = [...prev]
          .reverse()
          .findIndex((m) => m.role === role && !m.final);
        if (idx === -1) {
          if (text && text.trim()) {
            return [
              ...prev,
              { id: crypto.randomUUID(), role, text, final: true },
            ];
          }
          return prev;
        }
        const realIdx = prev.length - 1 - idx;
        const next = [...prev];
        next[realIdx] = {
          ...next[realIdx],
          text: text ?? next[realIdx].text,
          final: true,
        };
        return next;
      });
    },
    [],
  );

  // The full text of the user's current turn (completed segments + live one).
  const renderUserTurn = useCallback(
    () =>
      [...userSegmentsRef.current, userLiveRef.current]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" "),
    [],
  );

  // Lock in the user's turn as a single finalized bubble and reset the
  // accumulators for the next turn.
  const finalizeUserTurn = useCallback(() => {
    const text = renderUserTurn();
    userSegmentsRef.current = [];
    userLiveRef.current = "";
    if (text) finalizeStreaming("user", text);
  }, [finalizeStreaming, renderUserTurn]);

  const send = useCallback((message: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, []);

  const handleFunctionCall = useCallback(
    async (event: ServerEvent) => {
      const name = String(event.name ?? "");
      const callId = String(event.call_id ?? "");
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(String(event.arguments ?? "{}"));
      } catch {
        args = {};
      }

      setToolActivity(`Calling ${name}…`);
      let result: unknown;
      try {
        result = await runClientTool(name, args);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
      }
      setToolActivity(null);

      // Return the tool result to the model.
      send({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      });
    },
    [send],
  );

  const handleEvent = useCallback(
    async (event: ServerEvent) => {
      switch (event.type) {
        case "error": {
          const err = (event.error as { message?: string })?.message;
          // Most realtime errors are recoverable; surface but keep the session.
          console.error("[grok-voice] error event:", event.error ?? event);
          if (err) setError(err);
          break;
        }

        case "input_audio_buffer.speech_started": {
          // Barge-in: user started talking, stop assistant playback instantly
          // and reopen the user's turn.
          playerRef.current?.clear();
          speakingRef.current = false;
          assistantTextRef.current = "";
          setStatus("listening");
          break;
        }

        case "conversation.item.input_audio_transcription.updated": {
          // Live partial transcript for the current segment. Ignore anything
          // arriving after the assistant has already started replying.
          if (speakingRef.current) break;
          userLiveRef.current = String(event.transcript ?? "");
          upsertStreaming("user", renderUserTurn());
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          // A segment finished (VAD detected a pause). Roll it into the turn
          // but DON'T finalize the bubble — the user may still be talking.
          if (speakingRef.current) break;
          const segment = String(event.transcript ?? "").trim();
          if (segment) userSegmentsRef.current.push(segment);
          userLiveRef.current = "";
          upsertStreaming("user", renderUserTurn());
          break;
        }

        case "response.output_audio.delta": {
          const delta = event.delta as string | undefined;
          if (delta) {
            // First sign the assistant is replying: the user's turn is over.
            if (!speakingRef.current) {
              speakingRef.current = true;
              finalizeUserTurn();
            }
            setStatus("speaking");
            playerRef.current?.enqueue(base64PCM16ToInt16(delta));
          }
          break;
        }

        case "response.output_audio_transcript.delta": {
          if (!speakingRef.current) {
            speakingRef.current = true;
            finalizeUserTurn();
          }
          assistantTextRef.current += String(event.delta ?? "");
          upsertStreaming("assistant", assistantTextRef.current);
          break;
        }

        case "response.output_audio_transcript.done": {
          finalizeStreaming(
            "assistant",
            String(event.transcript ?? assistantTextRef.current),
          );
          assistantTextRef.current = "";
          break;
        }

        case "response.function_call_arguments.done": {
          // Execute the tool; collect the promise so we can await it before
          // asking the model to continue.
          pendingToolsRef.current.push(handleFunctionCall(event));
          break;
        }

        case "response.done": {
          // The assistant finished; ready for the next user turn.
          speakingRef.current = false;
          // If this turn invoked tools, wait for all of them to finish and for
          // current audio to drain, then ask the model to continue. This avoids
          // overlapping audio between the spoken turn and the tool follow-up.
          const pending = pendingToolsRef.current;
          if (pending.length > 0) {
            pendingToolsRef.current = [];
            await Promise.allSettled(pending);
            await playerRef.current?.waitUntilDone();
            send({ type: "response.create" });
          } else {
            setStatus("listening");
          }
          break;
        }

        default:
          break;
      }
    },
    [
      finalizeStreaming,
      finalizeUserTurn,
      handleFunctionCall,
      renderUserTurn,
      send,
      upsertStreaming,
    ],
  );

  const disconnect = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    playerRef.current?.clear();
    playerRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    assistantTextRef.current = "";
    pendingToolsRef.current = [];
    speakingRef.current = false;
    userSegmentsRef.current = [];
    userLiveRef.current = "";
    setToolActivity(null);
    setStatus("idle");
  }, []);

  const connect = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;
    setError(null);
    setTranscript([]);
    setStatus("connecting");

    try {
      // 1. Mint an ephemeral token from our server.
      const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to get realtime token");
      }
      const { value: token } = (await tokenRes.json()) as { value: string };

      // 2. Set up audio (single context for capture + playback at 24kHz).
      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      await audioCtx.resume();
      audioCtxRef.current = audioCtx;
      playerRef.current = new PCMPlayer(audioCtx, SAMPLE_RATE);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: float32ToBase64PCM16(input),
          }),
        );
      };
      source.connect(processor);
      // Output buffer is left silent; connecting to destination keeps the
      // processor firing in Chromium.
      processor.connect(audioCtx.destination);

      // 3. Open the realtime WebSocket. Browsers can't set headers, so the
      // ephemeral token rides in the subprotocol with the required prefix.
      const ws = new WebSocket(REALTIME_URL, [`xai-client-secret.${token}`]);
      wsRef.current = ws;

      ws.onopen = () => {
        send({
          type: "session.update",
          session: {
            instructions: SYSTEM_INSTRUCTIONS,
            // Warm, friendly tone — gentler than the upbeat default for an
            // older person.
            voice: "ara",
            turn_detection: {
              type: "server_vad",
              // Give callers (especially older ones) room to pause and think
              // without being cut off mid-sentence.
              silence_duration_ms: 1100,
              prefix_padding_ms: 300,
            },
            audio: {
              input: {
                format: { type: "audio/pcm", rate: SAMPLE_RATE },
                transcription: { model: "grok-transcribe" },
              },
              output: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
            },
            tools: voiceTools,
          },
        });
        // Have Cora open the call warmly instead of waiting for the patient.
        send({ type: "response.create" });
        setStatus("listening");
      };

      ws.onmessage = (msg) => {
        let event: ServerEvent;
        try {
          event = JSON.parse(msg.data as string);
        } catch {
          return;
        }
        void handleEvent(event);
      };

      ws.onerror = () => {
        setError("WebSocket connection error.");
        setStatus("error");
      };

      ws.onclose = () => {
        // Only treat as an error if we didn't tear down intentionally.
        if (wsRef.current === ws) {
          disconnect();
        }
      };
    } catch (err) {
      console.error("[grok-voice] connect failed:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      disconnect();
      setStatus("error");
    }
  }, [disconnect, handleEvent, send, status]);

  // Clean up on unmount.
  useEffect(() => () => disconnect(), [disconnect]);

  return { status, error, transcript, toolActivity, connect, disconnect };
}

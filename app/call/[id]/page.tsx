"use client";

import { Persona } from "@/components/ai-elements/persona";
import { useEffect, useRef, useState } from "react";

export default function CallPage() {
  const [state, setState] = useState<
    "idle" | "listening" | "thinking" | "speaking"
  >("idle");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setState("speaking");
    const onEnded = () => setState("listening");

    audio.addEventListener("play", onPlay);
    audio.addEventListener("ended", onEnded);

    setState("thinking");
    const timer = setTimeout(() => audio.play(), 800);

    return () => {
      clearTimeout(timer);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, []);

  return (
    <main className="flex flex-1 items-center justify-center">
      <audio ref={audioRef} src="/samples/greetings.wav" preload="auto" />
      <div className="flex flex-col items-center gap-6">
        <Persona className="size-64" state={state} variant="halo" />
        <p className="text-muted-foreground text-sm capitalize">{state}</p>
      </div>
    </main>
  );
}

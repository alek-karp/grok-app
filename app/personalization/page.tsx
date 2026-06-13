"use client";

import { useState } from "react";
import { Bot, Coffee, Heart, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GROK_VOICES,
  VOICE_META,
  type GrokVoice,
  type StoredProfile,
} from "@/lib/db/profile-schema";
import { storage } from "@/lib/storage";


const DEFAULT_PROFILE: StoredProfile = {
  age: undefined,
  companionName: "Cora",
  voice: "ara",
  routine: { wakeTime: "", breakfastHabit: "", medication: "" },
  careCircle: { caregiver: "", clinician: "" },
  interests: [""],
};

function getInitialVoice(): GrokVoice {
  if (typeof window === "undefined") return "ara";
  const stored = storage.getVoice();
  return (GROK_VOICES as readonly string[]).includes(stored)
    ? (stored as GrokVoice)
    : "ara";
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[280px_1fr] gap-12 px-8 py-8">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{title}</h2>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
      {children}
    </label>
  );
}

export default function PersonalizationPage() {
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<StoredProfile>(() => ({
    ...DEFAULT_PROFILE,
    voice: getInitialVoice(),
  }));

  function setRoutine(
    field: keyof NonNullable<StoredProfile["routine"]>,
    value: string,
  ) {
    setProfile((p) => ({
      ...p,
      routine: { ...DEFAULT_PROFILE.routine!, ...p.routine, [field]: value },
    }));
  }

  function setCareCircle(
    field: keyof NonNullable<StoredProfile["careCircle"]>,
    value: string,
  ) {
    setProfile((p) => ({
      ...p,
      careCircle: { caregiver: "", ...p.careCircle, [field]: value },
    }));
  }

  function setInterest(index: number, value: string) {
    setProfile((p) => {
      const interests = [...(p.interests ?? [""])];
      interests[index] = value;
      return { ...p, interests };
    });
  }

  function addInterest() {
    setProfile((p) => ({ ...p, interests: [...(p.interests ?? []), ""] }));
  }

  function removeInterest(index: number) {
    setProfile((p) => {
      const interests = (p.interests ?? [""]).filter((_, i) => i !== index);
      return { ...p, interests: interests.length ? interests : [""] };
    });
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b px-8 py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Personalization
          </h1>
          <p className="text-sm text-muted-foreground">
            Help your companion get to know you better.
          </p>
        </div>
        <Button disabled>Save changes</Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          <Section
            icon={User}
            title="About you"
            description="Basic details your companion uses to address you during calls."
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <FieldLabel>Preferred name</FieldLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should Cora call you?"
                />
              </div>
              <div>
                <FieldLabel>Age</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={profile.age ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      age: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="—"
                  className="w-24"
                />
              </div>
            </div>
          </Section>

          <Section
            icon={Coffee}
            title="Morning routine"
            description="Anchor points for natural check-ins. Used to gently probe orientation and medication habits."
          >
            <div className="space-y-4">
              <div>
                <FieldLabel>Wake time</FieldLabel>
                <Input
                  value={profile.routine?.wakeTime ?? ""}
                  onChange={(e) => setRoutine("wakeTime", e.target.value)}
                  placeholder="e.g. around 7 in the morning"
                />
              </div>
              <div>
                <FieldLabel>Breakfast habit</FieldLabel>
                <Input
                  value={profile.routine?.breakfastHabit ?? ""}
                  onChange={(e) =>
                    setRoutine("breakfastHabit", e.target.value)
                  }
                  placeholder="e.g. tea and toast"
                />
              </div>
              <div>
                <FieldLabel>Morning medication</FieldLabel>
                <Input
                  value={profile.routine?.medication ?? ""}
                  onChange={(e) => setRoutine("medication", e.target.value)}
                  placeholder="e.g. blue pill after breakfast"
                />
              </div>
            </div>
          </Section>

          <Section
            icon={Heart}
            title="Support circle"
            description="Mentioned at the end of each call when checking in on how things are going."
          >
            <div className="space-y-4">
              <div>
                <FieldLabel>Caregiver</FieldLabel>
                <Input
                  value={profile.careCircle?.caregiver ?? ""}
                  onChange={(e) => setCareCircle("caregiver", e.target.value)}
                  placeholder="e.g. daughter Sarah"
                />
              </div>
              <div>
                <FieldLabel>Doctor</FieldLabel>
                <Input
                  value={profile.careCircle?.clinician ?? ""}
                  onChange={(e) => setCareCircle("clinician", e.target.value)}
                  placeholder="e.g. Dr. Lee"
                />
              </div>
            </div>
          </Section>

          <Section
            icon={Sparkles}
            title="What you enjoy"
            description="Conversation hooks so every call feels warm and personal rather than clinical."
          >
            <div className="flex flex-wrap gap-2">
              {(profile.interests ?? [""]).map((interest, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    value={interest}
                    onChange={(e) => setInterest(i, e.target.value)}
                    placeholder="e.g. gardening…"
                    className="w-44"
                  />
                  {(profile.interests ?? [""]).length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      onClick={() => removeInterest(i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addInterest}
                className="self-center"
              >
                + Add
              </Button>
            </div>
          </Section>

          <Section
            icon={Bot}
            title="Your companion"
            description="Choose how your AI companion sounds and what it calls itself."
          >
            <div className="space-y-6">
              <div className="max-w-xs">
                <FieldLabel>Companion's name</FieldLabel>
                <Input
                  value={profile.companionName ?? "Cora"}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      companionName: e.target.value,
                    }))
                  }
                  placeholder="Cora"
                />
              </div>

              <div className="max-w-xs">
                <FieldLabel>Voice</FieldLabel>
                <Select
                  value={profile.voice ?? "ara"}
                  onValueChange={(v) => {
                    storage.setVoice(v);
                    setProfile((p) => ({ ...p, voice: v as GrokVoice }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROK_VOICES.map((v) => {
                      const meta = VOICE_META[v];
                      return (
                        <SelectItem key={v} value={v}>
                          {meta.label} — {meta.description}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}

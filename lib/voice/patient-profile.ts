/**
 * Synthetic demo patient profile. SYNTHETIC DATA ONLY (hackathon rule + no PHI).
 *
 * The profile is what makes the call feel personal instead of clinical. Every
 * question in the call flow pulls from these fields so no two patients hear the
 * same call. Later this comes from a DB / supermemory; for now it's hardcoded.
 */

export type PatientProfile = {
  /** Stable id used to key this patient's long-term memory (supermemory). */
  id: string;
  /** Preferred name the agent uses out loud. */
  preferredName: string;
  /** The agent's own name — a familiar, recurring companion. */
  companionName: string;
  age: number;
  /** Warm, dementia-friendly delivery notes. */
  pacePreference: string;
  /** Natural check-in anchors that also probe routine/orientation memory. */
  routine: {
    wakeTime: string;
    breakfastHabit: string;
    medication: string; // e.g. "blue pill after breakfast"
  };
  /** Makes questions personal: "before I remind Sarah…" */
  careCircle: {
    caregiver: string; // e.g. "daughter Sarah"
    clinician: string; // e.g. "Dr. Lee"
  };
  /** Conversation hooks so it never feels like a cold call. */
  interests: string[];
  /** A real thing from "last call" to test episodic/conversational recall. */
  lastCallThread: string;
  /**
   * The short story planted near the start and recalled near the end
   * (WMS Logical Memory analog). Keep it concrete and small.
   */
  plantedStory: {
    intro: string; // what the agent says to plant it
    details: string[]; // canonical details used later for scoring
  };
  /** Three words for immediate + delayed recall (MoCA analog). */
  recallWords: [string, string, string];
};

export const DEMO_PATIENT: PatientProfile = {
  id: "mary-demo",
  preferredName: "Mary",
  companionName: "Cora",
  age: 76,
  pacePreference:
    "warm, calm, unhurried; short sentences; leave a generous pause after each question",
  routine: {
    wakeTime: "around 7 in the morning",
    breakfastHabit: "tea and toast",
    medication: "blue pill after breakfast",
  },
  careCircle: {
    caregiver: "daughter Sarah",
    clinician: "Dr. Lee",
  },
  interests: ["her garden club", "her grandson's soccer games", "old musicals"],
  lastCallThread: "her grandson's soccer game over the weekend",
  plantedStory: {
    intro:
      "a short story to remember for me — Anna Thompson left her handbag on the bus in London, and inside it were fifteen dollars and her keys",
    details: [
      "Anna Thompson",
      "handbag",
      "bus",
      "London",
      "fifteen dollars",
      "her keys",
    ],
  },
  recallWords: ["apple", "river", "chair"],
};

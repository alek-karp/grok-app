// Mary Chen, 76, early MCI — 14-day call history ending Jun 13 2026
// Personal baselines established in first 7 calls (Jun 1–7)
// Decline visible from Jun 9 after a storm night

export type CallEntry = {
  date: string; // "Jun 1"
  iso: string;  // "2026-06-01"

  // KPI 1: Semantic Verbal Fluency
  verbalFluency: number;          // unique animals named (baseline 14)

  // KPI 2: Delayed Story Recall
  storyRecallDetails: number;     // 0–10 details (baseline 7)
  storyRecallSpeakingTime: number; // seconds (baseline 48)

  // KPI 3: Object Naming
  namingAccuracy: number;         // 0–100 % (baseline 93)
  wordFindingFailures: number;    // count (baseline 0–1)

  // KPI 4: Word Recall
  immediateWordRecall: number;    // 0–3 (baseline 3)
  delayedWordRecall: number;      // 0–3 (baseline 3)

  // KPI 5: Temporal Orientation
  temporalOrientation: number;    // 0–4 (baseline 4)

  // KPI 6: Stop Word Fraction
  stopWordFraction: number;       // 0–1 ratio (baseline 0.34)

  // KPI 7: Speaking Time per Task (seconds)
  speakingTimeFluency: number;    // baseline 54
  speakingTimeStoryRecall: number; // baseline 48

  // KPI 8: Repetition Within Call
  repetitionCount: number;        // baseline 0–1

  // KPI 9: Medication Adherence
  medicationAdherence: "Confirmed" | "Uncertain" | "Missed";

  // KPI 10: Mood
  mood: "Cheerful" | "Neutral" | "Flat" | "Anxious" | "Agitated";

  // KPI 11: Safety Flag
  safetyFlag: boolean;

  // KPI 12: Call Engagement
  callCompleted: boolean;
  callDurationMinutes: number;
};

export const BASELINES = {
  verbalFluency: 14,
  storyRecallDetails: 7,
  storyRecallSpeakingTime: 48,
  namingAccuracy: 93,
  wordFindingFailures: 0.5,
  immediateWordRecall: 3,
  delayedWordRecall: 3,
  temporalOrientation: 4,
  stopWordFraction: 0.34,
  speakingTimeFluency: 54,
  speakingTimeStoryRecall: 48,
  repetitionCount: 0.5,
};

export const kpiData: CallEntry[] = [
  // — Baseline window (Jun 1–7) — stable, establishing norms
  {
    date: "Jun 1", iso: "2026-06-01",
    verbalFluency: 14, storyRecallDetails: 7, storyRecallSpeakingTime: 50,
    namingAccuracy: 100, wordFindingFailures: 0,
    immediateWordRecall: 3, delayedWordRecall: 3, temporalOrientation: 4,
    stopWordFraction: 0.33, speakingTimeFluency: 56, speakingTimeStoryRecall: 50,
    repetitionCount: 0, medicationAdherence: "Confirmed", mood: "Cheerful",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 8,
  },
  {
    date: "Jun 2", iso: "2026-06-02",
    verbalFluency: 15, storyRecallDetails: 8, storyRecallSpeakingTime: 52,
    namingAccuracy: 100, wordFindingFailures: 0,
    immediateWordRecall: 3, delayedWordRecall: 3, temporalOrientation: 4,
    stopWordFraction: 0.32, speakingTimeFluency: 57, speakingTimeStoryRecall: 52,
    repetitionCount: 0, medicationAdherence: "Confirmed", mood: "Cheerful",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 9,
  },
  {
    date: "Jun 3", iso: "2026-06-03",
    verbalFluency: 13, storyRecallDetails: 7, storyRecallSpeakingTime: 46,
    namingAccuracy: 100, wordFindingFailures: 1,
    immediateWordRecall: 3, delayedWordRecall: 3, temporalOrientation: 4,
    stopWordFraction: 0.35, speakingTimeFluency: 53, speakingTimeStoryRecall: 46,
    repetitionCount: 1, medicationAdherence: "Confirmed", mood: "Neutral",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 8,
  },
  {
    date: "Jun 4", iso: "2026-06-04",
    verbalFluency: 14, storyRecallDetails: 7, storyRecallSpeakingTime: 49,
    namingAccuracy: 100, wordFindingFailures: 0,
    immediateWordRecall: 3, delayedWordRecall: 3, temporalOrientation: 4,
    stopWordFraction: 0.34, speakingTimeFluency: 54, speakingTimeStoryRecall: 49,
    repetitionCount: 0, medicationAdherence: "Confirmed", mood: "Neutral",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 8,
  },
  {
    date: "Jun 5", iso: "2026-06-05",
    verbalFluency: 16, storyRecallDetails: 8, storyRecallSpeakingTime: 54,
    namingAccuracy: 100, wordFindingFailures: 0,
    immediateWordRecall: 3, delayedWordRecall: 3, temporalOrientation: 4,
    stopWordFraction: 0.31, speakingTimeFluency: 58, speakingTimeStoryRecall: 54,
    repetitionCount: 0, medicationAdherence: "Confirmed", mood: "Cheerful",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 9,
  },
  {
    date: "Jun 6", iso: "2026-06-06",
    verbalFluency: 14, storyRecallDetails: 6, storyRecallSpeakingTime: 44,
    namingAccuracy: 67, wordFindingFailures: 1,
    immediateWordRecall: 3, delayedWordRecall: 2, temporalOrientation: 4,
    stopWordFraction: 0.36, speakingTimeFluency: 52, speakingTimeStoryRecall: 44,
    repetitionCount: 1, medicationAdherence: "Confirmed", mood: "Neutral",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 8,
  },
  {
    date: "Jun 7", iso: "2026-06-07",
    verbalFluency: 13, storyRecallDetails: 7, storyRecallSpeakingTime: 48,
    namingAccuracy: 100, wordFindingFailures: 1,
    immediateWordRecall: 3, delayedWordRecall: 3, temporalOrientation: 4,
    stopWordFraction: 0.35, speakingTimeFluency: 54, speakingTimeStoryRecall: 48,
    repetitionCount: 1, medicationAdherence: "Confirmed", mood: "Cheerful",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 8,
  },
  // — Storm night Jun 8, decline begins Jun 9 —
  {
    date: "Jun 8", iso: "2026-06-08",
    verbalFluency: 12, storyRecallDetails: 6, storyRecallSpeakingTime: 40,
    namingAccuracy: 100, wordFindingFailures: 1,
    immediateWordRecall: 3, delayedWordRecall: 2, temporalOrientation: 4,
    stopWordFraction: 0.37, speakingTimeFluency: 50, speakingTimeStoryRecall: 40,
    repetitionCount: 1, medicationAdherence: "Uncertain", mood: "Flat",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 7,
  },
  {
    date: "Jun 9", iso: "2026-06-09",
    verbalFluency: 10, storyRecallDetails: 5, storyRecallSpeakingTime: 33,
    namingAccuracy: 67, wordFindingFailures: 2,
    immediateWordRecall: 3, delayedWordRecall: 2, temporalOrientation: 3,
    stopWordFraction: 0.41, speakingTimeFluency: 46, speakingTimeStoryRecall: 33,
    repetitionCount: 2, medicationAdherence: "Uncertain", mood: "Flat",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 7,
  },
  {
    date: "Jun 10", iso: "2026-06-10",
    verbalFluency: 9, storyRecallDetails: 4, storyRecallSpeakingTime: 28,
    namingAccuracy: 67, wordFindingFailures: 2,
    immediateWordRecall: 2, delayedWordRecall: 1, temporalOrientation: 3,
    stopWordFraction: 0.44, speakingTimeFluency: 43, speakingTimeStoryRecall: 28,
    repetitionCount: 3, medicationAdherence: "Missed", mood: "Anxious",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 6,
  },
  {
    date: "Jun 11", iso: "2026-06-11",
    verbalFluency: 8, storyRecallDetails: 3, storyRecallSpeakingTime: 24,
    namingAccuracy: 67, wordFindingFailures: 3,
    immediateWordRecall: 2, delayedWordRecall: 1, temporalOrientation: 2,
    stopWordFraction: 0.49, speakingTimeFluency: 40, speakingTimeStoryRecall: 24,
    repetitionCount: 3, medicationAdherence: "Missed", mood: "Flat",
    safetyFlag: true, callCompleted: true, callDurationMinutes: 6,
  },
  {
    date: "Jun 12", iso: "2026-06-12",
    verbalFluency: 9, storyRecallDetails: 4, storyRecallSpeakingTime: 30,
    namingAccuracy: 67, wordFindingFailures: 2,
    immediateWordRecall: 3, delayedWordRecall: 2, temporalOrientation: 3,
    stopWordFraction: 0.46, speakingTimeFluency: 42, speakingTimeStoryRecall: 30,
    repetitionCount: 2, medicationAdherence: "Confirmed", mood: "Neutral",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 7,
  },
  {
    date: "Jun 13", iso: "2026-06-13",
    verbalFluency: 8, storyRecallDetails: 3, storyRecallSpeakingTime: 25,
    namingAccuracy: 33, wordFindingFailures: 3,
    immediateWordRecall: 2, delayedWordRecall: 1, temporalOrientation: 3,
    stopWordFraction: 0.48, speakingTimeFluency: 38, speakingTimeStoryRecall: 25,
    repetitionCount: 4, medicationAdherence: "Missed", mood: "Flat",
    safetyFlag: false, callCompleted: true, callDurationMinutes: 6,
  },
];

// Medication adherence encoded as number for charts
export const medicationEncoded = kpiData.map((d) => ({
  date: d.date,
  value: d.medicationAdherence === "Confirmed" ? 1 : d.medicationAdherence === "Uncertain" ? 0.5 : 0,
  label: d.medicationAdherence,
}));

// Mood encoded for charts
const moodScore: Record<CallEntry["mood"], number> = {
  Cheerful: 5, Neutral: 4, Flat: 2, Anxious: 2, Agitated: 1,
};
export const moodEncoded = kpiData.map((d) => ({
  date: d.date,
  score: moodScore[d.mood],
  label: d.mood,
}));

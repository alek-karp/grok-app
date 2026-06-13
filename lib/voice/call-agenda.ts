import type { PatientProfile } from "./patient-profile";

/**
 * The ordered assessment agenda for a daily check-in call.
 *
 * Why this exists: the system prompt alone can't make Cora *progress*. Each
 * Grok response is generated fresh from the transcript with no memory of "which
 * clinical beats have I covered?", so a warmth-first prompt reliably drifts into
 * endless small talk and never plants the story or runs the recall tasks.
 *
 * This module turns the engineering brief's conversation flow into an explicit,
 * ordered list of beats. The call client walks the list during natural lulls and
 * feeds each beat to the live session as a *silent private cue* (never spoken),
 * so the conversation always moves forward and the clinically-critical ordering
 * holds — story planted in the first third, fluency in the middle, delayed
 * recall in the final third (WMS protocol).
 *
 * Each beat is phrased as a gentle instruction Cora acts on in her own warm
 * words. It is NEVER read aloud — see the `[[NEXT FOCUS ...]]` convention the
 * system prompt is taught to follow.
 */
export type AgendaBeat = {
  /** Stable id for the beat (used for logging / debugging). */
  id: string;
  /** Private instruction Cora acts on in her next turn. Never spoken verbatim. */
  instruction: string;
};

/**
 * Build the ordered agenda for a daily call. Beats that depend on details we
 * don't have (a known routine, interests, prior-call thread) are adapted or
 * dropped so we never reference things that aren't true for this patient.
 */
export function buildCallAgenda(p: PatientProfile): AgendaBeat[] {
  const { preferredName: name, routine, careCircle } = p;
  const story = p.plantedStory;
  const [w1, w2, w3] = p.recallWords;
  const interests = p.interests ?? [];
  const hasInterests = interests.length > 0;

  const beats: AgendaBeat[] = [];

  // 1. Sleep + mood — light, natural, sets affect/sleep KPIs.
  beats.push({
    id: "sleep_mood",
    instruction: `Gently move on from the opening: ask warmly how ${name} slept last night and whether they were comfortable. One short, caring question.`,
  });

  // 2. Cross-session episodic recall — only if we have something to recall.
  if (p.lastCallThread) {
    beats.push({
      id: "cross_session_recall",
      instruction: `Bring up something from last time as a warm follow-up: "${p.lastCallThread}". Ask how it went, in a way that lets you tell whether they remember it — but never make it feel like a test.`,
    });
  }

  // 3. STORY PLANT — must land in the first third of the call.
  beats.push({
    id: "plant_story",
    instruction: `Now plant the little story for later recall, shared warmly as an anecdote ("before I forget, here's a sweet little story"): ${story.intro}. Tell it once, clearly and gently, then move on. Do NOT ask them to repeat it and do NOT call it a test — you'll quietly ask about it again near the end.`,
  });

  // 4. Orientation + medication — woven as friendly banter.
  beats.push({
    id: "orientation_meds",
    instruction: routine
      ? `Drift into their morning: ${routine ? `did they have their ${routine.breakfastHabit}, and have they taken their ${routine.medication} yet?` : "how their morning has gone and whether they've taken any morning medicine"} Then, as shared confusion to keep it light ("I always lose track myself"), ask what day of the week they think it is. Keep it as ordinary chat, never a quiz.`
      : `Drift into their morning as friendly banter — how it's gone, whether they've eaten, any morning medicine. Then, as shared confusion ("I always lose track myself"), ask what day of the week they think it is. Never a quiz.`,
  });

  // 5. VERBAL FLUENCY — the top predictor; goes in the middle, between plant and recall.
  beats.push({
    id: "fluency",
    instruction: `Time for the little "game" you enjoy together: invite ${name} to name as many animals as they can — any animals at all — and give them about a minute. Keep it playful and encouraging, never pressured. Let them run, then warmly wrap it up.`,
  });

  // 6. OBJECT NAMING (BNT analog) — describe, let them name.
  beats.push({
    id: "naming",
    instruction: `Play a gentle describe-and-name game: describe each object and let ${name} say what it is — (1) worn on the wrist, has numbers, tells the time [watch]; (2) used to cut paper, two holes for your fingers, two blades [scissors]; (3)${hasInterests && interests.some((i) => /garden/i.test(i)) ? " planted in the garden," : ""} grows toward the sun and turns yellow when it blooms [sunflower]. If they can't land one, warmly fill it in and move on — never sound let down.`,
  });

  // 7. Conversational recall — episodic memory + coherence via their interests.
  if (hasInterests) {
    beats.push({
      id: "conversational_recall",
      instruction: `Linger warmly on something they love (${interests.join(", ")}) — ask about it in a way that draws on what they've told you before, so you can quietly tell whether they remember. Enjoy it with them; this is the warm heart of the call.`,
    });
  }

  // 8. IMMEDIATE WORD RECALL — seed three words to ask back now and later.
  beats.push({
    id: "immediate_words",
    instruction: `As a shared little ritual, give ${name} three words to hold onto — "${w1}, ${w2}, ${w3}" — and ask them to say the three back to you now. Keep it light and friendly. Tell them you'll ask about them again in a little while.`,
  });

  // 9. DELAYED STORY RECALL — must land in the final third.
  beats.push({
    id: "delayed_story",
    instruction: `Gently circle back to the story from earlier: "do you remember that little story I told you — about ${story.details[0]} and the ${story.details[1]}?" Let them recall what they can. Warm and completely unbothered however much comes back — give one soft second chance, then let it go kindly.`,
  });

  // 10. DELAYED WORD RECALL.
  beats.push({
    id: "delayed_words",
    instruction: `Now ask, lightly, about the three little words from before: "did those three words stay with you, by any chance?" Don't prompt them with the words first. Warm and easy however many come back.`,
  });

  // 11. Agency + warm close.
  beats.push({
    id: "agency_close",
    instruction: careCircle
      ? `Begin wrapping up warmly: make space for them — anything on their mind, or anything they'd like passed on to ${careCircle.caregiver}${careCircle.clinician ? ` or ${careCircle.clinician}` : ""}? Make clear it's entirely their choice what's shared. Then thank ${name} by name and close kindly.`
      : `Begin wrapping up warmly: make space for them — anything on their mind they'd like noted for the people who help look after them? Make clear it's their choice what's shared. Then thank ${name} by name and close kindly.`,
  });

  return beats;
}

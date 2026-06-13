/**
 * Supermemory client — long-term patient memory for Memento.
 * SERVER-ONLY. The API key must never reach the browser.
 *
 * Everything here is gated behind the SUPERMEMORY_ENABLED feature flag. While
 * the flag is off (the default for now), every call is a safe no-op so the rest
 * of the app can call these freely without branching.
 *
 * Docs: https://supermemory.ai/docs
 *   - Add:    POST https://api.supermemory.ai/v3/documents
 *   - Search: POST https://api.supermemory.ai/v4/search
 */

const BASE_URL = "https://api.supermemory.ai";

/** True only when the flag is on AND a key is present. */
export function isMemoryEnabled(): boolean {
  return (
    process.env.SUPERMEMORY_ENABLED === "true" &&
    Boolean(process.env.SUPERMEMORY_API_KEY)
  );
}

/**
 * Container tag isolates one patient's memories from everyone else's.
 * Keep it stable per patient (e.g. a patient id).
 */
export function patientContainerTag(patientId: string): string {
  return `patient_${patientId}`;
}

export type MemoryHit = {
  memory: string;
  similarity: number;
  updatedAt?: string;
};

/**
 * Remember a fact/highlight about a patient. No-op when memory is disabled.
 * `content` is plain text — supermemory extracts memories from it.
 */
export async function rememberAboutPatient(
  patientId: string,
  content: string,
  metadata?: Record<string, unknown>,
): Promise<{ stored: boolean; id?: string }> {
  if (!isMemoryEnabled()) return { stored: false };

  const res = await fetch(`${BASE_URL}/v3/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPERMEMORY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      containerTag: patientContainerTag(patientId),
      metadata,
    }),
  });

  if (!res.ok) {
    console.error("[supermemory] add failed:", res.status, await res.text());
    return { stored: false };
  }
  const data = (await res.json()) as { id?: string };
  return { stored: true, id: data.id };
}

/**
 * Recall what we know about a patient relevant to `query`. Returns [] when
 * memory is disabled. Use this to personalize a call ("last time you mentioned…").
 */
export async function recallAboutPatient(
  patientId: string,
  query: string,
  limit = 5,
): Promise<MemoryHit[]> {
  if (!isMemoryEnabled()) return [];

  const res = await fetch(`${BASE_URL}/v4/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPERMEMORY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      containerTag: patientContainerTag(patientId),
      limit,
    }),
  });

  if (!res.ok) {
    console.error("[supermemory] search failed:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as {
    results?: Array<{ memory?: string; similarity?: number; updatedAt?: string }>;
  };
  return (data.results ?? [])
    .filter((r): r is { memory: string; similarity: number; updatedAt?: string } =>
      Boolean(r.memory),
    )
    .map((r) => ({
      memory: r.memory,
      similarity: r.similarity ?? 0,
      updatedAt: r.updatedAt,
    }));
}

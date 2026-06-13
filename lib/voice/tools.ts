/**
 * Client-side function tools exposed to the Grok Voice Agent.
 *
 * `voiceTools` is sent in `session.update`. When Grok decides to call one, it
 * emits `response.function_call_arguments.done`; we run `runClientTool` and send
 * the result back. Each tool hits a Next.js route handler, which is where you
 * reach a real database or do async retrieval.
 */

export const voiceTools = [
  {
    type: "function" as const,
    name: "get_patient_baseline",
    description:
      "Look up a patient's most recent baseline cognitive assessment (MMSE score, last visit, clinician notes) so you can compare it against the current conversation. Use synthetic demo names like 'Margaret Chen' or 'Robert Diaz'.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Full name of the patient to look up.",
        },
      },
      required: ["name"],
    },
  },
];

type ToolArgs = Record<string, unknown>;

/** Execute a tool by name and return a JSON-serializable result. */
export async function runClientTool(
  name: string,
  args: ToolArgs,
): Promise<unknown> {
  switch (name) {
    case "get_patient_baseline": {
      const res = await fetch("/api/tools/lookup-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: args.name }),
      });
      return res.json();
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

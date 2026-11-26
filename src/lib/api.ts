import { nodeSchema, type UINode } from "@/components/gen/schema";
import { sampleUI } from "./sample-ui";

// Set NEXT_PUBLIC_API_URL (e.g. http://localhost:8000) to use the real back end.
// Without it, the app runs in preview mode and streams a canned response.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const isMock = !API_URL;

export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "reset" }
  | { type: "ui"; ui: UINode; title: string };

function shorten(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function previewFor(prompt: string): UINode {
  return {
    ...sampleUI,
    children: sampleUI.children?.map((child, i) =>
      i === 0
        ? { ...child, props: { ...child.props, text: shorten(prompt) } }
        : child,
    ),
  };
}

async function* mockStream(
  prompt: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const title = shorten(prompt);
  const text =
    `I put together "${title}" with a summary row, a chart and a table. ` +
    "This is a preview response, so connect the back end to get real AI output.";
  for (const word of text.match(/\S+\s*/g) ?? []) {
    await delay(35, signal);
    yield { type: "text", delta: word };
  }
  await delay(300, signal);
  yield { type: "ui", ui: previewFor(prompt), title };
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    const detail = (body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
  } catch {
    // body was not JSON; keep the generic message
  }
  return `Request failed (${res.status})`;
}

function parseEvent(raw: string): StreamEvent | null {
  let name = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;
  const body = JSON.parse(data) as Record<string, unknown>;

  switch (name) {
    case "text":
      return { type: "text", delta: String(body.delta ?? "") };
    case "reset":
      return { type: "reset" };
    case "ui": {
      const parsed = nodeSchema.safeParse(body.ui);
      if (!parsed.success) throw new Error("The AI returned an invalid layout.");
      const title = typeof body.title === "string" ? body.title : "Interface";
      return { type: "ui", ui: parsed.data, title };
    }
    case "error":
      throw new Error(
        typeof body.message === "string" ? body.message : "Something went wrong.",
      );
    default:
      return null; // "done" and anything unknown
  }
}

export async function* streamGenerate(
  prompt: string,
  currentUi: UINode | null,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  if (!API_URL) {
    yield* mockStream(prompt, signal);
    return;
  }

  const res = await fetch(`${API_URL}/api/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, current_ui: currentUi }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(await errorMessage(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = parseEvent(raw);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export type SavedLayout = {
  slug: string;
  title: string;
  prompt: string;
  ui: UINode;
};

// Saves an interface and returns its public slug.
export async function saveLayout(input: {
  prompt: string;
  title: string;
  ui: UINode;
}): Promise<string> {
  if (!API_URL) throw new Error("Sharing needs the back end to be connected.");
  const res = await fetch(`${API_URL}/api/layouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const body = (await res.json()) as { slug?: unknown };
  if (typeof body.slug !== "string") throw new Error("Unexpected response.");
  return body.slug;
}

// Used by the share page (server side). Returns null when the link does not exist.
export async function fetchLayout(slug: string): Promise<SavedLayout | null> {
  if (!API_URL) return null;
  const res = await fetch(`${API_URL}/api/layouts/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await errorMessage(res));

  const body = (await res.json()) as Record<string, unknown>;
  const ui = nodeSchema.safeParse(body.ui);
  if (!ui.success) return null;
  return {
    slug,
    title: typeof body.title === "string" ? body.title : "Interface",
    prompt: typeof body.prompt === "string" ? body.prompt : "",
    ui: ui.data,
  };
}

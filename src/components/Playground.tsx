"use client";

import { useEffect, useRef, useState } from "react";
import { ArtifactPanel } from "@/components/chat/ArtifactPanel";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Composer } from "@/components/chat/Composer";
import { Landing } from "@/components/chat/Landing";
import type { AssistantMessage, Message } from "@/components/chat/types";
import type { UINode } from "@/components/gen/schema";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isMock, saveLayout, streamGenerate, warmUp } from "@/lib/api";

const uid = () => Math.random().toString(36).slice(2, 10);

function latestUi(messages: Message[]): UINode | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.ui) return m.ui;
  }
  return null;
}

export function Playground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    warmUp();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function patch(id: string, fn: (m: AssistantMessage) => AssistantMessage) {
    setMessages((ms) =>
      ms.map((m) => (m.id === id && m.role === "assistant" ? fn(m) : m)),
    );
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    const aiId = uid();
    const currentUi = latestUi(messages); // follow-ups refine the latest interface
    setMessages((ms) => [
      ...ms,
      { id: uid(), role: "user", text },
      { id: aiId, role: "assistant", prompt: text, text: "", status: "streaming" },
    ]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      for await (const event of streamGenerate(text, currentUi, controller.signal)) {
        if (event.type === "text") {
          patch(aiId, (m) => ({ ...m, text: m.text + event.delta }));
        } else if (event.type === "reset") {
          patch(aiId, (m) => ({ ...m, text: "" }));
        } else {
          patch(aiId, (m) => ({ ...m, ui: event.ui, title: event.title }));
        }
      }
      patch(aiId, (m) => ({ ...m, status: "done" }));
    } catch (e) {
      if (controller.signal.aborted) {
        patch(aiId, (m) => ({
          ...m,
          status: "done",
          text: m.text || m.ui ? m.text : "Stopped.",
        }));
      } else {
        const error = e instanceof Error ? e.message : "Something went wrong.";
        patch(aiId, (m) => ({ ...m, status: "error", error }));
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  // Saves the interface once; later clicks reuse the same link.
  async function share(message: AssistantMessage): Promise<string> {
    if (message.slug) return message.slug;
    if (!message.ui) throw new Error("Nothing to share yet.");
    const slug = await saveLayout({
      prompt: message.prompt,
      title: message.title ?? "Interface",
      ui: message.ui,
    });
    patch(message.id, (m) => ({ ...m, slug }));
    return slug;
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setMessages([]);
    setOpenId(null);
    setInput("");
  }

  function retry(id: string) {
    const index = messages.findIndex((m) => m.id === id);
    const failed = messages[index];
    if (!failed || failed.role !== "assistant" || busy) return;
    setMessages((ms) => ms.slice(0, Math.max(0, index - 1))); // drop the failed pair
    void send(failed.prompt);
  }

  if (messages.length === 0) {
    return <Landing value={input} onChange={setInput} onSend={(t) => void send(t)} />;
  }

  const open = messages.find(
    (m): m is AssistantMessage => m.id === openId && m.role === "assistant" && !!m.ui,
  );

  return (
    <div className="flex h-dvh">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-3">
          <span className="font-serif text-lg">genui</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={newChat}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              New chat
            </button>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
            {messages.map((m, i) => (
              <ChatMessage
                key={m.id}
                message={m}
                isLast={i === messages.length - 1}
                activeId={open?.id ?? null}
                onOpen={setOpenId}
                onRetry={retry}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <Composer
          value={input}
          busy={busy}
          onChange={setInput}
          onSend={() => void send(input)}
          onStop={stop}
        />
      </section>

      {open && open.ui ? (
        <ArtifactPanel
          key={open.id}
          title={open.title ?? "Interface"}
          ui={open.ui}
          slug={open.slug}
          onShare={isMock ? undefined : () => share(open)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}

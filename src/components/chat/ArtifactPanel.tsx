"use client";

import { useState } from "react";
import { Render } from "@/components/gen/Render";
import type { UINode } from "@/components/gen/schema";
import { downloadHtml } from "@/lib/export-html";

type Props = {
  title: string;
  ui: UINode;
  slug?: string;
  // Omit to hide the Share button (for example in preview mode).
  onShare?: () => Promise<string>;
  onClose: () => void;
};

type ShareState = "idle" | "saving" | "copied";

// Side panel on large screens, full-screen overlay on small ones.
export function ArtifactPanel({ title, ui, slug, onShare, onClose }: Props) {
  const [state, setState] = useState<ShareState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | undefined>(slug);

  const url = savedSlug ? `${window.location.origin}/u/${savedSlug}` : null;

  async function share() {
    if (!onShare || state === "saving") return;
    setError(null);
    setState("saving");
    try {
      const s = savedSlug ?? (await onShare());
      setSavedSlug(s);
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/u/${s}`);
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      } catch {
        setState("idle"); // clipboard blocked: the link is shown below instead
      }
    } catch (e) {
      setState("idle");
      setError(e instanceof Error ? e.message : "Could not create the link.");
    }
  }

  return (
    <aside className="fixed inset-0 z-30 flex flex-col bg-background lg:static lg:z-auto lg:w-[56%] lg:max-w-3xl lg:border-l lg:border-border">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-serif text-lg">{title}</h2>
          <p className="text-xs text-muted-foreground">Interface</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => downloadHtml(ui, title)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Download HTML
          </button>
          {onShare ? (
            <button
              type="button"
              onClick={() => void share()}
              disabled={state === "saving"}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {state === "saving"
                ? "Creating link..."
                : state === "copied"
                  ? "Link copied"
                  : savedSlug
                    ? "Copy link"
                    : "Share"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {url || error ? (
        <div className="border-b border-border bg-muted px-5 py-2 text-sm">
          {error ? (
            <p role="alert" className="text-primary">
              {error}
            </p>
          ) : (
            <input
              readOnly
              value={url ?? ""}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Share link"
              className="w-full bg-transparent font-mono text-xs outline-none"
            />
          )}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-rise-in mx-auto max-w-2xl">
          <Render node={ui} />
        </div>
      </div>
    </aside>
  );
}

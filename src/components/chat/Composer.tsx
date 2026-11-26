"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

type Props = {
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
};

export function Composer({ value, busy, onChange, onSend, onStop }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the text, up to a limit.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!busy) onSend();
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-4">
      <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
        <textarea
          ref={ref}
          rows={1}
          maxLength={500}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask for a change or a new interface..."
          className="max-h-40 flex-1 resize-none bg-transparent p-2 text-base outline-none placeholder:text-muted-foreground"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

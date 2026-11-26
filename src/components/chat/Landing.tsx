"use client";

import type { KeyboardEvent } from "react";
import { Render } from "@/components/gen/Render";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isMock } from "@/lib/api";
import { sampleUI } from "@/lib/sample-ui";

const examples = [
  "Compare three laptops side by side",
  "Plan my study week",
  "Monthly budget tracker with charts",
  "Four cards in different colors",
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
};

// The first screen. Sending a message switches the app to the chat layout.
export function Landing({ value, onChange, onSend }: Props) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend(value);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="animate-rise-in w-full max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium tracking-wide text-primary">
          genui
        </p>
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Describe it. Watch it become an interface.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Tell the AI what you need. It builds a real, interactive UI you can
          save and share.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend(value);
          }}
          className="mt-10 rounded-lg border border-border bg-card p-3 text-left shadow-sm focus-within:ring-2 focus-within:ring-ring/40"
        >
          <textarea
            rows={3}
            maxLength={500}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="What would you like to build?"
            className="w-full resize-none bg-transparent p-2 text-base outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <span className="pl-2 text-xs text-muted-foreground">
              Enter to generate
            </span>
            <button
              type="submit"
              disabled={!value.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {examples.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onSend(e)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {e}
            </button>
          ))}
        </div>

        <section className="mt-16 w-full text-left">
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Example of a generated interface
            {isMock ? " (preview mode, back end not connected)" : ""}
          </p>
          <div className="rounded-lg border border-border bg-background p-6 sm:p-8">
            <Render node={sampleUI} />
          </div>
        </section>
      </div>
    </main>
  );
}

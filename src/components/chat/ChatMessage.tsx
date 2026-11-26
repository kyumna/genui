import { ArtifactCard, ArtifactPlaceholder } from "./ArtifactCard";
import type { Message } from "./types";

type Props = {
  message: Message;
  isLast: boolean;
  activeId: string | null;
  onOpen: (id: string) => void;
  onRetry: (id: string) => void;
};

function Dots() {
  return (
    <div className="flex gap-1.5 py-2" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export function ChatMessage({ message, isLast, activeId, onOpen, onRetry }: Props) {
  if (message.role === "user") {
    return (
      <div className="animate-rise-in flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-muted px-4 py-2.5">
          {message.text}
        </div>
      </div>
    );
  }

  const streaming = message.status === "streaming";
  return (
    <div className="animate-rise-in">
      {streaming && !message.text && !message.ui ? <Dots /> : null}

      {message.text ? (
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.text}
        </p>
      ) : null}

      {message.ui ? (
        <ArtifactCard
          title={message.title ?? "Interface"}
          active={activeId === message.id}
          onOpen={() => onOpen(message.id)}
        />
      ) : streaming && message.text ? (
        <ArtifactPlaceholder />
      ) : null}

      {message.status === "error" ? (
        <div className="mt-2">
          <p role="alert" className="text-sm text-primary">
            {message.error}
          </p>
          {isLast ? (
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              className="mt-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/50"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

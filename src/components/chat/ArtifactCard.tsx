type Props = {
  title: string;
  active: boolean;
  onOpen: () => void;
};

// The small "file" shown under an AI message. Clicking it opens the interface.
export function ArtifactCard({ title, active, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`mt-4 flex w-full max-w-sm items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors ${
        active ? "border-primary" : "border-border hover:border-primary/50"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-medium text-primary">
        UI
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          Interface · Click to open
        </span>
      </span>
    </button>
  );
}

export function ArtifactPlaceholder() {
  return (
    <div className="mt-4 flex w-full max-w-sm animate-pulse items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
      <span className="min-w-0 flex-1 space-y-2">
        <span className="block h-3 w-2/3 rounded bg-muted" />
        <span className="block h-3 w-1/3 rounded bg-muted" />
      </span>
    </div>
  );
}

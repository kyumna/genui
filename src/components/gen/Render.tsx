"use client";

import { Component, type ReactNode } from "react";
import { registry } from "./registry";
import type { UINode } from "./schema";

const MAX_DEPTH = 6;

// One bad node should never take the whole page down.
class NodeBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Render({ node, depth = 0 }: { node: UINode; depth?: number }) {
  if (depth > MAX_DEPTH) return null;
  // hasOwn blocks keys like "constructor" from resolving via the prototype.
  if (!Object.hasOwn(registry, node.type)) return null;

  const entry = registry[node.type];
  const parsed = entry.schema.safeParse(node.props ?? {});
  if (!parsed.success) return null;

  const Comp = entry.component;
  return (
    <NodeBoundary>
      <Comp {...(parsed.data as Record<string, unknown>)}>
        {node.children?.map((c, i) => (
          <Render key={i} node={c} depth={depth + 1} />
        ))}
      </Comp>
    </NodeBoundary>
  );
}

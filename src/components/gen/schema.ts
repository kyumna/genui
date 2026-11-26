import { z } from "zod";

export type UINode = {
  type: string;
  props?: Record<string, unknown>;
  children?: UINode[];
};

// Loose structural check for a whole tree (used on data coming from the API).
export const nodeSchema: z.ZodType<UINode> = z.lazy(() =>
  z.object({
    type: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
    children: z.array(nodeSchema).optional(),
  }),
);

const cell = z.union([z.string(), z.number()]);

// Palette name or #rrggbb. The back end already cleans it; resolveColor() re-checks.
const color = z.string().optional();

// Strict props per component. Anything that does not match is not rendered.
export const propSchemas = {
  Stack: z.object({ gap: z.number().min(0).max(12).default(4) }),
  Grid: z.object({
    cols: z.number().int().min(1).max(4).default(2),
    gap: z.number().min(0).max(12).default(4),
  }),
  Card: z.object({
    title: z.string().optional(),
    color,
    variant: z.enum(["soft", "solid"]).default("soft"),
  }),
  Heading: z.object({
    text: z.string(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
    color,
  }),
  Text: z.object({
    text: z.string(),
    muted: z.boolean().default(false),
    color,
  }),
  Stat: z.object({
    label: z.string(),
    value: z.string(),
    hint: z.string().optional(),
    color,
  }),
  Table: z.object({
    columns: z.array(z.string()).min(1),
    rows: z.array(z.array(cell)),
  }),
  Chart: z.object({
    kind: z.enum(["bar", "line"]),
    data: z.array(z.record(z.string(), cell)).min(1),
    xKey: z.string(),
    yKeys: z.array(z.string()).min(1).max(4),
    colors: z.array(z.string()).max(4).optional(),
  }),
  Slider: z.object({
    label: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().positive().default(1),
    value: z.number(),
    color,
  }),
  Tabs: z.object({ tabs: z.array(z.string()).min(1).max(6) }),
} as const;

export type ComponentType = keyof typeof propSchemas;

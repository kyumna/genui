"use client";

import { Children, useState, type CSSProperties, type ReactNode } from "react";
import { z } from "zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ink, readableOn, resolveColor, soft, softBorder } from "./colors";
import { propSchemas } from "./schema";

type WithChildren<T> = T & { children?: ReactNode };

type RegistryEntry = {
  schema: z.ZodType;
  component: (props: WithChildren<Record<string, unknown>>) => ReactNode;
};

// Pairs a schema with a component whose props are inferred from that schema.
function entry<S extends z.ZodType>(
  schema: S,
  component: (props: WithChildren<z.infer<S>>) => ReactNode,
): RegistryEntry {
  return { schema, component } as unknown as RegistryEntry;
}

const SERIES_COLORS = ["#d97757", "#6a9bcc", "#788c5d", "#c46686"];

function SliderBlock(props: z.infer<typeof propSchemas.Slider>) {
  const [v, setV] = useState(props.value);
  return (
    <label className="block">
      <div className="mb-2 flex justify-between text-sm">
        <span>{props.label}</span>
        <span className="font-medium">{v}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-full accent-primary"
        style={{ accentColor: resolveColor(props.color) }}
      />
    </label>
  );
}

function TabsBlock(props: WithChildren<z.infer<typeof propSchemas.Tabs>>) {
  const [active, setActive] = useState(0);
  const panels = Children.toArray(props.children);
  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-border">
        {props.tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              i === active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div>{panels[active]}</div>
    </div>
  );
}

function ChartBlock(props: z.infer<typeof propSchemas.Chart>) {
  const custom = (props.colors ?? []).map((c) => resolveColor(c));
  const colorAt = (i: number) =>
    custom[i] ?? SERIES_COLORS[i % SERIES_COLORS.length];
  const axis = { fontSize: 12, fill: "var(--muted-foreground)" };
  const common = (
    <>
      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
      <XAxis dataKey={props.xKey} tick={axis} stroke="var(--border)" />
      <YAxis tick={axis} stroke="var(--border)" />
      <Tooltip
        contentStyle={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
        }}
      />
    </>
  );
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        {props.kind === "bar" ? (
          <BarChart data={props.data}>
            {common}
            {props.yKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                fill={colorAt(i)}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart data={props.data}>
            {common}
            {props.yKeys.map((k, i) => (
              <Line
                key={k}
                dataKey={k}
                stroke={colorAt(i)}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

const headingClass = {
  1: "font-serif text-4xl tracking-tight",
  2: "font-serif text-2xl tracking-tight",
  3: "font-serif text-lg",
} as const;

// Maps a component "type" coming from the AI to a real React component.
// Only types listed here can ever be rendered.
export const registry: Record<string, RegistryEntry> = {
  Stack: entry(propSchemas.Stack, ({ gap, children }) => (
    <div className="flex flex-col" style={{ gap: gap * 4 }}>
      {children}
    </div>
  )),
  Grid: entry(propSchemas.Grid, ({ cols, gap, children }) => (
    <div
      className="grid grid-cols-1 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
      style={{ gap: gap * 4, ["--cols" as string]: cols }}
    >
      {children}
    </div>
  )),
  Card: entry(propSchemas.Card, ({ title, color, variant, children }) => {
    const c = resolveColor(color);
    let style: CSSProperties | undefined;
    if (c && variant === "solid") {
      style = { background: c, borderColor: c, color: readableOn(c) };
    } else if (c) {
      style = { background: soft(c), borderColor: softBorder(c) };
    }
    return (
      <div
        className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
        style={style}
      >
        {title ? <h3 className="mb-3 font-serif text-lg">{title}</h3> : null}
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    );
  }),
  Heading: entry(propSchemas.Heading, ({ text, level, color }) => {
    const c = resolveColor(color);
    return (
      <h2 className={headingClass[level]} style={c ? { color: ink(c) } : undefined}>
        {text}
      </h2>
    );
  }),
  Text: entry(propSchemas.Text, ({ text, muted, color }) => {
    const c = resolveColor(color);
    return (
      <p
        className={muted ? "opacity-70" : undefined}
        style={c ? { color: ink(c) } : undefined}
      >
        {text}
      </p>
    );
  }),
  Stat: entry(propSchemas.Stat, ({ label, value, hint, color }) => {
    const c = resolveColor(color);
    return (
      <div
        className="rounded-lg border border-border bg-card p-4 text-card-foreground"
        style={c ? { background: soft(c), borderColor: softBorder(c) } : undefined}
      >
        <div className="text-sm text-muted-foreground">{label}</div>
        <div
          className="mt-1 font-serif text-3xl"
          style={c ? { color: ink(c) } : undefined}
        >
          {value}
        </div>
        {hint ? (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </div>
    );
  }),
  Table: entry(propSchemas.Table, ({ columns, rows }) => (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((v, j) => (
                <td key={j} className="px-4 py-2">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )),
  Chart: entry(propSchemas.Chart, (p) => <ChartBlock {...p} />),
  Slider: entry(propSchemas.Slider, (p) => <SliderBlock {...p} />),
  Tabs: entry(propSchemas.Tabs, (p) => <TabsBlock {...p} />),
};

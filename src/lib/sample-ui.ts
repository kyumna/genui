import type { UINode } from "@/components/gen/schema";

// Hardcoded stand-in for what the AI returns. Used on the landing page and in preview mode.
export const sampleUI: UINode = {
  type: "Stack",
  props: { gap: 5 },
  children: [
    { type: "Heading", props: { text: "Laptop comparison", level: 2 } },
    {
      type: "Text",
      props: {
        text: "Three options for everyday development work.",
        muted: true,
      },
    },
    {
      type: "Grid",
      props: { cols: 3, gap: 3 },
      children: [
        { type: "Stat", props: { label: "Best battery", value: "Laptop B", hint: "14 hours", color: "green" } },
        { type: "Stat", props: { label: "Best value", value: "Laptop A", hint: "$899", color: "blue" } },
        { type: "Stat", props: { label: "Most powerful", value: "Laptop C", hint: "32 GB RAM", color: "purple" } },
      ],
    },
    {
      type: "Tabs",
      props: { tabs: ["Battery", "Specs"] },
      children: [
        {
          type: "Chart",
          props: {
            kind: "bar",
            xKey: "name",
            yKeys: ["hours"],
            colors: ["orange"],
            data: [
              { name: "Laptop A", hours: 9 },
              { name: "Laptop B", hours: 14 },
              { name: "Laptop C", hours: 7 },
            ],
          },
        },
        {
          type: "Table",
          props: {
            columns: ["Model", "RAM", "Price"],
            rows: [
              ["Laptop A", "16 GB", "$899"],
              ["Laptop B", "16 GB", "$1,199"],
              ["Laptop C", "32 GB", "$1,799"],
            ],
          },
        },
      ],
    },
    {
      type: "Card",
      props: { title: "Your budget", color: "amber" },
      children: [
        { type: "Slider", props: { label: "Max price ($)", min: 500, max: 2500, step: 50, value: 1200 } },
      ],
    },
  ],
};

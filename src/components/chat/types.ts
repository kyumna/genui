import type { UINode } from "@/components/gen/schema";

export type UserMessage = { id: string; role: "user"; text: string };

export type AssistantMessage = {
  id: string;
  role: "assistant";
  prompt: string; // the user text this answers, used for "Try again"
  text: string;
  status: "streaming" | "done" | "error";
  ui?: UINode;
  title?: string;
  slug?: string; // set once the interface has been saved for sharing
  error?: string;
};

export type Message = UserMessage | AssistantMessage;

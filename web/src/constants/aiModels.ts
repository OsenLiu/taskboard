import type { AIModelOption } from "../api/client";

export const FALLBACK_AI_MODELS: AIModelOption[] = [
  { id: "auto", name: "Auto (recommended)" },
  { id: "gpt-5.6-luna", name: "GPT-5.6 Luna" },
  { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
  { id: "claude-opus-5", name: "Claude Opus 5" },
];
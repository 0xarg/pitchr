// Models users can pick. The API rejects anything not in this list.
export type ModelInfo = {
  id: string;
  name: string;
  tagline: string;
  recommended?: boolean;
  tested?: boolean;
};

export const MODELS: ModelInfo[] = [
  {
    id: "anthropic/claude-sonnet-5.5",
    name: "Claude Sonnet 5.5",
    tagline: "Best writing, sounds the most human",
    recommended: true,
    tested: true,
  },
  {
    id: "anthropic/claude-opus-5.5",
    name: "Claude Opus 5.5",
    tagline: "Most polished, for high-value bids",
  },
  {
    id: "openai/gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    tagline: "Strong alternative voice, sharp structure",
  },
  {
    id: "anthropic/claude-haiku-5.5",
    name: "Claude Haiku 5.5",
    tagline: "Fast and cheap, solid first drafts",
  },
  {
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tagline: "Quick and low-cost",
  },
  {
    id: "deepseek/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    tagline: "Cheapest, for applying in bulk",
  },
];

export const DEFAULT_MODEL = MODELS[0].id;

export function isAllowedModel(id: unknown): id is string {
  return typeof id === "string" && MODELS.some((m) => m.id === id);
}

export function modelName(id: string) {
  return MODELS.find((m) => m.id === id)?.name ?? id;
}

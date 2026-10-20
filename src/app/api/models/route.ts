import { NextResponse } from "next/server";
import { MODELS } from "../../lib/models";

// Rough size of one generation (prompt incl. resume, output incl. reasoning),
// used only for the "~$x per proposal" estimate. Real cost comes back per run.
const TYPICAL_INPUT_TOKENS = 1500;
const TYPICAL_OUTPUT_TOKENS = 1300;

type OpenRouterModel = {
  id: string;
  pricing?: { prompt?: string; completion?: string };
};

export async function GET() {
  let prices = new Map<string, { input: number; output: number }>();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
    });
    const { data } = (await res.json()) as { data: OpenRouterModel[] };
    prices = new Map(
      data.map((m) => [
        m.id,
        {
          input: Number(m.pricing?.prompt ?? NaN),
          output: Number(m.pricing?.completion ?? NaN),
        },
      ]),
    );
  } catch {
    // Pricing is a nice-to-have; the picker still works without it.
  }

  return NextResponse.json({
    models: MODELS.map((m) => {
      const p = prices.get(m.id);
      const valid = p && Number.isFinite(p.input) && Number.isFinite(p.output);
      return {
        ...m,
        inputPerM: valid ? p.input * 1e6 : null,
        outputPerM: valid ? p.output * 1e6 : null,
        estPerRun: valid
          ? p.input * TYPICAL_INPUT_TOKENS + p.output * TYPICAL_OUTPUT_TOKENS
          : null,
      };
    }),
  });
}

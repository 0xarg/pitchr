import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { OpenRouter } from "@openrouter/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MODEL, isAllowedModel } from "../../lib/models";
import { getProfile, profileLinks } from "../../lib/profile";
import {
  buildUserMessage,
  LINK_RULES,
  LOOM_SYSTEM,
  PROPOSAL_SYSTEM,
} from "../../lib/prompts";

const SYSTEM_PROMPTS = {
  proposal: PROPOSAL_SYSTEM,
  loom: LOOM_SYSTEM,
} as const;

type GenerateType = keyof typeof SYSTEM_PROMPTS;

// Separates the streamed text from the trailing JSON metadata line.
const META_SEPARATOR = "\u001e";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const jd = typeof body?.jd === "string" ? body.jd.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes : undefined;
  const resumeId = Number(body?.resumeId);
  const type = body?.type as GenerateType;
  const includeLinks = body?.includeLinks === true;

  if (!jd) {
    return NextResponse.json(
      { error: "Job description is required" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(resumeId)) {
    return NextResponse.json(
      { error: "Upload a resume first" },
      { status: 400 },
    );
  }
  if (!(type in SYSTEM_PROMPTS)) {
    return NextResponse.json(
      { error: "type must be 'proposal' or 'loom'" },
      { status: 400 },
    );
  }
  if (body?.model !== undefined && !isAllowedModel(body.model)) {
    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  const [{ data: resume, error }, profile] = await Promise.all([
    supabase
      .from("resume")
      .select("text")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single(),
    getProfile(supabase, user.id),
  ]);
  if (error || !resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const model: string = body?.model ?? profile.default_model ?? DEFAULT_MODEL;
  const links = includeLinks ? profileLinks(profile) : [];
  const system = `${SYSTEM_PROMPTS[type]}\n\n${
    links.length ? LINK_RULES[type] : LINK_RULES.none
  }`;

  const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
  const started = Date.now();

  let events;
  try {
    events = await client.chat.send({
      chatRequest: {
        model,
        maxTokens: 4096,
        stream: true,
        streamOptions: { includeUsage: true },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: buildUserMessage(resume.text, jd, notes, links),
          },
        ],
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let promptTokens: number | null = null;
      let completionTokens: number | null = null;
      let cost = 0;
      let wroteText = false;
      try {
        for await (const chunk of events) {
          if (chunk.error) throw new Error(chunk.error.message);
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            wroteText = true;
            controller.enqueue(encoder.encode(text));
          }
          if (chunk.usage) {
            promptTokens = chunk.usage.promptTokens ?? null;
            completionTokens = chunk.usage.completionTokens ?? null;
            cost = chunk.usage.cost ?? 0;
          }
        }
        if (!wroteText) throw new Error("The model returned an empty response");

        const meta = {
          model,
          cost,
          promptTokens,
          completionTokens,
          durationMs: Date.now() - started,
        };
        // Record usage (never the text) for the profile's spend totals.
        await supabase.from("generations").insert({
          user_id: user.id,
          type,
          model,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          cost_usd: cost,
          duration_ms: meta.durationMs,
        });
        controller.enqueue(
          encoder.encode(META_SEPARATOR + JSON.stringify(meta)),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "Generation failed";
        controller.enqueue(
          encoder.encode(META_SEPARATOR + JSON.stringify({ error: message })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

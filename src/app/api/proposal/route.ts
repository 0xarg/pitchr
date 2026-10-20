import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { OpenRouter } from "@openrouter/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  buildUserMessage,
  LOOM_SYSTEM,
  PROPOSAL_SYSTEM,
} from "../../lib/prompts";

const MODEL = "anthropic/claude-sonnet-5.5";

const SYSTEM_PROMPTS = {
  proposal: PROPOSAL_SYSTEM,
  loom: LOOM_SYSTEM,
} as const;

type GenerateType = keyof typeof SYSTEM_PROMPTS;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const jd = typeof body?.jd === "string" ? body.jd.trim() : "";
    const notes = typeof body?.notes === "string" ? body.notes : undefined;
    const resumeId = Number(body?.resumeId);
    const type = body?.type as GenerateType;

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

    const supabase = await createClient();
    const user = await getUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("resume")
      .select("text")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const client = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await client.chat.send({
      chatRequest: {
        model: MODEL,
        maxTokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[type] },
          { role: "user", content: buildUserMessage(data.text, jd, notes) },
        ],
      },
    });

    const content = completion.choices[0]?.message.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((part) => ("text" in part ? part.text : "")).join("")
          : "";

    if (!text.trim()) {
      throw new Error("The model returned an empty response");
    }
    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

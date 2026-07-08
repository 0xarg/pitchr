import { createClient } from "@/lib/supabase/server";
import { OpenRouter } from "@openrouter/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { prompt1 } from "../../lib/prompts";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const form = await req.formData();

  const jd = form.get("jd") as string;
  const resumeId = form.get("resumeId") as string;

  try {
    const { data, error } = await supabase
      .from("resume")
      .select("*")
      .eq("id", parseInt(resumeId))
      .single();

    console.log(data);
    if (error) {
      throw error;
    }
    const resumeTxt = data.text;
    const client = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const prompt = `${prompt1} + . This is the Resume:${resumeTxt} & This is the Job Description: ${jd}`;
    console.log(prompt);

    const completion = await client.chat.send({
      chatRequest: {
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
    });

    const proposal = completion.choices[0].message.content;
    return NextResponse.json(
      {
        proposal,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error,
      },
      { status: 500 },
    );
  }
}

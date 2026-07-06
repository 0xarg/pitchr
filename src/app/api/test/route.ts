import { createClient } from "@/lib/supabase/server";
import { OpenRouter } from "@openrouter/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const form = await req.formData();

  const jd = form.get("jd") as string;
  const resume = form.get("resumeTxt") as File;

  const rsBuf = await resume.arrayBuffer();

  const buff = Buffer.from(rsBuf);

  const parser = new PDFParse({ data: buff });

  const data1 = await parser.getText();
  const resumeText = data1.text;

  console.log(data1.text);

  const { data, error } = await supabase.from("resume").insert({
    text: resumeText,
  });

  const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const prompt = `You are a Senior CV specialist and Job Proposal writer, I am sharing my resume and job description, You have to write a proposal for me which I can copy paste as text, I am applying for this job on Upwork as a freelancer, So please write in the upwork standards, It should be AI prone, Which I mean that if any tool used, this proposal should be flagged as human written, My resume: ${resumeText} and Job description: ${jd}`;

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

  // console.log(completion.choices[0].message.content);
  const proposal = completion.choices[0].message.content;

  return NextResponse.json(
    {
      Proposal: proposal,
    },
    { status: 200 },
  );
}

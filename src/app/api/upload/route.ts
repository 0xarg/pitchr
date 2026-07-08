import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const form = await req.formData();
  console.log(form);

  try {
    const resume = form.get("file") as File;

    const rsBuf = await resume.arrayBuffer();
    const buff = Buffer.from(rsBuf);

    const parser = new PDFParse({ data: buff });

    const res = await parser.getText();
    const resumeText = res.text;

    const { data, error } = await supabase
      .from("resume")
      .insert({
        text: resumeText,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }
    return NextResponse.json(
      { message: `Resume Uploaded with id: ${data.id}` },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}

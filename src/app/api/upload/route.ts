import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
// Must load before pdf-parse: polyfills DOMMatrix etc. via @napi-rs/canvas and
// provides an inlined pdf.js worker, so nothing is missing on Vercel.
import { CanvasFactory, getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker(getData());

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const resume = form.get("file");

    if (!(resume instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (resume.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Resume must be a PDF" },
        { status: 400 },
      );
    }
    if (resume.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "PDF must be 5MB or smaller" },
        { status: 400 },
      );
    }

    const buff = Buffer.from(await resume.arrayBuffer());
    const parser = new PDFParse({ data: buff, CanvasFactory });
    const res = await parser.getText();
    await parser.destroy();
    const resumeText = res.text.trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Couldn't read any text from this PDF" },
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
      .insert({
        text: resumeText,
        user_id: user.id,
        file_name: resume.name.slice(0, 120),
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    // A fresh upload becomes the active resume.
    await supabase
      .from("profiles")
      .upsert({ user_id: user.id, active_resume_id: data.id });
    return NextResponse.json({
      id: data.id,
      fileName: resume.name,
      preview: resumeText.slice(0, 200),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

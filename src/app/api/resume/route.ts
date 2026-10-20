import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Returns the most recently uploaded resume, so the page can reuse it.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resume")
    .select("id, text")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ resume: null });
  }
  return NextResponse.json({
    resume: { id: data.id, preview: data.text.slice(0, 200) },
  });
}

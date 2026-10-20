import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Returns the most recently uploaded resume, so the page can reuse it.
export async function GET() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("resume")
    .select("id, text")
    .eq("user_id", user.id)
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

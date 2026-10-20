import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getProfile } from "../../lib/profile";

export async function GET() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const [{ data, error }, profile] = await Promise.all([
    supabase
      .from("resume")
      .select("id, file_name, created_at, text")
      .eq("user_id", user.id)
      .order("id", { ascending: false }),
    getProfile(supabase, user.id),
  ]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Active = the one chosen on the profile, else the newest.
  const activeId = data.some((r) => r.id === profile.active_resume_id)
    ? profile.active_resume_id
    : (data[0]?.id ?? null);

  return NextResponse.json({
    activeId,
    resumes: data.map((r) => ({
      id: r.id,
      fileName: r.file_name ?? `Resume #${r.id}`,
      createdAt: r.created_at,
      preview: r.text.slice(0, 200),
    })),
  });
}

import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getProfile, parseProfileInput } from "../../lib/profile";

export async function GET() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({ profile: await getProfile(supabase, user.id) });
}

// Partial update: only the fields sent are changed.
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = parseProfileInput(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    ...parsed.value,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: await getProfile(supabase, user.id) });
}

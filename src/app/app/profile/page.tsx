import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileView } from "./ProfileView";

export const metadata = { title: "Profile · Pitchr" };

export default async function ProfilePage() {
  const user = await getUser(await createClient());
  if (!user) redirect("/login?next=/app/profile");

  return <ProfileView email={user.email} />;
}

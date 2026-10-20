import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Workspace } from "./Workspace";

export const metadata = { title: "Workspace · Pitchr" };

export default async function AppPage() {
  // The proxy already guards /app; this is a second check close to the data.
  const user = await getUser(await createClient());
  if (!user) redirect("/login?next=/app");

  return <Workspace email={user.email} />;
}

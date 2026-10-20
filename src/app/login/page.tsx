import { safeNext } from "@/lib/supabase/auth";
import { SiteNav } from "../components/SiteNav";
import { GoogleButton } from "./GoogleButton";

export const metadata = { title: "Sign in · Pitchr" };

const ERRORS: Record<string, string> = {
  not_allowed:
    "This Google account doesn't have access. Sign in with an allowed account.",
  auth_failed: "Sign-in didn't complete. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? ERRORS[params.error] : "";

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Sign in to Pitchr
          </h1>
          <p className="mt-2 text-zinc-500">
            Your resume and proposals stay private to your account.
          </p>
          {error && (
            <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-8">
            <GoogleButton next={next} />
          </div>
        </div>
      </main>
    </div>
  );
}

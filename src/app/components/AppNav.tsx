"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navGhost, SiteNav } from "./SiteNav";

const TABS = [
  { href: "/app", label: "Workspace" },
  { href: "/app/profile", label: "Profile" },
];

// Top bar for signed-in pages: tabs, extra right-side content, sign out.
export function AppNav({
  email,
  children,
}: {
  email: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <SiteNav
      tabs={
        <div className="flex h-full items-center gap-1">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative flex h-full items-center px-3 text-sm font-medium transition-colors ${
                  active
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {t.label}
                <span
                  className={`absolute inset-x-3 -bottom-px h-0.5 origin-center rounded-full bg-zinc-950 transition-transform duration-300 ease-out dark:bg-white ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      }
    >
      {children}
      <span className="hidden max-w-48 truncate text-sm text-zinc-500 md:block">
        {email}
      </span>
      <form action="/auth/signout" method="post">
        <button className={navGhost}>Sign out</button>
      </form>
    </SiteNav>
  );
}

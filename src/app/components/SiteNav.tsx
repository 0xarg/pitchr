import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function SiteNav({
  children,
  tabs,
}: {
  children?: ReactNode;
  tabs?: ReactNode;
}) {
  return (
    <nav className="sticky top-0 z-20 border-b border-zinc-200/80 bg-background/80 backdrop-blur-xl dark:border-white/[0.08]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
        <div className="flex h-full items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-[-0.03em]">
            Pitchr
          </Link>
          {tabs}
        </div>
        <div className="flex items-center gap-3">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export const navButton =
  "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition active:scale-[0.97]";
export const navPrimary = `${navButton} bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200`;
export const navGhost = `${navButton} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white`;

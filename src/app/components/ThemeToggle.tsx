"use client";
import { MoonIcon, SunIcon } from "./icons";

// The visible icon is driven by CSS (dark: variant), so there's no React
// state to mismatch with the theme the inline script set before hydration.
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className="relative flex h-9 w-16 items-center rounded-full border border-zinc-200 bg-white/70 p-1 shadow-sm backdrop-blur transition-colors hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
    >
      <span className="absolute left-1 h-7 w-7 rounded-full bg-zinc-900 shadow transition-transform duration-300 ease-out dark:translate-x-7 dark:bg-white" />
      <span className="relative z-10 flex w-7 justify-center text-white dark:text-zinc-500">
        <SunIcon width={14} height={14} />
      </span>
      <span className="relative z-10 flex w-7 justify-center text-zinc-400 dark:text-zinc-900">
        <MoonIcon width={14} height={14} />
      </span>
    </button>
  );
}

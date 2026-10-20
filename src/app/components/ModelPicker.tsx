"use client";
import { useCallback, useState } from "react";
import { formatUsd, type ModelOption, useDismiss } from "../lib/client";
import { CheckIcon, ChevronIcon, CpuIcon } from "./icons";

export function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: ModelOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
        selected
          ? "border-zinc-900 bg-zinc-900/[0.03] dark:border-white/60 dark:bg-white/[0.05]"
          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.03]"
      }`}
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
          selected
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
            : "border-zinc-300 dark:border-white/20"
        }`}
      >
        {selected && <CheckIcon width={11} height={11} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{model.name}</span>
          {model.recommended && (
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
              Recommended
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-zinc-500">
          {model.tagline}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-xs text-zinc-700 dark:text-zinc-300">
          {model.estPerRun != null ? `~${formatUsd(model.estPerRun)}` : "–"}
        </span>
        <span className="block text-[10px] text-zinc-400">per run</span>
      </span>
    </button>
  );
}

// Compact trigger + popover list of models.
export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const current = models.find((m) => m.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white pr-2.5 pl-3 text-sm font-medium transition hover:border-zinc-300 active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
      >
        <CpuIcon width={14} height={14} className="text-zinc-500" />
        <span className="max-w-36 truncate">
          {current?.name ?? "Choose model"}
        </span>
        <ChevronIcon
          width={14}
          height={14}
          className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(380px,calc(100vw-48px))] origin-bottom-left animate-pop-in rounded-3xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/40">
          <p className="px-2 pt-1 pb-2 text-xs text-zinc-500">
            Estimates use live OpenRouter prices. You see the real cost after
            each run.
          </p>
          <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto">
            {models.map((m) => (
              <ModelCard
                key={m.id}
                model={m}
                selected={m.id === value}
                onSelect={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

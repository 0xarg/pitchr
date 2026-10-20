"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppNav } from "../components/AppNav";
import { ModelPicker } from "../components/ModelPicker";
import { Switch } from "../components/Switch";
import { card, field, ghostBtn } from "../components/styles";
import {
  CheckIcon,
  ChevronIcon,
  CoinIcon,
  CopyIcon,
  FileIcon,
  LinkIcon,
  PenIcon,
  PlusIcon,
  RefreshIcon,
  SparkIcon,
  UploadIcon,
  VideoIcon,
} from "../components/icons";
import {
  formatTokens,
  formatUsd,
  type GenerateMeta,
  type ModelOption,
  readJson,
  streamGenerate,
  useCountUp,
  useDismiss,
} from "../lib/client";

type Resume = {
  id: number;
  fileName: string;
  createdAt: string;
  preview: string;
};
type OutputType = "proposal" | "loom";
type Output = {
  text: string;
  status: "idle" | "streaming" | "done" | "error";
  error: string;
  meta: GenerateMeta | null;
};

const OUTPUTS: Record<
  OutputType,
  { label: string; hint: string; Icon: typeof PenIcon }
> = {
  proposal: { label: "Proposal", hint: "Paste-ready", Icon: PenIcon },
  loom: { label: "Loom script", hint: "60-90s video", Icon: VideoIcon },
};
const TYPES = Object.keys(OUTPUTS) as OutputType[];
const EMPTY_OUTPUT: Output = {
  text: "",
  status: "idle",
  error: "",
  meta: null,
};
const LINKS_PREF_KEY = "pitchr:includeLinks";

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// Renders model text, styling Loom timestamps ([0:10]) and on-screen cues ([show: ...]).
function FormattedText({ text, caret }: { text: string; caret: boolean }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-[15px] leading-7 text-zinc-800 dark:text-zinc-200">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-wrap break-words">
          {block.split(/(\[[^\]]+\]|https?:\/\/\S+)/g).map((part, j) => {
            if (/^\[\d+:\d{2}\]$/.test(part)) {
              return (
                <span
                  key={j}
                  className="mr-1 inline-flex rounded-md bg-zinc-900/[0.06] px-1.5 py-0.5 font-mono text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200"
                >
                  {part.slice(1, -1)}
                </span>
              );
            }
            if (/^\[show:/i.test(part)) {
              return (
                <span
                  key={j}
                  className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[13px] text-amber-700 dark:text-amber-300"
                >
                  {part.slice(1, -1)}
                </span>
              );
            }
            if (/^https?:\/\//.test(part)) {
              return (
                <span
                  key={j}
                  className="underline decoration-zinc-300 underline-offset-4 dark:decoration-zinc-600"
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
          {caret && i === blocks.length - 1 && (
            <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-caret bg-zinc-900 dark:bg-white" />
          )}
        </p>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {[100, 94, 88, 100, 76].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-shimmer rounded-full bg-linear-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] dark:from-white/[0.06] dark:via-white/15 dark:to-white/[0.06]"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

function CostPill({
  meta,
  models,
}: {
  meta: GenerateMeta;
  models: ModelOption[];
}) {
  const cost = useCountUp(meta.cost);
  const tokens = (meta.promptTokens ?? 0) + (meta.completionTokens ?? 0);
  const name = models.find((m) => m.id === meta.model)?.name ?? meta.model;
  return (
    <div className="flex animate-fade-up flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-white/[0.03]">
      <span className="inline-flex items-center gap-1.5 font-mono font-medium text-zinc-900 dark:text-zinc-100">
        <CoinIcon width={13} height={13} />
        {formatUsd(cost)}
      </span>
      <span>{formatTokens(tokens)} tokens</span>
      <span>{(meta.durationMs / 1000).toFixed(1)}s</span>
      <span className="ml-auto">{name}</span>
    </div>
  );
}

function SessionCost({ total }: { total: number }) {
  const value = useCountUp(total);
  if (total === 0) return null;
  return (
    <span
      className="hidden animate-pop-in items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 font-mono text-xs text-zinc-600 sm:inline-flex dark:border-white/10 dark:text-zinc-400"
      title="Spent this session"
    >
      <CoinIcon width={12} height={12} />
      {formatUsd(value)}
    </span>
  );
}

function ResumeChip({
  resumes,
  activeId,
  status,
  error,
  uploading,
  onPick,
  onUpload,
}: {
  resumes: Resume[];
  activeId: number | null;
  status: string;
  error: boolean;
  uploading: boolean;
  onPick: (id: number) => void;
  onUpload: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const fileInput = useRef<HTMLInputElement>(null);
  const active = resumes.find((r) => r.id === activeId);

  return (
    <div
      ref={ref}
      className={`${card} relative`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onUpload(file);
      }}
    >
      <div
        className={`flex items-center gap-3 rounded-3xl p-3 transition ${dragging ? "bg-zinc-900/[0.03] ring-2 ring-zinc-400 ring-inset dark:bg-white/5" : ""}`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
          <FileIcon width={18} height={18} />
        </span>
        <button
          type="button"
          onClick={() => resumes.length && setOpen((o) => !o)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="truncate">
              {active ? active.fileName : "Your resume"}
            </span>
            {resumes.length > 1 && (
              <ChevronIcon
                width={14}
                height={14}
                className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            )}
          </span>
          <span
            className={`block truncate text-xs ${error ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}
          >
            {status ||
              active?.preview.replace(/\s+/g, " ") ||
              "Drop a PDF here or upload"}
          </span>
        </button>
        <button
          className={ghostBtn}
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          <UploadIcon width={13} height={13} />
          {uploading ? "Uploading…" : active ? "New" : "Upload"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>
      {open && (
        <div className="absolute inset-x-2 top-full z-30 mt-2 origin-top animate-pop-in rounded-3xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/40">
          {resumes.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onPick(r.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-white/5"
            >
              <span className="min-w-0 flex-1 truncate">{r.fileName}</span>
              <span className="text-xs text-zinc-400">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
              {r.id === activeId && (
                <CheckIcon
                  width={14}
                  height={14}
                  className="text-emerald-500"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Workspace({ email }: { email: string }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [resumeStatus, setResumeStatus] = useState("Loading…");
  const [resumeError, setResumeError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [models, setModels] = useState<ModelOption[]>([]);
  const [model, setModel] = useState("");
  const [linkCount, setLinkCount] = useState(0);
  const [includeLinks, setIncludeLinks] = useState(true);

  const [jd, setJD] = useState("");
  const [notes, setNotes] = useState("");
  const [wanted, setWanted] = useState<Record<OutputType, boolean>>({
    proposal: true,
    loom: true,
  });
  const [outputs, setOutputs] = useState<Record<OutputType, Output>>({
    proposal: EMPTY_OUTPUT,
    loom: EMPTY_OUTPUT,
  });
  const [copied, setCopied] = useState<OutputType | null>(null);
  const [sessionCost, setSessionCost] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LINKS_PREF_KEY);
      if (saved !== null) setIncludeLinks(saved === "1");
    } catch {}

    Promise.all([
      fetch("/api/resumes").then(readJson),
      fetch("/api/profile").then(readJson),
      fetch("/api/models").then(readJson),
    ])
      .then(([r, p, m]) => {
        setResumes(r.resumes);
        setActiveId(r.activeId);
        setResumeStatus("");
        setModels(m.models);
        setModel(p.profile.default_model);
        setLinkCount(
          p.profile.links.length +
            (p.profile.portfolio_url ? 1 : 0) +
            (p.profile.github_url ? 1 : 0),
        );
      })
      .catch((e: Error) => {
        setResumeError(true);
        setResumeStatus(e.message);
      });
  }, []);

  const setLinksPref = (on: boolean) => {
    setIncludeLinks(on);
    try {
      localStorage.setItem(LINKS_PREF_KEY, on ? "1" : "0");
    } catch {}
  };

  const pickResume = async (id: number) => {
    setActiveId(id);
    try {
      await readJson(
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active_resume_id: id }),
        }),
      );
    } catch (e) {
      setResumeError(true);
      setResumeStatus((e as Error).message);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setResumeError(false);
    setResumeStatus("Reading your PDF…");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await readJson(
        await fetch("/api/upload", { method: "POST", body: formData }),
      );
      setResumes((rs) => [
        {
          id: data.id,
          fileName: data.fileName,
          createdAt: new Date().toISOString(),
          preview: data.preview,
        },
        ...rs,
      ]);
      setActiveId(data.id);
      setResumeStatus("");
    } catch (e) {
      setResumeError(true);
      setResumeStatus((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const generate = async (type: OutputType) => {
    if (activeId == null) return;
    setOutputs((o) => ({
      ...o,
      [type]: { text: "", status: "streaming", error: "", meta: null },
    }));
    try {
      const { text, meta } = await streamGenerate(
        {
          jd,
          notes,
          resumeId: activeId,
          type,
          model: model || undefined,
          includeLinks: includeLinks && linkCount > 0,
        },
        (partial) =>
          setOutputs((o) => ({ ...o, [type]: { ...o[type], text: partial } })),
      );
      setOutputs((o) => ({
        ...o,
        [type]: { text, status: "done", error: "", meta },
      }));
      setSessionCost((c) => c + meta.cost);
    } catch (e) {
      setOutputs((o) => ({
        ...o,
        [type]: {
          ...o[type],
          status: "error",
          error: (e as Error).message,
        },
      }));
    }
  };

  const busy = TYPES.some((t) => outputs[t].status === "streaming");
  const canGenerate =
    activeId != null &&
    !!jd.trim() &&
    (wanted.proposal || wanted.loom) &&
    !busy;

  const generateAll = () => {
    if (!canGenerate) return;
    TYPES.filter((t) => wanted[t]).forEach(generate);
  };

  const copy = async (type: OutputType) => {
    await navigator.clipboard.writeText(outputs[type].text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  const visible = TYPES.filter((t) => outputs[t].status !== "idle");

  return (
    <div className="flex flex-1 flex-col">
      <AppNav email={email}>
        <SessionCost total={sessionCost} />
      </AppNav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-24">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Input column */}
          <div className="flex animate-fade-up flex-col gap-4 lg:sticky lg:top-20">
            <ResumeChip
              resumes={resumes}
              activeId={activeId}
              status={resumeStatus}
              error={resumeError}
              uploading={uploading}
              onPick={pickResume}
              onUpload={uploadFile}
            />

            <section className={`${card} flex flex-col gap-4 p-5`}>
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="jd" className="text-sm font-medium">
                    Job post
                  </label>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    {wordCount(jd)} words
                  </span>
                </div>
                <textarea
                  id="jd"
                  className={`${field} min-h-60 resize-y`}
                  placeholder="Paste the full Upwork job description…"
                  value={jd}
                  onChange={(e) => setJD(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      generateAll();
                    }
                  }}
                />
              </div>
              <input
                aria-label="Notes"
                className={field}
                placeholder="Notes: client name, rate, availability… (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Output types */}
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => {
                  const { label, hint, Icon } = OUTPUTS[t];
                  const on = wanted[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setWanted((w) => ({ ...w, [t]: !w[t] }))}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                        on
                          ? "border-zinc-900 bg-zinc-900/[0.03] dark:border-white/60 dark:bg-white/[0.04]"
                          : "border-zinc-200 opacity-60 hover:opacity-100 dark:border-white/10"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition ${
                          on
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "bg-zinc-100 text-zinc-500 dark:bg-white/5"
                        }`}
                      >
                        <Icon width={15} height={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {label}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Model + links */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
                {models.length > 0 && (
                  <ModelPicker
                    models={models}
                    value={model}
                    onChange={setModel}
                  />
                )}
                <label
                  className={`flex items-center gap-2.5 text-sm ${linkCount ? "" : "text-zinc-400"}`}
                  title={
                    linkCount
                      ? "Pitchr picks only the links that fit this job"
                      : "Add links on your Profile first"
                  }
                >
                  <LinkIcon width={14} height={14} className="text-zinc-500" />
                  {linkCount ? (
                    <span>
                      Include links{" "}
                      <span className="text-zinc-400">({linkCount})</span>
                    </span>
                  ) : (
                    <Link
                      href="/app/profile"
                      className="inline-flex items-center gap-1 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <PlusIcon width={12} height={12} />
                      Add links
                    </Link>
                  )}
                  <Switch
                    label="Include my links"
                    checked={includeLinks && linkCount > 0}
                    disabled={!linkCount}
                    onChange={setLinksPref}
                  />
                </label>
              </div>

              <button
                onClick={generateAll}
                disabled={!canGenerate}
                className="relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-zinc-950 px-6 text-[15px] font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <SparkIcon
                  width={16}
                  height={16}
                  className={busy ? "animate-spin" : ""}
                />
                {busy ? "Writing…" : "Generate"}
                {!busy && (
                  <kbd className="ml-1 rounded-md border border-white/20 px-1.5 font-sans text-[11px] opacity-60 dark:border-black/20">
                    ⌘↵
                  </kbd>
                )}
              </button>
            </section>
          </div>

          {/* Output column */}
          <div
            className="flex animate-fade-up flex-col gap-6"
            style={{ animationDelay: "100ms" }}
          >
            {visible.length === 0 && (
              <section
                className={`${card} grid min-h-[440px] place-items-center p-10 text-center`}
              >
                <div>
                  <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                    <SparkIcon width={24} height={24} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Your pitch shows up here
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
                    Paste a job post and hit Generate. You&apos;ll see the exact
                    cost of every run.
                  </p>
                </div>
              </section>
            )}

            {visible.map((type, idx) => {
              const out = outputs[type];
              const { label, Icon } = OUTPUTS[type];
              const words = wordCount(out.text);
              const streaming = out.status === "streaming";
              return (
                <section
                  key={type}
                  className={`${card} animate-fade-up overflow-hidden ${streaming ? "animate-glow" : ""}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <header className="flex items-center justify-between gap-3 border-b border-zinc-200/70 px-5 py-3.5 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-300">
                        <Icon width={15} height={15} />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold">{label}</h2>
                        <p className="text-xs text-zinc-500 tabular-nums">
                          {streaming
                            ? "Writing…"
                            : out.text
                              ? `${words} words${
                                  type === "loom"
                                    ? ` · ~${Math.round((words / 150) * 60)}s spoken`
                                    : ""
                                }`
                              : "Not generated"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className={ghostBtn}
                        disabled={streaming || activeId == null || !jd.trim()}
                        onClick={() => generate(type)}
                        aria-label={`Regenerate ${label}`}
                      >
                        <RefreshIcon
                          width={13}
                          height={13}
                          className={streaming ? "animate-spin" : ""}
                        />
                        <span className="hidden sm:inline">Regenerate</span>
                      </button>
                      <button
                        className={`${ghostBtn} ${
                          copied === type
                            ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            : ""
                        }`}
                        disabled={!out.text || streaming}
                        onClick={() => copy(type)}
                      >
                        {copied === type ? (
                          <CheckIcon width={13} height={13} />
                        ) : (
                          <CopyIcon width={13} height={13} />
                        )}
                        {copied === type ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </header>
                  <div className="flex flex-col gap-4 px-5 py-5">
                    {out.error && (
                      <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {out.error}
                      </p>
                    )}
                    {streaming && !out.text ? (
                      <Skeleton />
                    ) : (
                      out.text && (
                        <FormattedText text={out.text} caret={streaming} />
                      )
                    )}
                    {out.meta && <CostPill meta={out.meta} models={models} />}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

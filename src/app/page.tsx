"use client";
import React, { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./components/ThemeToggle";
import {
  CheckIcon,
  CopyIcon,
  FileIcon,
  PenIcon,
  RefreshIcon,
  SparkIcon,
  UploadIcon,
  VideoIcon,
} from "./components/icons";

type ResumeInfo = { id: number; preview: string };
type OutputType = "proposal" | "loom";
type Output = { text: string; loading: boolean; error: string };

const OUTPUTS: Record<
  OutputType,
  { label: string; hint: string; Icon: typeof PenIcon }
> = {
  proposal: {
    label: "Proposal",
    hint: "Paste-ready for Upwork",
    Icon: PenIcon,
  },
  loom: { label: "Loom script", hint: "60-90s video", Icon: VideoIcon },
};
const TYPES = Object.keys(OUTPUTS) as OutputType[];

const EMPTY_OUTPUT: Output = { text: "", loading: false, error: "" };

async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const card =
  "rounded-3xl border border-zinc-200/80 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none";
const field =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-white/30 dark:focus:ring-white/5";
const ghostBtn =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10";

// Renders model text, styling Loom timestamps ([0:10]) and on-screen cues ([show: ...]).
function FormattedText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-7 text-zinc-800 dark:text-zinc-200">
      {text.split(/\n{2,}/).map((block, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {block.split(/(\[[^\]]+\])/g).map((part, j) => {
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
            return part;
          })}
        </p>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {[100, 94, 88, 100, 76, 92, 60].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-shimmer rounded-full bg-linear-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] dark:from-white/[0.06] dark:via-white/15 dark:to-white/[0.06]"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<ResumeInfo | null>(null);
  const [resumeStatus, setResumeStatus] = useState("Loading resume…");
  const [resumeError, setResumeError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

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

  useEffect(() => {
    fetch("/api/resume")
      .then(readJson)
      .then((data) => {
        setResume(data.resume);
        setResumeStatus(data.resume ? "" : "No resume yet");
      })
      .catch((e: Error) => {
        setResumeError(true);
        setResumeStatus(e.message);
      });
  }, []);

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
      setResume({ id: data.id, preview: data.preview });
      setResumeStatus("");
    } catch (e) {
      setResumeError(true);
      setResumeStatus((e as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const generate = async (type: OutputType) => {
    if (!resume) return;
    setOutputs((o) => ({
      ...o,
      [type]: { ...o[type], loading: true, error: "" },
    }));
    try {
      const data = await readJson(
        await fetch("/api/proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jd, notes, resumeId: resume.id, type }),
        }),
      );
      setOutputs((o) => ({
        ...o,
        [type]: { text: data.text, loading: false, error: "" },
      }));
    } catch (e) {
      setOutputs((o) => ({
        ...o,
        [type]: { ...o[type], loading: false, error: (e as Error).message },
      }));
    }
  };

  const anyLoading = outputs.proposal.loading || outputs.loom.loading;
  const canGenerate =
    !!resume && !!jd.trim() && (wanted.proposal || wanted.loom) && !anyLoading;

  const generateAll = () => {
    if (!canGenerate) return;
    TYPES.filter((t) => wanted[t]).forEach(generate);
  };

  const copy = async (type: OutputType) => {
    await navigator.clipboard.writeText(outputs[type].text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  const visible = TYPES.filter(
    (t) => outputs[t].text || outputs[t].loading || outputs[t].error,
  );

  return (
    <div className="flex flex-1 flex-col">
      <nav className="sticky top-0 z-20 border-b border-zinc-200/80 bg-background/80 backdrop-blur-xl dark:border-white/[0.08]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <span className="text-lg font-semibold tracking-[-0.03em]">
            Pitchr
          </span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-24">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Input column */}
          <div
            className="animate-fade-up flex flex-col gap-6 lg:sticky lg:top-24"
            style={{ animationDelay: "80ms" }}
          >
            <section className={`${card} p-2`}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) uploadFile(file);
                }}
                className={`flex items-center gap-4 rounded-[20px] border border-dashed p-4 transition ${
                  dragging
                    ? "border-zinc-400 bg-zinc-900/[0.03] dark:border-white/30 dark:bg-white/5"
                    : "border-transparent"
                }`}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
                  <FileIcon width={20} height={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {resume ? `Resume #${resume.id}` : "Your resume"}
                    {resume && !resumeStatus && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p
                    className={`truncate text-xs ${
                      resumeError
                        ? "text-red-600 dark:text-red-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {resumeStatus ||
                      resume?.preview.replace(/\s+/g, " ") ||
                      "Drop a PDF here"}
                  </p>
                </div>
                <button
                  className={ghostBtn}
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  <UploadIcon width={13} height={13} />
                  {uploading ? "Uploading…" : resume ? "Replace" : "Upload"}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                />
              </div>
            </section>

            <section className={`${card} flex flex-col gap-5 p-6`}>
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="jd" className="text-sm font-medium">
                    Job post
                  </label>
                  <span className="text-xs text-zinc-400">
                    {wordCount(jd)} words
                  </span>
                </div>
                <textarea
                  id="jd"
                  className={`${field} min-h-64 resize-y`}
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
              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium"
                >
                  Notes{" "}
                  <span className="font-normal text-zinc-400">optional</span>
                </label>
                <input
                  id="notes"
                  className={field}
                  placeholder="Client name, rate, portfolio links…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

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

              <button
                onClick={generateAll}
                disabled={!canGenerate}
                className="relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-zinc-950 px-6 text-[15px] font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <span className="relative flex items-center gap-2">
                  <SparkIcon width={16} height={16} />
                  {anyLoading ? "Writing…" : "Generate"}
                  {!anyLoading && (
                    <kbd className="ml-1 rounded-md border border-white/20 px-1.5 font-sans text-[11px] opacity-60 dark:border-black/20">
                      ⌘↵
                    </kbd>
                  )}
                </span>
              </button>
              {!resume && !resumeStatus.startsWith("Loading") && (
                <p className="-mt-2 text-center text-xs text-zinc-500">
                  Upload your resume to get started.
                </p>
              )}
            </section>
          </div>

          {/* Output column */}
          <div
            className="animate-fade-up flex flex-col gap-6"
            style={{ animationDelay: "160ms" }}
          >
            {visible.length === 0 && (
              <section
                className={`${card} grid min-h-[420px] place-items-center p-10 text-center`}
              >
                <div>
                  <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                    <SparkIcon width={24} height={24} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Your pitch shows up here
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
                    Paste a job post and hit Generate. Each result can be copied
                    or regenerated on its own.
                  </p>
                </div>
              </section>
            )}

            {visible.map((type) => {
              const out = outputs[type];
              const { label, Icon } = OUTPUTS[type];
              const words = wordCount(out.text);
              return (
                <section
                  key={type}
                  className={`${card} animate-fade-up overflow-hidden`}
                >
                  <header className="flex items-center justify-between gap-3 border-b border-zinc-200/70 px-6 py-4 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-300">
                        <Icon width={15} height={15} />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold">{label}</h2>
                        <p className="text-xs text-zinc-500">
                          {out.loading
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
                        disabled={out.loading || !resume || !jd.trim()}
                        onClick={() => generate(type)}
                        aria-label={`Regenerate ${label}`}
                      >
                        <RefreshIcon
                          width={13}
                          height={13}
                          className={out.loading ? "animate-spin" : ""}
                        />
                        <span className="hidden sm:inline">Regenerate</span>
                      </button>
                      <button
                        className={`${ghostBtn} ${
                          copied === type
                            ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            : ""
                        }`}
                        disabled={!out.text || out.loading}
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
                  <div className="px-6 py-5">
                    {out.error && (
                      <p className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {out.error}
                      </p>
                    )}
                    {out.loading ? (
                      <Skeleton />
                    ) : (
                      out.text && <FormattedText text={out.text} />
                    )}
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

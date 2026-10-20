"use client";
import { useEffect, useRef, useState } from "react";
import { AppNav } from "../../components/AppNav";
import { ModelCard } from "../../components/ModelPicker";
import { card, field, ghostBtn } from "../../components/styles";
import {
  CheckIcon,
  FileIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "../../components/icons";
import {
  formatUsd,
  type ModelOption,
  readJson,
  useCountUp,
} from "../../lib/client";

type Link = { label: string; url: string; note: string };
type Resume = {
  id: number;
  fileName: string;
  createdAt: string;
  preview: string;
};
type Usage = {
  total: number;
  last30: number;
  count: number;
  avgPerProposal: number;
  byModel: { model: string; cost: number; count: number }[];
};

const MAX_LINKS = 15;
const put = (body: object) =>
  fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(readJson);

function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-1 text-sm text-zinc-500">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-white/[0.03]">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-medium tabular-nums">{value}</p>
    </div>
  );
}

function SpendCard({
  usage,
  models,
}: {
  usage: Usage | null;
  models: ModelOption[];
}) {
  const total = useCountUp(usage?.total ?? 0, 900);
  const max = Math.max(...(usage?.byModel.map((m) => m.cost) ?? [0]), 0);
  const name = (id: string) => models.find((m) => m.id === id)?.name ?? id;

  return (
    <section className={`${card} animate-fade-up p-6`}>
      <SectionTitle
        title="Spend"
        hint="Exact amounts billed by OpenRouter for each generation."
      />
      <p className="font-mono text-5xl font-semibold tracking-tight tabular-nums">
        {usage ? formatUsd(total) : "–"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">total spent</p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat
          label="Last 30 days"
          value={usage ? formatUsd(usage.last30) : "–"}
        />
        <Stat label="Generations" value={usage ? String(usage.count) : "–"} />
        <Stat
          label="Avg / proposal"
          value={usage ? formatUsd(usage.avgPerProposal) : "–"}
        />
      </div>
      {usage && usage.byModel.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            By model
          </p>
          {usage.byModel.map((m, i) => (
            <div key={m.model}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{name(m.model)}</span>
                <span className="font-mono text-zinc-500 tabular-nums">
                  {formatUsd(m.cost)} · {m.count}×
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                <div
                  className="h-full origin-left animate-[grow_0.8s_cubic-bezier(0.22,1,0.36,1)_both] rounded-full bg-zinc-900 dark:bg-white"
                  style={{
                    width: `${max ? Math.max(2, (m.cost / max) * 100) : 0}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {usage && usage.count === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          No generations yet. Costs show up here after your first run.
        </p>
      )}
    </section>
  );
}

function LinksCard() {
  const [portfolio, setPortfolio] = useState("");
  const [github, setGithub] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then(readJson)
      .then(({ profile }) => {
        setPortfolio(profile.portfolio_url);
        setGithub(profile.github_url);
        setLinks(profile.links);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const update = (i: number, patch: Partial<Link>) => {
    setLinks((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    setStatus("idle");
  };

  const save = async () => {
    setStatus("saving");
    setError("");
    try {
      const { profile } = await put({
        portfolio_url: portfolio,
        github_url: github,
        links,
      });
      setLinks(profile.links);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
    }
  };

  return (
    <section
      className={`${card} animate-fade-up p-6`}
      style={{ animationDelay: "80ms" }}
    >
      <SectionTitle
        title="Links"
        hint="When “Include links” is on, Pitchr only adds the ones that fit the job. The note tells it what each link shows."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Portfolio site
          </span>
          <input
            className={field}
            placeholder="https://yourname.dev"
            value={portfolio}
            onChange={(e) => {
              setPortfolio(e.target.value);
              setStatus("idle");
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">GitHub</span>
          <input
            className={field}
            placeholder="https://github.com/you"
            value={github}
            onChange={(e) => {
              setGithub(e.target.value);
              setStatus("idle");
            }}
          />
        </label>
      </div>

      <div className="mt-6 mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Projects</span>
        <span className="text-xs text-zinc-400">
          {links.length}/{MAX_LINKS}
        </span>
      </div>
      <div className="space-y-2">
        {links.map((l, i) => (
          <div
            key={i}
            className="grid animate-pop-in gap-2 rounded-2xl border border-zinc-200 p-3 sm:grid-cols-[1fr_1.4fr_auto] dark:border-white/10"
          >
            <input
              className={`${field} py-2`}
              placeholder="Name, e.g. Booking SaaS"
              value={l.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <input
              className={`${field} py-2`}
              placeholder="https://…"
              value={l.url}
              onChange={(e) => update(i, { url: e.target.value })}
            />
            <button
              className={`${ghostBtn} h-auto justify-self-end self-stretch px-2.5 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400`}
              onClick={() => {
                setLinks((ls) => ls.filter((_, j) => j !== i));
                setStatus("idle");
              }}
              aria-label={`Remove ${l.label || "link"}`}
            >
              <TrashIcon width={13} height={13} />
            </button>
            <input
              className={`${field} py-2 sm:col-span-3`}
              placeholder="What it shows, e.g. Next.js + Supabase app, 2k users, Stripe billing"
              value={l.note}
              onChange={(e) => update(i, { note: e.target.value })}
            />
          </div>
        ))}
      </div>
      <button
        className={`${ghostBtn} mt-3`}
        disabled={links.length >= MAX_LINKS}
        onClick={() =>
          setLinks((ls) => [...ls, { label: "", url: "", note: "" }])
        }
      >
        <PlusIcon width={13} height={13} />
        Add project
      </button>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-white/[0.06]">
        {error && (
          <p className="mr-auto text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          onClick={save}
          disabled={status === "saving"}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {status === "saved" ? (
            <>
              <CheckIcon width={14} height={14} /> Saved
            </>
          ) : status === "saving" ? (
            "Saving…"
          ) : (
            <>
              <LinkIcon width={14} height={14} /> Save links
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function ResumesCard() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = () =>
    fetch("/api/resumes")
      .then(readJson)
      .then((d) => {
        setResumes(d.resumes);
        setActiveId(d.activeId);
      })
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const makeActive = async (id: number) => {
    setActiveId(id);
    try {
      await put({ active_resume_id: id });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (id: number) => {
    setError("");
    try {
      await readJson(await fetch(`/api/resumes/${id}`, { method: "DELETE" }));
      setConfirmId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      await readJson(
        await fetch("/api/upload", { method: "POST", body: formData }),
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section
      className={`${card} animate-fade-up p-6`}
      style={{ animationDelay: "120ms" }}
    >
      <SectionTitle
        title="Resumes"
        hint="The active one is used for every generation."
        action={
          <button
            className={ghostBtn}
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            <UploadIcon width={13} height={13} />
            {uploading ? "Uploading…" : "Upload PDF"}
          </button>
        }
      />
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="space-y-2">
        {resumes.length === 0 && (
          <p className="text-sm text-zinc-500">No resumes yet.</p>
        )}
        {resumes.map((r) => {
          const active = r.id === activeId;
          return (
            <div
              key={r.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                active
                  ? "border-zinc-900 dark:border-white/50"
                  : "border-zinc-200 dark:border-white/10"
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
                <FileIcon width={16} height={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{r.fileName}</span>
                  {active && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  Uploaded {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!active && (
                <button className={ghostBtn} onClick={() => makeActive(r.id)}>
                  Use this
                </button>
              )}
              {confirmId === r.id ? (
                <button
                  className={`${ghostBtn} border-red-300 text-red-600 dark:border-red-500/40 dark:text-red-400`}
                  onClick={() => remove(r.id)}
                  onBlur={() => setConfirmId(null)}
                  autoFocus
                >
                  Confirm delete
                </button>
              ) : (
                <button
                  className={`${ghostBtn} px-2.5`}
                  onClick={() => setConfirmId(r.id)}
                  aria-label={`Delete ${r.fileName}`}
                >
                  <TrashIcon width={13} height={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DefaultModelCard({
  models,
  value,
  onChange,
}: {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <section
      className={`${card} animate-fade-up p-6`}
      style={{ animationDelay: "160ms" }}
    >
      <SectionTitle
        title="Default model"
        hint="Used for new generations. You can still switch per run in the workspace. Only Sonnet 5.5 has been tuned against Pitchr's prompts so far."
      />
      <div className="grid gap-2">
        {models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            selected={m.id === value}
            onSelect={() => onChange(m.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function ProfileView({ email }: { email: string }) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [defaultModel, setDefaultModel] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/usage").then(readJson),
      fetch("/api/models").then(readJson),
      fetch("/api/profile").then(readJson),
    ])
      .then(([u, m, p]) => {
        setUsage(u);
        setModels(m.models);
        setDefaultModel(p.profile.default_model);
      })
      .catch(() => {});
  }, []);

  const changeDefault = (id: string) => {
    setDefaultModel(id);
    put({ default_model: id }).catch(() => {});
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppNav email={email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-24">
        <h1 className="mb-6 animate-fade-up text-3xl font-semibold tracking-[-0.03em]">
          Profile
        </h1>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div className="flex flex-col gap-6">
            <LinksCard />
            <ResumesCard />
          </div>
          <div className="flex flex-col gap-6 lg:sticky lg:top-20">
            <SpendCard usage={usage} models={models} />
            <DefaultModelCard
              models={models}
              value={defaultModel}
              onChange={changeDefault}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

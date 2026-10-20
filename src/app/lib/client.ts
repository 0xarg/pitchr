"use client";
import { useEffect, useRef, useState } from "react";

export type GenerateMeta = {
  model: string;
  cost: number;
  promptTokens: number | null;
  completionTokens: number | null;
  durationMs: number;
};

export type ModelOption = {
  id: string;
  name: string;
  tagline: string;
  recommended?: boolean;
  tested?: boolean;
  inputPerM: number | null;
  outputPerM: number | null;
  estPerRun: number | null;
};

const META_SEPARATOR = "\u001e";

function onUnauthorized(status: number) {
  if (status === 401) window.location.href = "/login?next=/app";
}

export async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  onUnauthorized(res.status);
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Streams generated text into onText; resolves with the cost metadata.
export async function streamGenerate(
  body: Record<string, unknown>,
  onText: (text: string) => void,
): Promise<{ text: string; meta: GenerateMeta }> {
  const res = await fetch("/api/proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) await readJson(res);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const sep = buf.indexOf(META_SEPARATOR);
    onText(sep === -1 ? buf : buf.slice(0, sep));
  }

  const sep = buf.indexOf(META_SEPARATOR);
  if (sep === -1) throw new Error("The response ended unexpectedly");
  const meta = JSON.parse(buf.slice(sep + 1));
  if (meta.error) throw new Error(meta.error);
  return { text: buf.slice(0, sep), meta };
}

export function formatUsd(n: number) {
  if (n === 0) return "$0.00";
  if (n < 0.0001) return "<$0.0001";
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function formatTokens(n: number | null) {
  return n == null ? "–" : n.toLocaleString("en-US");
}

// Animates a number from its previous value to the new one.
export function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(initial + (target - initial) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

// Closes a popover when clicking outside it or pressing Escape.
export function useDismiss<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

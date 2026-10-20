import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_MODEL, isAllowedModel } from "./models";

export type ProfileLink = { label: string; url: string; note: string };

export type Profile = {
  portfolio_url: string;
  github_url: string;
  links: ProfileLink[];
  default_model: string;
  active_resume_id: number | null;
};

export const MAX_LINKS = 15;

const EMPTY: Profile = {
  portfolio_url: "",
  github_url: "",
  links: [],
  default_model: DEFAULT_MODEL,
  active_resume_id: null,
};

export function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile> {
  const { data } = await supabase
    .from("profiles")
    .select("portfolio_url, github_url, links, default_model, active_resume_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return EMPTY;
  return {
    portfolio_url: data.portfolio_url ?? "",
    github_url: data.github_url ?? "",
    links: Array.isArray(data.links) ? data.links : [],
    default_model: isAllowedModel(data.default_model)
      ? data.default_model
      : DEFAULT_MODEL,
    active_resume_id: data.active_resume_id ?? null,
  };
}

// Validates untrusted input from the profile form. Returns an error message
// or the cleaned fields.
export function parseProfileInput(
  body: unknown,
): { error: string } | { value: Partial<Profile> } {
  const b = (body ?? {}) as Record<string, unknown>;
  const value: Partial<Profile> = {};

  for (const key of ["portfolio_url", "github_url"] as const) {
    if (key in b) {
      const v = typeof b[key] === "string" ? (b[key] as string).trim() : "";
      if (v && !isHttpUrl(v)) return { error: `${key} must be an http(s) URL` };
      value[key] = v;
    }
  }

  if ("links" in b) {
    if (!Array.isArray(b.links)) return { error: "links must be a list" };
    if (b.links.length > MAX_LINKS)
      return { error: `At most ${MAX_LINKS} links` };
    const links: ProfileLink[] = [];
    for (const raw of b.links) {
      const l = (raw ?? {}) as Record<string, unknown>;
      const label = String(l.label ?? "")
        .trim()
        .slice(0, 80);
      const url = String(l.url ?? "").trim();
      const note = String(l.note ?? "")
        .trim()
        .slice(0, 200);
      if (!label && !url) continue;
      if (!isHttpUrl(url))
        return { error: `"${label || url}" needs a valid URL` };
      links.push({ label: label || url, url, note });
    }
    value.links = links;
  }

  if ("default_model" in b) {
    if (!isAllowedModel(b.default_model)) return { error: "Unknown model" };
    value.default_model = b.default_model;
  }

  if ("active_resume_id" in b) {
    const id = b.active_resume_id;
    if (id !== null && !Number.isInteger(id))
      return { error: "Invalid resume id" };
    value.active_resume_id = id as number | null;
  }

  return { value };
}

// All links as a list the model can choose from.
export function profileLinks(p: Profile): ProfileLink[] {
  const out: ProfileLink[] = [];
  if (p.portfolio_url)
    out.push({
      label: "Portfolio",
      url: p.portfolio_url,
      note: "Personal portfolio site",
    });
  if (p.github_url)
    out.push({ label: "GitHub", url: p.github_url, note: "GitHub profile" });
  return out.concat(p.links);
}

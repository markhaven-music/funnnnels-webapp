import { supabase } from "@/lib/supabase";

export type WorkspaceSettings = {
  name: string;
  timezone: string;
  currency: string;
  brandPrimary: string;
  brandAccent: string;
  brandFont: string;
  logoUrl: string;
};

type Row = {
  name: string;
  timezone: string;
  currency: string;
  brand_primary: string;
  brand_accent: string;
  brand_font: string;
  logo_url: string;
};

const DEFAULTS: WorkspaceSettings = {
  name: "My workspace",
  timezone: "UTC",
  currency: "USD",
  brandPrimary: "#7c3aed",
  brandAccent: "#a78bfa",
  brandFont: "Inter",
  logoUrl: "",
};

function rowToSettings(r: Row): WorkspaceSettings {
  return {
    name: r.name,
    timezone: r.timezone,
    currency: r.currency,
    brandPrimary: r.brand_primary,
    brandAccent: r.brand_accent,
    brandFont: r.brand_font,
    logoUrl: r.logo_url,
  };
}

export async function getWorkspace(): Promise<WorkspaceSettings> {
  const { data, error } = await supabase()
    .from("workspace_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSettings(data as Row) : { ...DEFAULTS };
}

export async function updateWorkspace(
  patch: Partial<WorkspaceSettings>,
): Promise<WorkspaceSettings> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.timezone !== undefined) update.timezone = patch.timezone;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.brandPrimary !== undefined) update.brand_primary = patch.brandPrimary;
  if (patch.brandAccent !== undefined) update.brand_accent = patch.brandAccent;
  if (patch.brandFont !== undefined) update.brand_font = patch.brandFont;
  if (patch.logoUrl !== undefined) update.logo_url = patch.logoUrl;
  const { data, error } = await supabase()
    .from("workspace_settings")
    .update(update)
    .eq("id", 1)
    .select("*")
    .single();
  if (error) throw error;
  return rowToSettings(data as Row);
}

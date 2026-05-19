import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "workspace.json");

export type WorkspaceSettings = {
  name: string;
  timezone: string;
  currency: string;
  brandPrimary: string;
  brandAccent: string;
  brandFont: string;
  logoUrl: string;
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

export async function getWorkspace(): Promise<WorkspaceSettings> {
  try {
    return { ...DEFAULTS, ...JSON.parse(await fs.readFile(FILE, "utf-8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function updateWorkspace(
  patch: Partial<WorkspaceSettings>,
): Promise<WorkspaceSettings> {
  const next = { ...(await getWorkspace()), ...patch };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

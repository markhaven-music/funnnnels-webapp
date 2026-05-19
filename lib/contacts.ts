import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "contacts.json");

export type Contact = {
  id: string;
  email: string;
  name?: string;
  source?: string;
  tags?: string[];
  createdAt: string;
};

type Store = { contacts: Contact[] };

async function load(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8")) as Store;
  } catch {
    return { contacts: [] };
  }
}

async function persist(s: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(s, null, 2), "utf-8");
}

export async function listContacts(): Promise<Contact[]> {
  return (await load()).contacts;
}

export async function addContact(
  data: Omit<Contact, "id" | "createdAt">,
): Promise<Contact> {
  const s = await load();
  const c: Contact = {
    id: Math.random().toString(36).slice(2, 10),
    ...data,
    createdAt: new Date().toISOString(),
  };
  s.contacts.unshift(c);
  await persist(s);
  return c;
}

export async function deleteContact(id: string): Promise<boolean> {
  const s = await load();
  const before = s.contacts.length;
  s.contacts = s.contacts.filter((c) => c.id !== id);
  if (s.contacts.length === before) return false;
  await persist(s);
  return true;
}

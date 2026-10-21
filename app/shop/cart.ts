import { useSyncExternalStore } from "react";

// The shop's cart, in the browser: the slugs of the products in it, in the
// order they were added, kept in localStorage so it survives reloads and is
// shared by every tab. Prices aren't kept: the pages carry today's, and the
// checkout's server prices the cart again (lib/shop.ts priceCart).

const KEY = "shop:cart";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let current: string[] | null = null;

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? [...new Set(v.filter((s): s is string => typeof s === "string"))] : [];
  } catch {
    return []; // no storage (private mode) or a broken value: an empty cart
  }
}

function snapshot(): string[] {
  current ??= read();
  return current;
}

function write(next: string[]) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // no storage: the cart lasts as long as the page
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the cart.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The cart's slugs; empty while the page hydrates (the server has no cart). */
export function useCart(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export const cart = {
  add(slugs: readonly string[]) {
    write([...new Set([...snapshot(), ...slugs])]);
  },
  remove(slugs: readonly string[]) {
    write(snapshot().filter((s) => !slugs.includes(s)));
  },
};

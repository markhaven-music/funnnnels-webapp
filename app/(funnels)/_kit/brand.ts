import { funnel as jazz } from "../jazz-midi-pack/funnel";

// What every template product shares with the Jazz pack: the brand, its
// tracking accounts, support address, legal pages and guarantee.
export const BRAND = {
  name: jazz.brand,
  tracking: jazz.tracking,
  support: jazz.support,
  legal: jazz.legal,
  guaranteeDays: jazz.guaranteeDays,
} as const;

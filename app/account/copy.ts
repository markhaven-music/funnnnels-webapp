import { frenchSpaces } from "@/app/(funnels)/midi-drum-kit/landing";
import type { Lang } from "@/lib/account";

// The words of the customer login (/account) and of its email, per language.
// French: "tu", like the funnels, and its spaces before ? ! : (frenchSpaces).

const en = {
  meta: "Your downloads · Grind Studio",
  title: "Your downloads",
  lead: "Sign in with the email you used at checkout. No password: we email you a link.",
  steps: ["Enter your email", "Open the link we email you", "Download your packs"],
  label: "The email you bought with",
  placeholder: "you@email.com",
  button: "Email me my link",
  busy: "Sending…",
  invalid: "That email doesn't look right.",
  failed: "We couldn't send the email right now. Try again in a minute.",
  wait: "We just sent a link to this email. Wait a minute before asking for another one.",
  off: "Sign-in by email isn't switched on yet. Write to us and we'll send your downloads.",
  sentTitle: "Check your inbox",
  sentLead: (email: string) => `If ${email} has purchases, your sign-in link is on its way. Open it on this device or any other: it works for 30 minutes.`,
  sentHelp: "Nothing after a minute? Look in Spam or Promotions, and check it's the email you paid with.",
  again: "Use another email",
  expired: "That link has expired. Enter your email to get a new one.",
  support: "A problem? Write to us at",
  hello: "Your purchases",
  sub: (email: string) => `Everything bought with ${email}.`,
  none: "We found no purchases with this email. Bought with another one? Sign out and use that one, or write to us.",
  bought: (date: string) => `Bought on ${date}`,
  download: "Download",
  signOut: "Sign out",
  dev: "Dev only (no email is sent here): open the link",
  email: {
    subject: "Your Grind Studio sign-in link",
    title: "Your downloads",
    hi: "Hi! Tap the button to see your downloads.",
    button: "Open my downloads",
    note: "The link works for 30 minutes. Didn't ask for it? Ignore this email: nothing happens.",
    help: "A problem? Write to us:",
  },
};

type Copy = typeof en;

const fr: Copy = {
  meta: "Tes téléchargements · Grind Studio",
  title: "Tes téléchargements",
  lead: "Connecte-toi avec l'email de ta commande. Pas de mot de passe : on t'envoie un lien par email.",
  steps: ["Entre ton email", "Ouvre le lien reçu par email", "Télécharge tes packs"],
  label: "L'email de ta commande",
  placeholder: "toi@email.com",
  button: "Recevoir mon lien",
  busy: "Envoi…",
  invalid: "Cet email n'a pas l'air correct.",
  failed: "L'email n'est pas parti. Réessaie dans une minute.",
  wait: "On vient d'envoyer un lien à cet email. Attends une minute avant d'en demander un autre.",
  off: "La connexion par email n'est pas encore activée. Écris-nous et on t'envoie tes téléchargements.",
  sentTitle: "Regarde ta boîte mail",
  sentLead: (email: string) => `Si ${email} a des achats, ton lien de connexion arrive. Ouvre-le sur cet appareil ou un autre : il marche pendant 30 minutes.`,
  sentHelp: "Rien après une minute ? Regarde dans les spams ou l'onglet Promotions, et vérifie que c'est bien l'email de ta commande.",
  again: "Utiliser un autre email",
  expired: "Ce lien a expiré. Entre ton email pour en recevoir un nouveau.",
  support: "Un problème ? Écris-nous à",
  hello: "Tes achats",
  sub: (email: string) => `Tout ce que tu as acheté avec ${email}.`,
  none: "Aucun achat trouvé avec cet email. Tu as commandé avec une autre adresse ? Déconnecte-toi et utilise celle-là, ou écris-nous.",
  bought: (date: string) => `Acheté le ${date}`,
  download: "Télécharger",
  signOut: "Se déconnecter",
  dev: "Dev seulement (aucun email n'est envoyé ici) : ouvrir le lien",
  email: {
    subject: "Ton lien de connexion Grind Studio",
    title: "Tes téléchargements",
    hi: "Salut ! Clique sur le bouton pour retrouver tes téléchargements.",
    button: "Voir mes téléchargements",
    note: "Le lien marche pendant 30 minutes. Tu n'as rien demandé ? Ignore cet email : il ne se passe rien.",
    help: "Un problème ? Écris-nous :",
  },
};

// French spacing on every French string (functions too).
function spaced<T>(v: T): T {
  if (typeof v === "string") return frenchSpaces(v) as T;
  if (typeof v === "function") return ((...a: unknown[]) => frenchSpaces((v as (...a: unknown[]) => string)(...a))) as T;
  if (Array.isArray(v)) return v.map(spaced) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, spaced(x)])) as T;
  return v;
}

const COPY: Record<Lang, Copy> = { en, fr: spaced(fr) };
export const copyFor = (lang: Lang) => COPY[lang];
export const LANG_NAMES: Record<Lang, string> = { en: "English", fr: "Français" };

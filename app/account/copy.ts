import { frenchSpaces } from "@/app/(funnels)/midi-drum-kit/landing";
import type { Lang } from "@/lib/account";

// The words of the customer login (/account) and of its email, per language.
// French: "tu", like the funnels, and its spaces before ? ! : (frenchSpaces).
// Spanish: "tú", neutral for Spain and Latin America, like the funnel.
// German: "du", like the funnel. Italian: "tu", like the funnel.

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

const es: Copy = {
  meta: "Tus descargas · Grind Studio",
  title: "Tus descargas",
  lead: "Entra con el email que usaste al comprar. Sin contraseña: te enviamos un enlace por email.",
  steps: ["Escribe tu email", "Abre el enlace que te enviamos", "Descarga tus packs"],
  label: "El email con el que compraste",
  placeholder: "tu@email.com",
  button: "Enviarme el enlace",
  busy: "Enviando…",
  invalid: "Ese email no parece correcto.",
  failed: "No pudimos enviar el email ahora mismo. Inténtalo de nuevo en un minuto.",
  wait: "Acabamos de enviar un enlace a este email. Espera un minuto antes de pedir otro.",
  off: "El acceso por email todavía no está activado. Escríbenos y te enviamos tus descargas.",
  sentTitle: "Revisa tu bandeja de entrada",
  sentLead: (email: string) => `Si ${email} tiene compras, tu enlace de acceso está en camino. Ábrelo en este dispositivo o en otro: funciona durante 30 minutos.`,
  sentHelp: "¿No llega nada en un minuto? Mira en Spam o Promociones, y comprueba que sea el email con el que pagaste.",
  again: "Usar otro email",
  expired: "Ese enlace ha expirado. Escribe tu email para recibir uno nuevo.",
  support: "¿Algún problema? Escríbenos a",
  hello: "Tus compras",
  sub: (email: string) => `Todo lo que compraste con ${email}.`,
  none: "No encontramos compras con este email. ¿Compraste con otro? Cierra sesión y usa ese, o escríbenos.",
  bought: (date: string) => `Comprado el ${date}`,
  download: "Descargar",
  signOut: "Cerrar sesión",
  dev: "Solo en desarrollo (aquí no se envía ningún email): abrir el enlace",
  email: {
    subject: "Tu enlace de acceso a Grind Studio",
    title: "Tus descargas",
    hi: "¡Hola! Haz clic en el botón para ver tus descargas.",
    button: "Abrir mis descargas",
    note: "El enlace funciona durante 30 minutos. ¿No lo pediste? Ignora este email: no pasa nada.",
    help: "¿Algún problema? Escríbenos:",
  },
};

const de: Copy = {
  meta: "Deine Downloads · Grind Studio",
  title: "Deine Downloads",
  lead: "Melde dich mit der E-Mail an, mit der du bestellt hast. Kein Passwort: Wir schicken dir einen Link per E-Mail.",
  steps: ["Gib deine E-Mail ein", "Öffne den Link aus der E-Mail", "Lade deine Packs herunter"],
  label: "Die E-Mail deiner Bestellung",
  placeholder: "du@email.com",
  button: "Link per E-Mail senden",
  busy: "Wird gesendet…",
  invalid: "Diese E-Mail sieht nicht richtig aus.",
  failed: "Die E-Mail konnte gerade nicht gesendet werden. Versuch es in einer Minute noch einmal.",
  wait: "Wir haben gerade einen Link an diese E-Mail geschickt. Warte eine Minute, bevor du einen neuen anforderst.",
  off: "Die Anmeldung per E-Mail ist noch nicht aktiv. Schreib uns und wir schicken dir deine Downloads.",
  sentTitle: "Schau in dein Postfach",
  sentLead: (email: string) => `Wenn ${email} Käufe hat, ist dein Anmeldelink unterwegs. Öffne ihn auf diesem oder einem anderen Gerät: Er gilt 30 Minuten.`,
  sentHelp: "Nach einer Minute noch nichts da? Schau im Spam oder unter „Werbung“ nach und prüf, ob es die E-Mail ist, mit der du bezahlt hast.",
  again: "Andere E-Mail verwenden",
  expired: "Dieser Link ist abgelaufen. Gib deine E-Mail ein, um einen neuen zu bekommen.",
  support: "Ein Problem? Schreib uns an",
  hello: "Deine Käufe",
  sub: (email: string) => `Alles, was du mit ${email} gekauft hast.`,
  none: "Wir haben keine Käufe mit dieser E-Mail gefunden. Mit einer anderen bestellt? Melde dich ab und nimm die, oder schreib uns.",
  bought: (date: string) => `Gekauft am ${date}`,
  download: "Herunterladen",
  signOut: "Abmelden",
  dev: "Nur in der Entwicklung (hier wird keine E-Mail gesendet): Link öffnen",
  email: {
    subject: "Dein Anmeldelink für Grind Studio",
    title: "Deine Downloads",
    hi: "Hallo! Klick auf den Button, um deine Downloads zu sehen.",
    button: "Meine Downloads öffnen",
    note: "Der Link gilt 30 Minuten. Du hast ihn nicht angefordert? Ignoriere diese E-Mail: Es passiert nichts.",
    help: "Ein Problem? Schreib uns:",
  },
};

const it: Copy = {
  meta: "I tuoi download · Grind Studio",
  title: "I tuoi download",
  lead: "Accedi con l'email che hai usato per l'acquisto. Niente password: ti mandiamo un link via email.",
  steps: ["Inserisci la tua email", "Apri il link che ti mandiamo", "Scarica i tuoi pack"],
  label: "L'email del tuo acquisto",
  placeholder: "tu@email.com",
  button: "Mandami il link",
  busy: "Invio in corso…",
  invalid: "Questa email non sembra corretta.",
  failed: "Non siamo riusciti a inviare l'email. Riprova tra un minuto.",
  wait: "Abbiamo appena mandato un link a questa email. Aspetta un minuto prima di chiederne un altro.",
  off: "L'accesso via email non è ancora attivo. Scrivici e ti mandiamo i tuoi download.",
  sentTitle: "Controlla la tua casella",
  sentLead: (email: string) => `Se ${email} ha degli acquisti, il tuo link di accesso è in arrivo. Aprilo su questo dispositivo o su un altro: vale 30 minuti.`,
  sentHelp: "Dopo un minuto non è arrivato niente? Guarda in Spam o in Promozioni, e controlla che sia l'email con cui hai pagato.",
  again: "Usa un'altra email",
  expired: "Questo link è scaduto. Inserisci la tua email per riceverne uno nuovo.",
  support: "Un problema? Scrivici a",
  hello: "I tuoi acquisti",
  sub: (email: string) => `Tutto quello che hai comprato con ${email}.`,
  none: "Non abbiamo trovato acquisti con questa email. Hai comprato con un'altra? Esci e usa quella, oppure scrivici.",
  bought: (date: string) => `Acquistato il ${date}`,
  download: "Scarica",
  signOut: "Esci",
  dev: "Solo in sviluppo (qui non parte nessuna email): apri il link",
  email: {
    subject: "Il tuo link di accesso a Grind Studio",
    title: "I tuoi download",
    hi: "Ciao! Clicca il pulsante per vedere i tuoi download.",
    button: "Apri i miei download",
    note: "Il link vale 30 minuti. Non l'hai chiesto tu? Ignora questa email: non succede nulla.",
    help: "Un problema? Scrivici:",
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

const COPY: Record<Lang, Copy> = { en, fr: spaced(fr), es, de, it };
export const copyFor = (lang: Lang) => COPY[lang];
export const LANG_NAMES: Record<Lang, string> = { en: "English", fr: "Français", es: "Español", de: "Deutsch", it: "Italiano" };

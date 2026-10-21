import { frenchSpaces } from "@/app/(funnels)/midi-drum-kit/landing";

// The words of the emails a buyer gets by themselves (lib/outbox.ts): the
// receipt with the downloads and the one abandoned-checkout reminder. Same
// voice as the funnels: French "tu", Spanish "tú", German "du".

const en = {
  receipt: {
    subject: (product: string) => `Your ${product} downloads`,
    title: "You're in.",
    lead: "Your files are below. These links don't expire: keep this email and download again any time.",
    download: (label: string) => `Download ${label}`,
    order: (id: string, amount: string, paypal: boolean) => `Order ${id} · ${amount} · paid by ${paypal ? "PayPal" : "card"}`,
    account: "All your downloads, any time: m.thegrind.studio/account",
    help: "A file doesn't open? Reply to this email or write to us:",
  },
  reminder: {
    subject: (product: string) => `Your ${product} is waiting`,
    title: (name: string, product: string) => `${name ? `${name}, y` : "Y"}our ${product} is waiting.`,
    lead: "You got to the checkout and stopped. Card declined, got distracted, had a question? Your order is one click away.",
    button: "Finish my order",
    notes: ["Question before you buy? Just reply: a human reads it.", "This is the only reminder we send about it."],
    help: "Write to us any time:",
  },
};

type Copy = typeof en;

const fr: Copy = {
  receipt: {
    subject: (product) => `Tes téléchargements : ${product}`,
    title: "C'est à toi.",
    lead: "Tes fichiers sont juste en dessous. Ces liens n'expirent pas : garde cet email et retélécharge quand tu veux.",
    download: (label) => `Télécharger ${label}`,
    order: (id, amount, paypal) => `Commande ${id} · ${amount} · payé par ${paypal ? "PayPal" : "carte"}`,
    account: "Tous tes téléchargements, à tout moment : m.thegrind.studio/account",
    help: "Un fichier ne s'ouvre pas ? Réponds à cet email ou écris-nous :",
  },
  reminder: {
    subject: (product) => `Ton ${product} t'attend`,
    title: (name, product) => `${name ? `${name}, t` : "T"}on ${product} t'attend.`,
    lead: "Tu es arrivé au paiement et tu t'es arrêté. Carte refusée, distrait, une question ? Ta commande est à un clic.",
    button: "Finir ma commande",
    notes: ["Une question avant d'acheter ? Réponds simplement : un humain te lit.", "C'est le seul rappel qu'on t'envoie."],
    help: "Écris-nous quand tu veux :",
  },
};

const es: Copy = {
  receipt: {
    subject: (product) => `Tus descargas: ${product}`,
    title: "¡Ya es tuyo!",
    lead: "Tus archivos están abajo. Estos enlaces no caducan: guarda este email y vuelve a descargar cuando quieras.",
    download: (label) => `Descargar ${label}`,
    order: (id, amount, paypal) => `Pedido ${id} · ${amount} · pagado con ${paypal ? "PayPal" : "tarjeta"}`,
    account: "Todas tus descargas, cuando quieras: m.thegrind.studio/account",
    help: "¿Un archivo no se abre? Responde a este email o escríbenos:",
  },
  reminder: {
    subject: (product) => `Tu ${product} te espera`,
    title: (name, product) => `${name ? `${name}, t` : "T"}u ${product} te espera.`,
    lead: "Llegaste al pago y te detuviste. ¿Tarjeta rechazada, te distrajiste, tenías una duda? Tu pedido está a un clic.",
    button: "Terminar mi pedido",
    notes: ["¿Una pregunta antes de comprar? Solo responde: lo lee una persona.", "Es el único recordatorio que te enviamos."],
    help: "Escríbenos cuando quieras:",
  },
};

const de: Copy = {
  receipt: {
    subject: (product) => `Deine Downloads: ${product}`,
    title: "Du bist dabei.",
    lead: "Deine Dateien findest du unten. Die Links laufen nicht ab: Heb diese E-Mail auf und lade jederzeit erneut herunter.",
    download: (label) => `${label} herunterladen`,
    order: (id, amount, paypal) => `Bestellung ${id} · ${amount} · bezahlt mit ${paypal ? "PayPal" : "Karte"}`,
    account: "Alle deine Downloads, jederzeit: m.thegrind.studio/account",
    help: "Eine Datei lässt sich nicht öffnen? Antworte auf diese E-Mail oder schreib uns:",
  },
  reminder: {
    subject: (product) => `Dein ${product} wartet`,
    title: (name, product) => `${name ? `${name}, d` : "D"}ein ${product} wartet.`,
    lead: "Du warst schon an der Kasse und hast aufgehört. Karte abgelehnt, abgelenkt, eine Frage? Deine Bestellung ist nur einen Klick entfernt.",
    button: "Bestellung abschließen",
    notes: ["Eine Frage vor dem Kauf? Antworte einfach: Hier liest ein Mensch.", "Das ist die einzige Erinnerung dazu."],
    help: "Schreib uns jederzeit:",
  },
};

const COPY: Record<string, Copy> = { en, fr, es, de };

/** The words for a language (English for any other), French spacing applied. */
export function mailCopy(lang: string | null | undefined): Copy {
  const c = COPY[lang ?? "en"] ?? en;
  if (lang !== "fr") return c;
  const sp = (s: string) => frenchSpaces(s);
  return {
    receipt: { ...c.receipt, subject: (p) => sp(c.receipt.subject(p)), title: sp(c.receipt.title), lead: sp(c.receipt.lead), account: sp(c.receipt.account), help: sp(c.receipt.help) },
    reminder: { ...c.reminder, title: (n, p) => sp(c.reminder.title(n, p)), lead: sp(c.reminder.lead), notes: c.reminder.notes.map(sp), help: sp(c.reminder.help) },
  };
}

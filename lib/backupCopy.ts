import { frenchSpaces } from "@/app/(funnels)/midi-drum-kit/landing";

// The "💾 Backup Link" email, copied from ClickFunnels (2026-10-30): the
// download links again, 10 minutes after the receipt, for buyers whose first
// email got buried (lib/outbox.ts). Every language follows the English line by
// line. ClickFunnels' line about a separate login email is left out: here the
// account signs in with a link sent to the same address.

const ACCOUNT = "[m.thegrind.studio/account](https://m.thegrind.studio/account)";

export type BackupCopy = {
  subject: (product: string) => string;
  /** Before the download buttons. */
  intro: (name: string) => string;
  /** After them. */
  outro: string;
  button: (label: string) => string;
};

const hey = (word: string, name: string) => `${word}${name ? ` ${name}` : ""},`;

const COPY: Record<string, BackupCopy> = {
  en: {
    subject: (p) => `💾 Backup Link: ${p}`,
    intro: (n) => `${hey("Hey", n)}

I want to make 100% sure you got your files.

Sometimes technology glitches or emails get buried.

Just in case you couldn't access the main download, here is a direct backup link to your files:`,
    outro: `**One important reminder:** for **lifetime access**, please use your **Customer Portal**: ${ACCOUNT}. Sign in with this email address.

That portal is your permanent "Vault."

If you switch computers or lose your hard drive in 2 years, that is where you will go to re-download everything.

Time to cook up.

Grind Studio`,
    button: (l) => `👉 Download ${l}`,
  },
  fr: {
    subject: (p) => `💾 Lien de secours : ${p}`,
    intro: (n) => `${hey("Salut", n)}

Je veux être sûr à 100 % que tu as bien reçu tes fichiers.

Parfois, la technologie bugue ou les emails se perdent.

Au cas où tu n'aurais pas pu accéder au téléchargement principal, voici un lien de secours direct vers tes fichiers :`,
    outro: `**Un rappel important :** pour un **accès à vie**, utilise ton **espace client** : ${ACCOUNT}. Connecte-toi avec cette adresse email.

Cet espace est ton « coffre-fort » permanent.

Si tu changes d'ordinateur ou que tu perds ton disque dur dans 2 ans, c'est là que tu iras pour tout retélécharger.

C'est l'heure de cuisiner.

Grind Studio`,
    button: (l) => `👉 Télécharger ${l}`,
  },
  es: {
    subject: (p) => `💾 Enlace de respaldo: ${p}`,
    intro: (n) => `${hey("Hola", n)}

Quiero asegurarme al 100 % de que recibiste tus archivos.

A veces la tecnología falla o los emails se pierden.

Por si no pudiste acceder a la descarga principal, aquí tienes un enlace de respaldo directo a tus archivos:`,
    outro: `**Un recordatorio importante:** para tener **acceso de por vida**, usa tu **portal de cliente**: ${ACCOUNT}. Entra con esta dirección de email.

Ese portal es tu “bóveda” permanente.

Si cambias de ordenador o pierdes tu disco duro dentro de 2 años, ahí es donde volverás a descargarlo todo.

Hora de cocinar.

Grind Studio`,
    button: (l) => `👉 Descargar ${l}`,
  },
  de: {
    subject: (p) => `💾 Backup-Link: ${p}`,
    intro: (n) => `${hey("Hey", n)}

ich will zu 100 % sichergehen, dass du deine Dateien bekommen hast.

Manchmal spinnt die Technik oder E-Mails gehen unter.

Falls du nicht an den Haupt-Download gekommen bist, hier ist ein direkter Backup-Link zu deinen Dateien:`,
    outro: `**Eine wichtige Erinnerung:** Für **lebenslangen Zugriff** nutze dein **Kundenportal**: ${ACCOUNT}. Melde dich mit dieser E-Mail-Adresse an.

Dieses Portal ist dein dauerhafter „Tresor“.

Wenn du den Computer wechselst oder in 2 Jahren deine Festplatte verlierst, lädst du dort alles erneut herunter.

Zeit zu kochen.

Grind Studio`,
    button: (l) => `👉 ${l} herunterladen`,
  },
  it: {
    subject: (p) => `💾 Link di backup: ${p}`,
    intro: (n) => `${hey("Ehi", n)}

voglio essere sicuro al 100% che tu abbia ricevuto i tuoi file.

A volte la tecnologia fa cilecca o le email finiscono sepolte.

Nel caso non fossi riuscito ad accedere al download principale, ecco un link di backup diretto ai tuoi file:`,
    outro: `**Un promemoria importante:** per l'**accesso a vita**, usa il tuo **portale clienti**: ${ACCOUNT}. Accedi con questo indirizzo email.

Quel portale è la tua “cassaforte” permanente.

Se cambi computer o perdi l'hard disk tra 2 anni, è lì che andrai a riscaricare tutto.

È ora di cucinare.

Grind Studio`,
    button: (l) => `👉 Scarica ${l}`,
  },
};

/** The words for a language (English for any other), French spacing applied. */
export function backupCopy(lang: string | null | undefined): BackupCopy {
  const c = COPY[lang ?? "en"] ?? COPY.en;
  if (lang !== "fr") return c;
  return { subject: (p) => frenchSpaces(c.subject(p)), intro: (n) => frenchSpaces(c.intro(n)), outro: frenchSpaces(c.outro), button: c.button };
}

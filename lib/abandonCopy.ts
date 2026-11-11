import { frenchSpaces } from "@/app/(funnels)/midi-drum-kit/landing";
import type { Currency } from "@/lib/geo";

// The MIDI Drum Kit's abandoned-checkout series, copied from ClickFunnels'
// "Abandoned Checkout (Meta Ads Funnel)" workflow (2026-10-29): 15 minutes
// after step 1, then 6 hours, then 18 hours later, until they buy
// (lib/outbox.ts). Every language follows the English line by line; the
// bodies use the letter format of lib/mail.ts (**bold**, [text](url)). The link
// is bold text in brackets, as ClickFunnels had it, not a button: a plain letter
// lands in Gmail's Promotions less often (11-06: "Sì, come CF").
// The other funnels keep the one reminder in lib/mailCopy.ts.

export type AbandonEmail = {
  /** Minutes after the checkout started (the first) or after the email before. */
  after: number;
  subject: (name: string) => string;
  preheader?: string;
  body: (o: { name: string; url: string; price: string }) => string;
};

const hey = (word: string, name: string, comma = ",") => `${word}${name ? ` ${name}` : ""}${comma}`;

const en: AbandonEmail[] = [
  {
    after: 15,
    subject: (n) => `Issue with your order${n ? ` ${n}` : ""}?`,
    preheader: "Did the link break?",
    body: ({ name, url }) => `${hey("Hey", name)}

Noticed you almost finished your order but didn't click submit.

Just checking — did the page crash?

I've saved your cart for you here just in case:

**[[Click To Get Your MIDI Drum Kit]](${url})**

Best,
Grind Studio`,
  },
  {
    after: 6 * 60,
    subject: () => "quick question about MIDI Drum Kit",
    body: ({ name, url }) => `${hey("Hey", name)}

you're probably busy, but I didn't want you to miss out.

If you're still on the fence about MIDI Drum Kit, just remember it helps you create Grammy-Level beats fast without manually writing all your drums from scratch.

Check out what Martin from New York said yesterday:

"I usually spend hours tweaking hi-hat velocities to get that bounce, but these MIDI files just have the right feel instantly. Dragged a pattern in, switched the sounds, and had a placement-ready beat in 15 minutes. Crazy value."

Here is the link to grab it:

**[[Click To Complete Your MIDI Drum Kit Order]](${url})**

Best,
Grind Studio`,
  },
  {
    after: 18 * 60,
    subject: () => "Permission to close your order? (+ Bonuses)",
    body: ({ name, url, price }) => `${hey("Hey", name)}

I haven't heard back from you, so I'm assuming you've decided to pass on the MIDI Drum Kit.

I'm going to close out your cart request tonight so I don't keep clogging up your inbox.

But before I do, I realized you maybe don't know that you are also walking away from the 6 free bonuses attached to MIDI Drum Kit.

If you complete your order today, you still get instant access to:

**BONUS #1: The Famous Beats Bundle** – We transcribed the drum patterns from charts-topping hits (Roddy Ricch, Drake, Travis Scott, etc.) so you can see the exact "hidden science" behind pro beats.

**BONUS #2: Beat Starters Bundle** – A massive folder of Chords, Melodies, Guitars, and Trap Plucks to destroy beat block instantly.

**BONUS #3: Hit-Maker Drums** – The hard-hitting Kicks, Snares, and Hats we used to create the demos. No recycling weak sounds.

**BONUS #4: Drunk Swing Grooves** – 211 MIDI files: drum grooves, groove templates and neo soul keys.

**BONUS #5: MYSTERY Hooks Pack** – 17 WAV hooks that leave space for the artist's voice.

**BONUS #6: MIDI Drum Kit Guide** – A PDF that shows what is in every folder and a way to go from an empty project to a full beat.

You get all 750+ MIDI Drum Patterns plus these 6 Bonuses for the single price of ${price}.

This is your last chance to grab the full bundle before the link expires.

**[[Click Here To Secure Your MIDI Kit + All 6 Free Bonuses]](${url})**

Let me know.

Best,
Grind Studio`,
  },
];

const fr: AbandonEmail[] = [
  {
    after: 15,
    subject: (n) => `Un souci avec ta commande${n ? ` ${n}` : ""} ?`,
    preheader: "Le lien a cassé ?",
    body: ({ name, url }) => `${hey("Salut", name)}

J'ai remarqué que tu as presque terminé ta commande, mais tu n'as pas cliqué sur valider.

Je vérifie juste : la page a planté ?

J'ai sauvegardé ton panier ici, au cas où :

**[[Clique ici pour avoir ton MIDI Drum Kit]](${url})**

À bientôt,
Grind Studio`,
  },
  {
    after: 6 * 60,
    subject: () => "petite question sur le MIDI Drum Kit",
    body: ({ name, url }) => `${hey("Salut", name)}

tu es sûrement occupé, mais je ne voulais pas que tu passes à côté.

Si tu hésites encore pour le MIDI Drum Kit, rappelle-toi juste qu'il t'aide à créer des beats de niveau Grammy rapidement, sans écrire toutes tes drums à la main en partant de zéro.

Regarde ce que Martin, de New York, a dit hier :

« D'habitude, je passe des heures à régler la vélocité des hi-hats pour avoir ce bounce, mais ces fichiers MIDI ont direct le bon feel. J'ai glissé un pattern, changé les sons, et j'avais un beat prêt pour un placement en 15 minutes. Un rapport qualité-prix de fou. »

Voici le lien pour le prendre :

**[[Clique ici pour finaliser ta commande du MIDI Drum Kit]](${url})**

À bientôt,
Grind Studio`,
  },
  {
    after: 18 * 60,
    subject: () => "Je peux fermer ta commande ? (+ Bonus)",
    body: ({ name, url, price }) => `${hey("Salut", name)}

Je n'ai pas eu de nouvelles, alors je suppose que tu as décidé de passer ton tour sur le MIDI Drum Kit.

Je vais fermer ta demande de panier ce soir pour ne pas continuer à encombrer ta boîte mail.

Mais avant, je me suis dit que tu ne savais peut-être pas que tu renonces aussi aux 6 bonus gratuits inclus avec le MIDI Drum Kit.

Si tu finalises ta commande aujourd'hui, tu as toujours un accès immédiat à :

**BONUS N°1 : Famous Beats Bundle** – On a transcrit les patterns de batterie de hits en tête des charts (Roddy Ricch, Drake, Travis Scott, etc.) pour que tu voies la « science cachée » exacte derrière les beats des pros.

**BONUS N°2 : Beat Starters Bundle** – Un énorme dossier d'accords, de mélodies, de guitares et de plucks trap pour détruire le blocage créatif instantanément.

**BONUS N°3 : Hit-Maker Drums** – Les kicks, snares et hats qui frappent fort qu'on a utilisés pour créer les démos. Pas de sons faibles recyclés.

**BONUS N°4 : Drunk Swing Grooves** – 211 fichiers MIDI : grooves de batterie, templates de groove et accords neo soul.

**BONUS N°5 : MYSTERY Hooks Pack** – 17 hooks WAV qui laissent de la place à la voix de l'artiste.

**BONUS N°6 : Guide du MIDI Drum Kit** – Un PDF (en anglais) qui montre ce qu'il y a dans chaque dossier et comment passer d'un projet vide à un beat complet.

Tu as les 750+ patterns de batterie MIDI plus ces 6 bonus pour un prix unique de ${price}.

C'est ta dernière chance d'avoir le bundle complet avant que le lien expire.

**[[Clique ici pour assurer ton MIDI Kit + les 6 bonus gratuits]](${url})**

Dis-moi.

À bientôt,
Grind Studio`,
  },
];

const es: AbandonEmail[] = [
  {
    after: 15,
    subject: (n) => `¿Problema con tu pedido${n ? ` ${n}` : ""}?`,
    preheader: "¿Se rompió el enlace?",
    body: ({ name, url }) => `${hey("Hola", name)}

Vi que casi terminaste tu pedido, pero no hiciste clic en enviar.

Solo quería comprobar: ¿se colgó la página?

Te guardé el carrito aquí, por si acaso:

**[[Haz clic para conseguir tu MIDI Drum Kit]](${url})**

Saludos,
Grind Studio`,
  },
  {
    after: 6 * 60,
    subject: () => "una pregunta rápida sobre el MIDI Drum Kit",
    body: ({ name, url }) => `${hey("Hola", name)}

seguramente estás ocupado, pero no quería que te lo perdieras.

Si todavía dudas sobre el MIDI Drum Kit, recuerda que te ayuda a crear beats de nivel Grammy rápido, sin escribir a mano toda tu batería desde cero.

Mira lo que dijo ayer Martin, de Nueva York:

“Normalmente paso horas ajustando la velocity de los hi-hats para conseguir ese bounce, pero estos archivos MIDI tienen el feel correcto al instante. Arrastré un patrón, cambié los sonidos y tenía un beat listo para un placement en 15 minutos. Un valor increíble.”

Aquí tienes el enlace para conseguirlo:

**[[Haz clic para completar tu pedido del MIDI Drum Kit]](${url})**

Saludos,
Grind Studio`,
  },
  {
    after: 18 * 60,
    subject: () => "¿Me permites cerrar tu pedido? (+ Bonos)",
    body: ({ name, url, price }) => `${hey("Hola", name)}

No he sabido nada de ti, así que supongo que decidiste pasar del MIDI Drum Kit.

Voy a cerrar tu solicitud de carrito esta noche para no seguir llenando tu bandeja de entrada.

Pero antes, me di cuenta de que quizás no sabes que también te vas sin los 6 bonos gratis incluidos con el MIDI Drum Kit.

Si completas tu pedido hoy, todavía tienes acceso inmediato a:

**BONO #1: Famous Beats Bundle** – Transcribimos los patrones de batería de hits número uno en las listas (Roddy Ricch, Drake, Travis Scott, etc.) para que veas la “ciencia oculta” exacta detrás de los beats profesionales.

**BONO #2: Beat Starters Bundle** – Una carpeta enorme de acordes, melodías, guitarras y plucks de trap para destruir el bloqueo creativo al instante.

**BONO #3: Hit-Maker Drums** – Los kicks, snares y hats contundentes que usamos para crear las demos. Nada de reciclar sonidos flojos.

**BONO #4: Drunk Swing Grooves** – 211 archivos MIDI: grooves de batería, plantillas de groove y acordes neo soul.

**BONO #5: MYSTERY Hooks Pack** – 17 hooks WAV que dejan espacio para la voz del artista.

**BONO #6: Guía del MIDI Drum Kit** – Un PDF (en inglés) que muestra qué hay en cada carpeta y cómo pasar de un proyecto vacío a un beat completo.

Tienes los más de 750 patrones de batería MIDI más estos 6 bonos por un único precio de ${price}.

Es tu última oportunidad de conseguir el bundle completo antes de que caduque el enlace.

**[[Haz clic para asegurar tu MIDI Kit + los 6 bonos gratis]](${url})**

Dime algo.

Saludos,
Grind Studio`,
  },
];

const de: AbandonEmail[] = [
  {
    after: 15,
    subject: (n) => `Problem mit deiner Bestellung${n ? `, ${n}` : ""}?`,
    preheader: "Ist der Link kaputt?",
    body: ({ name, url }) => `${hey("Hey", name)}

mir ist aufgefallen, dass du deine Bestellung fast abgeschlossen, aber nicht auf Absenden geklickt hast.

Ich frag nur kurz nach: Ist die Seite abgestürzt?

Ich habe deinen Warenkorb hier für dich gespeichert, nur für den Fall:

**[[Klick hier und hol dir dein MIDI Drum Kit]](${url})**

Viele Grüße
Grind Studio`,
  },
  {
    after: 6 * 60,
    subject: () => "kurze Frage zum MIDI Drum Kit",
    body: ({ name, url }) => `${hey("Hey", name)}

du bist wahrscheinlich beschäftigt, aber ich wollte nicht, dass du es verpasst.

Falls du beim MIDI Drum Kit noch unschlüssig bist, denk einfach dran: Es hilft dir, schnell Beats auf Grammy-Niveau zu machen, ohne all deine Drums von Grund auf selbst zu schreiben.

Schau, was Martin aus New York gestern gesagt hat:

„Normalerweise verbringe ich Stunden damit, die Hi-Hat-Velocities zu tweaken, um diesen Bounce zu kriegen, aber diese MIDI-Dateien haben sofort das richtige Feel. Pattern reingezogen, Sounds getauscht und in 15 Minuten einen Beat gehabt, der bereit für ein Placement war. Krasser Wert.“

Hier ist der Link, um es dir zu holen:

**[[Klick hier und schließ deine MIDI Drum Kit Bestellung ab]](${url})**

Viele Grüße
Grind Studio`,
  },
  {
    after: 18 * 60,
    subject: () => "Darf ich deine Bestellung schließen? (+ Boni)",
    body: ({ name, url, price }) => `${hey("Hey", name)}

ich habe nichts von dir gehört, also gehe ich davon aus, dass du beim MIDI Drum Kit passen willst.

Ich schließe deine Warenkorb-Anfrage heute Abend, damit ich dein Postfach nicht weiter vollmülle.

Aber vorher ist mir eingefallen, dass du vielleicht nicht weißt, dass du damit auch auf die 6 Gratis-Boni verzichtest, die zum MIDI Drum Kit gehören.

Wenn du deine Bestellung heute abschließt, bekommst du weiterhin sofort Zugriff auf:

**BONUS #1: Famous Beats Bundle** – Wir haben die Drum-Patterns von Chart-Hits transkribiert (Roddy Ricch, Drake, Travis Scott usw.), damit du die genaue „versteckte Wissenschaft“ hinter Profi-Beats siehst.

**BONUS #2: Beat Starters Bundle** – Ein riesiger Ordner mit Akkorden, Melodien, Gitarren und Trap-Plucks, der Beat-Blockaden sofort zerstört.

**BONUS #3: Hit-Maker Drums** – Die harten Kicks, Snares und Hats, mit denen wir die Demos gemacht haben. Keine recycelten schwachen Sounds.

**BONUS #4: Drunk Swing Grooves** – 211 MIDI-Dateien: Drum-Grooves, Groove-Templates und Neo-Soul-Keys.

**BONUS #5: MYSTERY Hooks Pack** – 17 WAV-Hooks, die Platz für die Stimme des Artists lassen.

**BONUS #6: MIDI Drum Kit Guide** – Ein PDF (auf Englisch), das zeigt, was in jedem Ordner steckt und wie du vom leeren Projekt zum fertigen Beat kommst.

Du bekommst alle 750+ MIDI-Drum-Patterns plus diese 6 Boni zum Einzelpreis von ${price}.

Das ist deine letzte Chance, dir das komplette Bundle zu holen, bevor der Link abläuft.

**[[Klick hier und sichere dir dein MIDI Kit + alle 6 Gratis-Boni]](${url})**

Sag mir Bescheid.

Viele Grüße
Grind Studio`,
  },
];

const it: AbandonEmail[] = [
  {
    after: 15,
    subject: (n) => `Problema con il tuo ordine${n ? ` ${n}` : ""}?`,
    preheader: "Il link non funzionava?",
    body: ({ name, url }) => `${hey("Ehi", name)}

ho notato che hai quasi completato il tuo ordine, ma non hai cliccato su invia.

Volevo solo controllare: la pagina si è bloccata?

Ti ho salvato il carrello qui, per sicurezza:

**[[Clicca per avere il tuo MIDI Drum Kit]](${url})**

A presto,
Grind Studio`,
  },
  {
    after: 6 * 60,
    subject: () => "domanda veloce sul MIDI Drum Kit",
    body: ({ name, url }) => `${hey("Ehi", name)}

probabilmente sei impegnato, ma non volevo che te lo perdessi.

Se sei ancora indeciso sul MIDI Drum Kit, ricorda solo che ti aiuta a creare beat da Grammy velocemente, senza scrivere a mano tutte le tue drum da zero.

Guarda cosa ha detto ieri Martin, da New York:

“Di solito passo ore a sistemare le velocity degli hi-hat per avere quel bounce, ma questi file MIDI hanno subito il feel giusto. Ho trascinato un pattern, cambiato i suoni e in 15 minuti avevo un beat pronto per un placement. Un valore pazzesco.”

Ecco il link per prenderlo:

**[[Clicca per completare il tuo ordine del MIDI Drum Kit]](${url})**

A presto,
Grind Studio`,
  },
  {
    after: 18 * 60,
    subject: () => "Posso chiudere il tuo ordine? (+ Bonus)",
    body: ({ name, url, price }) => `${hey("Ehi", name)}

non ti ho più sentito, quindi immagino che tu abbia deciso di rinunciare al MIDI Drum Kit.

Stasera chiudo la tua richiesta di carrello, così non continuo a intasarti la casella email.

Ma prima mi sono reso conto che forse non sai che stai rinunciando anche ai 6 bonus gratis inclusi con il MIDI Drum Kit.

Se completi il tuo ordine oggi, hai ancora accesso immediato a:

**BONUS #1: Famous Beats Bundle** – Abbiamo trascritto i pattern di batteria di hit in cima alle classifiche (Roddy Ricch, Drake, Travis Scott, ecc.) così puoi vedere l'esatta “scienza nascosta” dietro i beat dei professionisti.

**BONUS #2: Beat Starters Bundle** – Un'enorme cartella di accordi, melodie, chitarre e trap pluck per distruggere il blocco creativo all'istante.

**BONUS #3: Hit-Maker Drums** – I kick, snare e hat potenti che abbiamo usato per creare le demo. Niente suoni deboli riciclati.

**BONUS #4: Drunk Swing Grooves** – 211 file MIDI: groove di batteria, template di groove e accordi neo soul.

**BONUS #5: MYSTERY Hooks Pack** – 17 hook WAV che lasciano spazio alla voce dell'artista.

**BONUS #6: Guida al MIDI Drum Kit** – Un PDF (in inglese) che mostra cosa c'è in ogni cartella e come passare da un progetto vuoto a un beat completo.

Ottieni tutti gli oltre 750 pattern di batteria MIDI più questi 6 bonus a un prezzo unico di ${price}.

È la tua ultima occasione per prendere il bundle completo prima che il link scada.

**[[Clicca per assicurarti il tuo MIDI Kit + tutti e 6 i bonus gratis]](${url})**

Fammi sapere.

A presto,
Grind Studio`,
  },
];

const SERIES: Record<string, AbandonEmail[]> = { en, fr, es, de, it };

/** The funnels with a series of their own; the rest get lib/mailCopy.ts's single reminder. */
export const ABANDON_SERIES_FUNNELS = new Set(["midi-drum-kit"]);

/** The series in a language (English for any other), French spacing applied. */
export function abandonSeries(lang: string | null | undefined): AbandonEmail[] {
  const s = SERIES[lang ?? "en"] ?? en;
  if (lang !== "fr") return s;
  return s.map((m) => ({ ...m, subject: (n) => frenchSpaces(m.subject(n)), preheader: m.preheader && frenchSpaces(m.preheader), body: (o) => frenchSpaces(m.body(o)) }));
}

/** The price as the language writes it: "€27" in English, "27 €" in French, "$27" for Spanish dollars (landing.ts). */
export function statedPrice(amount: number, currency: Currency, lang: string | null | undefined): string {
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(".", lang === "en" ? "." : ",");
  if (lang === "en" || !lang || (lang === "es" && currency === "usd")) return currency === "eur" ? `€${n}` : `$${n}`;
  return `${n} ${currency === "eur" ? "€" : "$"}`;
}

import type { Copy } from "./en";

// The MIDI Drum Kit funnel in German: ./en.ts translated line by line, same
// marks and structure, in standard German for Germany, Austria and
// Switzerland, with "du" like the French "tu". Prices are written the German
// way, sign after the number ("27 {c}"). As in French and Spanish, the
// guarantee is a quality guarantee ("Qualitätsgarantie"), never a money-back
// one: the refund policy only refunds broken or mis-described files. Product,
// folder and bonus names stay in English: they're the names on the boxes and
// in the zip.

export const de: Copy = {
  meta: {
    title: "1050 MIDI-Drum-Patterns + 3 Boni",
    description: "Mach Beats, die grooven, mit MIDI-Drums per Drag & Drop. 1050 MIDI-Drum-Patterns und Rolls + 3 Boni, von GRIND STUDIO.",
    orderTitle: "MIDI Drum Kit bestellen",
    thanksTitle: "Danke · MIDI Drum Kit",
  },
  orderTopbar: "**NOCH MEHR BLACK FRIDAY:** -90 %, endet bald",

  footer: { terms: "AGB", privacy: "Datenschutz", refund: "Rückerstattung", contact: "Kontakt:" },

  order: {
    secure: "Sichere Bezahlung",
    summaryTitle: "Bestellübersicht:",
    productAlt: "MIDI Drum Kit: 1050 MIDI-Drum-Patterns + 3 Boni",
    dl: "Den Download-Link bekommst du auch per E-Mail.",
    bullets: [
      "Drum-Patterns auf Grammy-Niveau",
      "Mach deine Beats 27x schneller fertig",
      "Nutze Dopamin, um Hörer zu fesseln",
      "Fall Top-Artists sofort auf",
      "Drum-Patterns aus echten Hits",
      "Mach locker 750 Beats im Jahr",
      "Eine riesige Library zum Entdecken",
      "Nie wieder Beat-Blockade",
      "Läuft auf Mac, PC und jeder DAW",
      "Zeitlich begrenztes Angebot",
      "Qualitätsgarantie (ohne Risiko)",
      "Begrenzt auf 1.250 Lizenzen",
    ],
    completeTitle: "Bestellung abschließen:",
    paylogosAlt: "PayPal, Visa, Mastercard, American Express, Discover",
    reviews: [
      { quote: "„Die Drum-Patterns sind genau das, was ich gebraucht habe. Perfekt für modernen Trap und Drill.“", name: "Marcus Thompson", role: "Trap-Producer", avatar: "avatar-c" },
      { quote: "„Diese MIDI-Files haben mir Hunderte Stunden gespart. Die Patterns haben Industriestandard.“", name: "Ardan Solis", role: "Verifizierter Kunde", avatar: "avatar-a" },
      { quote: "„Perfekt für Trap. Die Fragmente geben den Beats das gewisse Extra.“", name: "Niko Varela", role: "Verifizierter Kunde", avatar: "avatar-a" },
      { quote: "„So sehen echte Tools für Trap-Produktion aus. Jedes Pattern ist ein Hit in spe.“", name: "Soraya Kenji", role: "Verifizierte Kundin", avatar: "avatar-a" },
      { quote: "„Die MIDI-Patterns sind krass. Ich nutze sie in jeder Session, seit ich das Pack habe.“", name: "Marek Tulan", role: "Hip-Hop- und Trap-Beatmaker", avatar: "avatar-a" },
      { quote: "„Endlich Patterns mit der Energie von modernem Trap. Dieses Pack ist legendär.“", name: "Aisha Moretti", role: "Beatmakerin", avatar: "avatar-a" },
      { quote: "„Die Kreativität, die diese MIDIs bei mir ausgelöst haben, ist unglaublich. Die perfekte Basis für jeden Trap-Beat.“", name: "Dara Kwon", role: "Trap-Producerin, über 100 Mio. Streams", avatar: "avatar-a" },
      { quote: "„Diese Patterns hauen härter rein als alles, was ich bisher gefunden habe. Pflicht-Tools für Producer von heute.“", name: "Ravi Lomax", role: "Trap-Producer, über 100 Mio. Streams", avatar: "avatar-a" },
    ],
    starsAlt: "5 Sterne",
    guaranteeTitle: "14 Tage Qualitätsgarantie",
    guaranteeText:
      "Jedes Pattern in diesem Kit wird vor dem Release getestet. Wenn mit deinen Dateien etwas nicht stimmt, schreib innerhalb von 14 Tagen an support@thegrind.studio und wir kümmern uns darum: ein neuer Download, ein Ersatz oder eine Rückerstattung, falls wir das Problem nicht lösen können.",
    secureTitle: "Sichere Zahlungen",
    secureText:
      "Zahlungen laufen über alle gängigen Kreditkarten und PayPal, mit 256-Bit-SSL-Verschlüsselung. Wir speichern keine Zahlungsdaten.",
    timer: { title: "DEIN EXEMPLAR IST RESERVIERT FÜR:", min: "Min", sec: "Sek", ms: "ms", label: "Dein Exemplar ist reserviert" },
  },

  form: {
    step1: "Deine Daten",
    step1Sub: "Name und E-Mail",
    step2: "Zahlung",
    step2Sub: "Zahlungsdaten",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    next: "WEITER",
    back: "Zurück",
    respect: "Wir respektieren deine Privatsphäre und deine Daten.",
    paymentInfo: "ZAHLUNGSDATEN",
    paymentMethod: "Zahlungsart",
    card: "Karte",
    paypal: "PayPal",
    notConnected: "Kartenzahlung wird aktiviert, sobald die Stripe-Schlüssel hinterlegt sind.",
    orCard: "oder mit Karte zahlen",
    cardNumber: "Kartennummer",
    cardExpiry: "MM / JJ",
    cardCvc: "CVV",
    paypalNote: "Nach dem Klick auf „ICH WILL DAS PACK!“ unten schließt du die Zahlung auf der sicheren PayPal-Seite ab und kommst direkt zurück zu deinem Download.",
    oto: "EINMALIGES ANGEBOT:",
    summary: "Übersicht",
    total: "Gesamt",
    pay: "ICH WILL DAS PACK!",
    paySub: "Erhalte sofortigen Zugriff",
    processing: "Zahlung läuft…",
    openingPaypal: "PayPal wird geöffnet…",
    paymentFailed: "Die Zahlung konnte nicht gestartet werden.",
    paypalFailed: "PayPal konnte nicht gestartet werden.",
    bumps: {
      expansions: {
        headline: "JA! Noch mehr Drum-Patterns dazu!",
        body: [
          "3 Erweiterungen für das MIDI Drum Kit. Mit **Complete Beats für House, Lo-Fi und Afrobeat**. Erstelle Drums auf Profi-Niveau 27x schneller. Normalerweise 147 {c}, aber jetzt bekommst du alle für nur 7 {c}!!",
        ],
      },
      hustle: {
        headline: "JA! Ich will auch 31 melodische MIDI-Packs!",
        body: [
          "Das „HUSTLE“-Bundle enthält 31 professionelle MIDI-Packs mit musikalischen Ideen, Akkordfolgen und Melodien. Jazz, Trap, Hip-Hop, Lofi, Pop und mehr. Jedes MIDI-Pack kostet 29 {c} (899 {c} insgesamt), aber jetzt bekommst du alle mit 90 % Rabatt für nur 25 {c}!!",
          "Begrenzt auf die ersten 150 Bestellungen.",
        ],
      },
      chords: {
        headline: "JA! Ich will die Akkordfolgen!",
        body: [
          "„Klau“ ganz legal die Akkordfolgen der 750 besten Songs aller Zeiten. Erstelle Chart-Melodien **50x schneller**. Jede Transkription ist 19 {c} wert (14.250 {c} insgesamt), aber jetzt bekommst du alle für nur 25 {c}!! (Boni: The Chord Progressions Bible, Drum Loops und 3 Emotional Keys MIDI-Packs)",
          "Zeitlich begrenztes Angebot.",
        ],
      },
    },
  },

  thanks: {
    title: "Danke!",
    sub: "Du bist dabei. Ab ins Studio.",
    paid: "Du hast es!",
    pending: "Zahlung läuft…",
    failed: "Zahlung nicht abgeschlossen",
    paidLead: "Zahlung erhalten. Deine Downloads findest du direkt unten. Speichere diese Seite als Lesezeichen: Die Buttons funktionieren auch später noch.",
    pendingLead: "Deine Bank bestätigt die Zahlung noch. Lade diese Seite in einer Minute neu, dann erscheinen deine Downloads.",
    failedLead: "Es wurde nichts abgebucht. Geh zurück und versuch es mit einer anderen Karte oder mit PayPal.",
    download: "Herunterladen",
    receipt: (provider: string, email: string | null) => `${provider} hat dir deine Quittung${email ? ` an ${email}` : ""} geschickt.`,
    account: "Deine Downloads findest du jederzeit unter",
    fix: "und wir kümmern uns darum.",
    back: "Zurück zur Kasse",
    support: "Ein Problem? Schreib uns an",
  },
};

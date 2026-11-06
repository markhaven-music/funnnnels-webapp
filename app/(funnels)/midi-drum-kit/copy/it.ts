import type { Copy } from "./en";

// The MIDI Drum Kit funnel in Italian: ./en.ts translated line by line, same
// marks and structure, with "tu" like the other languages. Prices put the sign
// after the number ("27 {c}"), percentages have no space ("90%"). As in the
// other languages, the guarantee is a quality guarantee ("Garanzia di
// qualità"), never a money-back one: the refund policy only refunds broken or
// mis-described files. Product, folder and bonus names stay in English:
// they're the names on the boxes and in the zip.

export const it: Copy = {
  meta: {
    title: "1050 pattern di batteria MIDI + 3 bonus",
    description: "Crea beat pazzeschi con le drum MIDI drag-and-drop. 1050 pattern e roll di batteria MIDI + 3 bonus, by GRIND STUDIO.",
    orderTitle: "Ordina il MIDI Drum Kit",
    thanksTitle: "Grazie · MIDI Drum Kit",
  },
  orderTopbar: "**BLACK FRIDAY:** -90%, l'offerta sta per finire",

  footer: { terms: "Termini e condizioni", privacy: "Privacy policy", refund: "Politica di rimborso", contact: "Contatti:" },

  order: {
    secure: "Pagamento sicuro",
    summaryTitle: "Riepilogo ordine:",
    productAlt: "MIDI Drum Kit: 1050 pattern di batteria MIDI + 3 bonus",
    dl: "Ti mandiamo il link per il download anche via email.",
    bullets: [
      "Pattern di batteria da Grammy",
      "Finisci i tuoi beat 27 volte più in fretta",
      "Usa la dopamina per agganciare chi ascolta",
      "Fatti notare dagli artisti di alto livello",
      "Pattern usati in grandi hit",
      "Fai 750 beat all'anno senza fatica",
      "Una libreria enorme da esplorare",
      "Mai più blocco creativo",
      "Funziona su Mac, PC e qualsiasi DAW",
      "Offerta a tempo limitato",
      "Garanzia di qualità (zero rischi)",
      "Limitato a 1.250 licenze",
    ],
    completeTitle: "Completa l'ordine:",
    paylogosAlt: "PayPal, Visa, Mastercard, American Express, Discover",
    reviews: [
      { quote: "“I pattern di batteria sono esattamente quello che mi serviva. Perfetti per la trap e la drill di oggi.”", name: "Marcus Thompson", role: "Producer trap", avatar: "avatar-c" },
      { quote: "“Questi file MIDI mi hanno fatto risparmiare centinaia di ore. I pattern sono a livello degli standard dell'industria.”", name: "Ardan Solis", role: "Cliente verificato", avatar: "avatar-a" },
      { quote: "“Perfetto per la trap. I frammenti danno quel tocco in più che fa spiccare i beat.”", name: "Niko Varela", role: "Cliente verificato", avatar: "avatar-a" },
      { quote: "“Ecco come sono i veri strumenti per produrre trap. Ogni pattern è una hit in potenza.”", name: "Soraya Kenji", role: "Cliente verificata", avatar: "avatar-a" },
      { quote: "“I pattern MIDI sono assurdi. Li uso in ogni sessione da quando ho il pack.”", name: "Marek Tulan", role: "Beatmaker hip-hop e trap", avatar: "avatar-a" },
      { quote: "“Finalmente pattern con l'energia della trap di oggi. Questo pack è leggendario.”", name: "Aisha Moretti", role: "Beatmaker", avatar: "avatar-a" },
      { quote: "“La creatività che mi hanno dato questi MIDI è pazzesca. La base perfetta per qualsiasi beat trap.”", name: "Dara Kwon", role: "Producer trap, oltre 100 milioni di stream", avatar: "avatar-a" },
      { quote: "“Questi pattern picchiano più duro di tutto quello che ho trovato. Strumenti indispensabili per i producer di oggi.”", name: "Ravi Lomax", role: "Producer trap, oltre 100 milioni di stream", avatar: "avatar-a" },
    ],
    starsAlt: "5 stelle",
    guaranteeTitle: "Garanzia di qualità di 14 giorni",
    guaranteeText:
      "Ogni pattern di questo kit viene testato prima dell'uscita. Se qualcosa non va con i tuoi file, scrivi a support@thegrind.studio entro 14 giorni e lo sistemiamo: un nuovo download, una sostituzione o un rimborso se non riusciamo a risolvere il problema.",
    secureTitle: "Pagamenti sicuri",
    secureText:
      "Il tuo pagamento è gestito da Stripe, la piattaforma di pagamento usata da milioni di aziende tra cui Amazon, Google e Shopify, oppure da PayPal. I dati della tua carta vanno direttamente a Stripe con crittografia SSL a 256 bit e non passano mai dai nostri server.",
    aboutTitle: "Chi c'è dietro GRIND STUDIO",
    aboutText:
      "Siamo beatmaker e siamo nel giro da anni: facciamo beat e costruiamo strumenti per producer come te. Ci sono voluti 4 anni per estrarre questi pattern dai pezzi che fanno muovere la gente, e oggi li usano 2.847 producer. Hai una domanda? Scrivi a support@thegrind.studio: uno di noi legge ogni email e risponde.",
    timer: { title: "LA TUA COPIA È RISERVATA PER:", min: "min", sec: "sec", ms: "ms", label: "La tua copia è riservata" },
  },

  form: {
    step1: "I tuoi dati",
    step1Sub: "Nome ed email",
    step2: "Pagamento",
    step2Sub: "Dati di pagamento",
    firstName: "Nome",
    lastName: "Cognome",
    email: "Email",
    next: "VAI AL PASSO 2",
    back: "Indietro",
    respect: "Rispettiamo la tua privacy e i tuoi dati.",
    paymentInfo: "DATI DI PAGAMENTO",
    paymentMethod: "Metodo di pagamento",
    card: "Carta",
    paypal: "PayPal",
    notConnected: "Il pagamento con carta si attiva appena vengono aggiunte le chiavi Stripe.",
    orCard: "oppure paga con carta",
    cardNumber: "Numero della carta",
    cardExpiry: "MM / AA",
    cardCvc: "CVV",
    paypalNote: "Dopo il clic su “PRENDI IL PACK!” qui sotto completi il pagamento sulla pagina sicura di PayPal e torni subito al tuo download.",
    oto: "OFFERTA UNICA:",
    summary: "Riepilogo",
    total: "Totale",
    pay: "PRENDI IL PACK!",
    paySub: "Ottieni l'accesso immediato",
    payBar: "Paga {price}",
    bumpMore: "Dettagli",
    bumpLess: "Nascondi",
    processing: "Pagamento in corso…",
    openingPaypal: "Apertura di PayPal…",
    paymentFailed: "Non è stato possibile avviare il pagamento.",
    paypalFailed: "Non è stato possibile aprire PayPal.",
    bumps: {
      expansions: {
        headline: "SÌ! Aggiungi ancora più pattern di batteria!",
        body: [
          "3 espansioni del MIDI Drum Kit. Con **Complete Beats per House, Lo-Fi e Afrobeat**. Crea batterie da professionista 27 volte più in fretta. Di solito costano 147 {c}, ma ora puoi averle tutte a soli 7 {c}!!",
        ],
      },
      hustle: {
        headline: "SÌ! Voglio anche 31 pack MIDI melodici!",
        body: [
          "Il bundle “HUSTLE” contiene 31 pack MIDI professionali con idee musicali, progressioni di accordi e melodie. Jazz, trap, hip-hop, lofi, pop e altro ancora. Ogni pack MIDI costa 29 {c} (899 {c} in totale), ma ora puoi averli tutti scontati del 90% a soli 25 {c}!!",
          "Limitato ai primi 150 ordini.",
        ],
      },
      "top-hits": {
        headline: "SÌ! Aggiungi il TOP HITS MIDI Bundle!",
        body: [
          "1000 progressioni di accordi delle hit più grandi (Drake, Kendrick Lamar, Travis Scott, Lil Baby, The Weeknd e altre) in **file MIDI drag-and-drop**. Mettine una sotto le tue drum e il tuo beat ha l'armonia di una hit. Aggiungilo ora a soli 97 {c}.",
          "Una volta completato l'ordine questo riquadro sparisce: spuntalo ora e il bundle arriva nello stesso download.",
        ],
      },
      chords: {
        headline: "SÌ! Voglio le progressioni di accordi!",
        body: [
          "“Ruba” legalmente le progressioni di accordi delle 750 canzoni migliori di sempre. Crea melodie da classifica **50 volte più in fretta**. Ogni trascrizione vale 19 {c} (14.250 {c} in totale), ma ora puoi averle tutte a soli 25 {c}!! (Bonus: The Chord Progressions Bible, Drum Loops e 3 pack MIDI Emotional Keys)",
          "Offerta a tempo limitato.",
        ],
      },
    },
  },

  thanks: {
    title: "Grazie!",
    sub: "Ci sei dentro. Ora si cucina.",
    paid: "È tuo!",
    pending: "Pagamento in corso…",
    failed: "Pagamento non completato",
    paidLead: "Pagamento ricevuto. I tuoi download sono qui sotto. Salva questa pagina nei preferiti: i pulsanti funzionano anche quando torni.",
    pendingLead: "La tua banca sta ancora confermando il pagamento. Ricarica questa pagina tra un minuto e compariranno i tuoi download.",
    failedLead: "Non ti è stato addebitato nulla. Torna indietro e riprova con un'altra carta o con PayPal.",
    download: "Scarica",
    receipt: (provider: string, email: string | null) => `${provider} ti ha inviato la ricevuta${email ? ` a ${email}` : ""}.`,
    account: "Ritrova i tuoi download quando vuoi su",
    fix: "e lo sistemiamo.",
    back: "Torna al pagamento",
    support: "Un problema? Scrivici a",
  },
};

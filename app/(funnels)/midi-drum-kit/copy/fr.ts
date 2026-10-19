import type { Copy } from "./en";

// The MIDI Drum Kit funnel in French: ./en.ts translated line by line, same
// marks and structure. Prices put the sign after the number ("27 €"), as
// French does. One deliberate change from the English page: the guarantee is
// called a quality guarantee everywhere ("Garantie qualité"), never a
// money-back one, because the refund policy only refunds broken or
// mis-described files (the English page's own guarantee section says the same).
// Product, folder and bonus names stay in English: they're the names on the
// boxes and in the zip.

const IMG = "/funnels/midi-drum-kit";

export const fr: Copy = {
  meta: {
    title: "1050 patterns de batterie MIDI + 3 bonus",
    description: "Fais des beats qui bougent avec des drums MIDI en glisser-déposer. 1050 patterns et rolls de batterie MIDI + 3 bonus, par GRIND STUDIO.",
    orderTitle: "Commander le MIDI Drum Kit",
    thanksTitle: "Merci · MIDI Drum Kit",
  },
  topbar: "**ENCORE PLUS DE BLACK FRIDAY :** -90 %, l'offre se termine bientôt",
  orderTopbar: "**ENCORE PLUS DE BLACK FRIDAY :** -90 %, l'offre se termine bientôt",

  hero: {
    for: "UNIQUEMENT pour les beatmakers AMBITIEUX !",
    title: "Fais de ==super beats== avec des drums MIDI en ==glisser-déposer==|Utilisés par les meilleurs producteurs, __FACILEMENT !__",
    sub: "Présents dans les charts Billboard, désormais ouverts au public",
    bullets: [
      "1050 patterns et rolls de batterie MIDI en glisser-déposer",
      "Fais passer tes beats de fades à accrocheurs",
      "Maximise la libération de dopamine chez tes auditeurs",
    ],
    bullets2: [
      "Termine tes beats 27x plus vite grâce au glisser-déposer",
      "Obtiens le bounce iconique des légendes",
      "Attire immédiatement l'attention des meilleurs artistes",
    ],
    ctaSub: "-90 % · TÉLÉCHARGEMENT IMMÉDIAT + LIEN PAR EMAIL",
    expires: "⏰ L'offre Black Friday expire bientôt !",
  },

  cta: "JE VEUX LE PACK !",
  ctaGuarantee: "Essaie sans risque | Garantie qualité de 14 jours",

  logos: {
    title: "Des patterns utilisés par les **meilleurs producteurs de tous les temps** :",
    items: [
      { src: `${IMG}/logo-southside.webp`, alt: "Southside", w: 507, h: 152 },
      { src: `${IMG}/logo-lex-luger.webp`, alt: "Lex Luger", w: 700, h: 307 },
      { src: `${IMG}/logo-zaytoven.webp`, alt: "Zaytoven Beatz", w: 458, h: 155 },
      { src: `${IMG}/logo-pharrell.webp`, alt: "Pharrell Williams", w: 700, h: 247 },
      { src: `${IMG}/logo-mustard.webp`, alt: "Mustard", w: 700, h: 142 },
    ],
  },

  secret: {
    title: "Quel est le ==VRAI== secret|des 0,1 % de ==meilleurs beatmakers== ?",
    intro: "En général, on pense que c'est l'un de ces trucs :",
    wrong: ["Les plugins et les samples que tu utilises", "Les sons que tu utilises", "La progression d'accords que tu utilises"],
    body: [
      "Mais la science dit que le vrai secret est ailleurs.",
      "C'est pour ça que tous les hits des charts Billboard comme :",
      "« Not Like Us » de Kendrick Lamar, « God’s Plan » de Drake, « DtMF » de Bad Bunny...",
      "Sonnent tous différemment, mais ont tous un point commun.",
      "Ils te font tous bouger.",
      "Ils ont TOUS du ==BOUNCE==.",
    ],
  },

  bounce: {
    title: "Alors... comment on crée du ==bounce== ?",
    intro: ["Il se trouve que des scientifiques ont étudié le BOUNCE pendant des années.", "Et ils ont découvert que ça ne dépend pas :"],
    wrong: ["De drums qui tapent fort", "Des sons que tu utilises", "De rythmes compliqués"],
    instead: "Les chercheurs ont découvert que le BOUNCE dépend plutôt :",
    right: ["De patterns de batterie précis", "D'un équilibre parfait entre kick et snare/clap", "Du juste milieu entre simple et complexe"],
    body: [
      "Et comme seuls certains patterns de batterie font grimper la dopamine...",
      "On a creusé l'étude scientifique pour en extraire ces patterns EXACTS.",
      "Et on a passé les 4 dernières années à créer un outil qui permet à n'importe qui de les utiliser dans ses beats hip-hop.",
      "Ce n'était pas possible.",
      "Jusqu'à aujourd'hui.",
    ],
  },

  kit: {
    introducing: "Voici...",
    name: "MIDI Drum Kit",
    line: "Le premier et le seul ==kit MIDI== pour créer des ==drums parfaites== facilement !",
    powered: "Propulsé par notre système exclusif **DopaBounce™**.",
    benefits: [
      "**Fais des beats de niveau pro** sans connaître la théorie musicale",
      "Fais bouger les gens **dès les 3 premières secondes**",
      "Débloque le **workflow** du beatmaker professionnel",
      "Deviens le beatmaker avec qui les artistes **rêvent de bosser**",
      "**Vends tes beats plus facilement** sans travailler plus",
    ],
    ctaSub: "-90 % · Téléchargement immédiat + lien par email",
  },

  quotes: {
    title: "Les ==0,1 % de meilleurs beatmakers== sont obsédés par le ==bounce==",
    items: [
      { name: "Mike WiLL Made-It", role: "Top 0,01 % des beatmakers", img: "p-mike-will", quote: "« Je peux mettre un beat… juste pour voir si mon pote va ==bouncer==. Si je joue un beat et qu'il ne ==bouge== pas, je ne le regarde même pas… S'il ==bouge==, alors OK »" },
      { name: "Metro Boomin", role: "Top 0,01 % des beatmakers", img: "p-metro", quote: "« Je commence par les drums pour ==assurer le bounce==. Tu veux ==faire bouger les gens==. »" },
      { name: "Tay Keith", role: "Top 0,01 % des beatmakers", img: "p-tay-keith", quote: "« Je me concentre toujours sur le ==bounce== »" },
      { name: "Timbaland", role: "Producteur légendaire", img: "p-timbaland", quote: "« Je savais que j'avais mon propre ==bounce...== »" },
      { name: "TM88", role: "Top 0,01 % des beatmakers", img: "p-tm88", quote: "« Il est juste entré … il a entendu le pattern … il ==bougeait==. »" },
      { name: "Pharrell", role: "Producteur légendaire", img: "p-pharrell", quote: "« On prenait notre pied à ==faire danser les gens==, et c'était ça l'intention. »" },
    ],
    youToo: "Et ==TOI== aussi, tu devrais l'être. Parce que...",
  },

  science: {
    title: "La science PROUVE que le ==BOUNCE== libère de la ==DOPAMINE== dans le cerveau.",
    found: "Voici ce que les chercheurs ont découvert...",
    items: [
      "Une musique avec **un groove et un bounce marqués** active **le circuit de la récompense lié à la ==dopamine==**, ce qui crée un vrai plaisir et l'envie de bouger.",
      "Les études montrent que la ==dopamine== grimpe à la fois pendant **l'anticipation** et pendant **les pics émotionnels** de la musique _(Salimpoor et al., 2011)_",
      "Quand la régulation de la ==dopamine== est altérée, l'envie de bouger disparaît, ce qui prouve le lien entre groove et ==dopamine== _(Pando-Naude et al., 2024)_.",
      "Le groove synchronise littéralement **les systèmes moteur et de récompense**, ce qui le rend **==addictif==**.",
    ],
    end: "Ce n'est pas le hasard. C'est la science.",
  },

  inside: {
    title: "Alors, qu'y a-t-il ==dans== le MIDI Drum Kit DopaBounce™ ?",
    folders: [
      {
        box: "box-complete-beats",
        title: "Complete Beats",
        desc: "Des patterns de kick et des fills en glisser-déposer qui font bouncer tes drums vite, sans effort. Quelques exemples :",
        demos: [{ label: "Beats complets multipistes|(toutes les drums dans UN SEUL fichier MIDI)", rolls: ["cb-1", "cb-2", "cb-3", "cb-4", "cb-5"] }],
      },
      {
        box: "box-kick",
        title: "Kick",
        desc: "Patterns et fills de kick.",
        center: true,
        demos: [
          { label: "Patterns de kick", gif: "g-kick-patterns" },
          { label: "Fragments de kick", gif: "g-kick-fragments" },
        ],
      },
      {
        box: "box-hats",
        title: "Hi-Hat",
        desc: "L'un des éléments les plus importants du beat.",
        demos: [
          { label: "Patterns de hats simples", gif: "g-hat-basic" },
          { label: "Patterns de hats complexes", gif: "g-hat-complex" },
          { label: "Patterns de hats hyper-complexes", gif: "g-hat-hyper" },
          { label: "Fragments de hats simples", gif: "g-hatf-basic" },
          { label: "Fragments de hats complexes", gif: "g-hatf-complex" },
          { label: "Fragments de hats hyper-complexes", gif: "g-hatf-hyper" },
          { label: "Rolls de hats montants", gif: "g-hat-rollups" },
          { label: "Rolls de hats descendants", gif: "g-hat-rolldowns" },
        ],
        ctaAfter: true,
      },
      {
        box: "box-snare",
        title: "Snare",
        desc: "Patterns, rolls et tout ce qu'il te faut pour les parties de snare.",
        demos: [
          { label: "Patterns de snare", gif: "g-snare-patterns" },
          { label: "Fragments de snare", gif: "g-snare-fragments" },
        ],
      },
      {
        box: "box-808",
        title: "808",
        desc: "Des patterns et des fills pour toujours savoir quoi faire.",
        demos: [
          { label: "Patterns de 808", gif: "g-808-patterns" },
          { label: "Fragments de 808", gif: "g-808-fragments" },
        ],
      },
      {
        box: "box-accents",
        title: "Accents",
        desc: "Pour les petits accents, les percussions et les drums qui scintillent.",
        demos: [{ label: "Accents", gif: "g-accents" }],
        ctaAfter: true,
      },
      {
        box: "box-open-hats",
        title: "Open Hi-Hat",
        desc: "L'endroit où tu places tes open hats compte. Maintenant, c'est réglé.",
        demos: [{ label: "Patterns d'open hats", gif: "g-accents" }],
      },
      {
        box: "box-kick-snare",
        title: "Kick & Snare",
        desc: "Le kick et la snare sont la base de tout bounce. Là, tu es couvert.",
        demos: [{ label: "Patterns multipistes|(kick et snare dans un seul fichier MIDI)", rolls: ["ks-1", "ks-2", "ks-3", "ks-4"] }],
      },
      {
        box: "box-kick-808",
        title: "Kick & 808",
        desc: "Des grooves kick et 808 qui font bouger n'importe qui.",
        demos: [{ label: "Patterns multipistes|(kick et 808 dans un seul fichier MIDI)", rolls: ["k8-1", "k8-2", "k8-3", "k8-4"] }],
      },
      {
        box: "box-rolls",
        title: "Rolls",
        desc: "Un dossier en plus, rien que pour les rolls. Montants, descendants et ultra-complexes.",
        demos: [{ label: "Fragments de rolls", gif: "g-rolls" }],
      },
    ],
  },

  bonuses: {
    title: "Et uniquement pendant la ==SEMAINE DU BLACK FRIDAY==, tu reçois aussi 3 bonus __OFFERTS__ :",
    items: [
      {
        label: "BONUS N°1 :",
        name: "Famous Beats Bundle",
        desc: "Pour la première fois, on sort une collection de transcriptions de BEATS CÉLÈBRES. Pour que n'importe qui puisse démarrer ses beats sur une base solide.",
        demo: "Beats multipistes",
        box: "bonus-famous",
        tree: "tree-famous",
      },
      {
        label: "BONUS N°2 :",
        name: "Beat Starters Bundle",
        desc: "Des fichiers MIDI mélodiques pour lancer tes beats. Fini la page blanche, place à l'inspiration sans limite.",
        demo: "Idées musicales multipistes",
        box: "bonus-starters",
        tree: "tree-starters",
      },
      {
        label: "BONUS N°3 :",
        name: "Hit-Maker Drums",
        desc: "Une collection de samples de batterie qui tapent fort, rassemblés au fil des années. 100 % libres de droits.",
        demo: "One-shots de batterie WAV",
        box: "bonus-drums",
        tree: "tree-drums",
      },
    ],
  },

  value: {
    total: "VALEUR TOTALE : 988 {c}",
    week: "SEMAINE DU BLACK FRIDAY",
    was: "497 {c}",
    now: "27 {c}",
    save: "TU ÉCONOMISES 270 {c}",
    title: "Voici ce que tu reçois :",
    items: [
      "Licence MIDI Drum Kit (valeur 497 {c})",
      "Bonus n°1 : Famous Beats MIDI Bundle (valeur 97 {c})",
      "Bonus n°2 : Beat Starters MIDI Bundle (valeur 97 {c})",
      "Bonus n°3 : Hit-Maker Drums Sample Pack (valeur 67 {c})",
      "Génère à l'infini des beats de niveau pro",
      "Dis adieu à la page blanche pour toujours",
      "Modifie les beats ou utilise-les tels quels",
      "Glisse-dépose des fragments ou des beats entiers",
      "Utilise-les avec les sons de batterie que tu as déjà",
      "Super simple, facile et fun à utiliser",
      "Compatible Mac, PC et tous les DAW",
      "Garantie qualité de 14 jours",
    ],
    totalLine: "Valeur totale : 988 {c}",
    deal: "Offre Black Friday :",
    single: "1 seul paiement de",
    only: "Seulement",
    oldPrice: "297 {c}",
    price: "27 {c}",
    guarantee: "Essaie sans risque | Garantie qualité de 14 jours",
  },

  steps: {
    title: "Le MIDI Drum Kit en ==3 étapes faciles== !",
    items: [
      { n: "1.", title: "Télécharge", text: ["Accède à ta bibliothèque de patterns de batterie, classés par élément."], gif: "g-step-1" },
      { n: "2.", title: "Glisse-dépose", text: ["Fais glisser les patterns MIDI directement dans ton DAW.", "Aucune programmation, aucun réglage compliqué."], gif: "g-step-2" },
      { n: "3.", title: "C'est fait !", text: ["Personnalise, superpose et arrange tes patterns.", "Des beats trap pro en quelques minutes, pas en quelques heures."], gif: "g-step-3" },
    ],
  },

  daws: "Compatible avec tous les DAW",

  pf: {
    title: "Pourquoi des « ==Patterns== » et des « ==Fragments== » ?|C'est simple.",
    patterns: {
      title: "Patterns",
      desc: "Des arrangements de batterie complets sur 4 mesures.",
      checks: ["Des parties complètes de 4 mesures", "Une base de beat immédiate", "Plus de 500 patterns prêts pour la radio", "Un beat en 5 minutes, à chaque fois"],
      demo: "Patterns de 4 mesures",
    },
    fragments: {
      title: "Fragments",
      desc: "De petits éléments rythmiques (rolls, fills, etc.). Parfaits pour : varier tes patterns, créer tes propres arrangements et ajouter encore plus de bounce à tes beats.",
      checks: ["Rolls de hi-hat, fills de kick, fills de snare, etc.", "Plus de 250 fragments MIDI individuels"],
      demo: "Les fragments sont plus courts",
    },
  },

  folders: {
    title: "==Organisation des dossiers== en détail",
    caption: "Patterns de batterie + bonus parfaitement organisés",
    items: [
      "808",
      "Closed Hi-Hat",
      "Kick",
      "Snare",
      "Open Hi-Hat",
      "Extra Rolls",
      "Kick & Snare (multipiste)",
      "Kick & 808 (multipiste)",
      "Complete Beats (multipiste)",
      "==BONUS N°1== - Famous Beats Bundle",
      "==BONUS N°2== - Beat Starters Bundle",
      "==BONUS N°3== - Hit-Maker Drums",
      "1050 fichiers MIDI au total (Drum Kit)",
      "Plus 415 fichiers MIDI dans les BONUS",
    ],
  },

  reviews: {
    title: "Qu'en pensent les ==vrais== producteurs ?",
    sub: "Découvre ce que d'autres beatmakers disent après avoir utilisé le MIDI Drum Kit.",
    items: [
      { quote: "« J'ai réalisé à quel point c'était bête de programmer chaque drum de zéro. Merci. »", name: "Arlen Kovak", role: "Producteur trap, plus de 100 M de streams" },
      { quote: "« J'ai commencé à boucler 10 beats par jour, comme tu l'avais dit »", name: "Dario Mensah", role: "Producteur débutant" },
      { quote: "« Enfin des patterns MIDI qui sonnent vraiment comme les beats qu'on entend à la radio. Ce MIDI Drum Kit est indispensable. »", name: "Luca Marberg", role: "Beatmaker, plus de 50 M de vues YouTube" },
      { quote: "« Ça change tout »", name: "Miguel Rodriguez", role: "Producteur trap" },
      { quote: "« Ces fichiers MIDI, c'est de l'or. Ils ont un truc spécial que je n'arrive pas à expliquer. »", name: "Jordan Williams", role: "Producteur hip-hop indépendant" },
      { quote: "« Chaque pattern frappe différemment. C'est ça, le son d'une vraie prod trap. Ça vaut chaque centime. »", name: "Alex Carter", role: "Producteur, 1017 Records" },
      { quote: "« La qualité est inégalée. Ça vaut sûrement des milliers de dollars »", name: "Leo Martensen", role: "Beatmaker trap" },
      { quote: "« Je ne sais pas l'expliquer, mais ça sonne comme de l'argent »", name: "Stefan Kožar", role: "Beatmaker confirmé" },
    ],
  },

  faq: {
    title: "Questions ==fréquentes==",
    items: [
      {
        q: "Est-ce que ça marche avec mon DAW et ma config ?",
        a: "Oui, à 100 %. Ce sont des fichiers MIDI standard qui marchent avec FL Studio, Ableton Live, Logic Pro, Pro Tools, Cubase, Studio One, Reaper et littéralement tous les DAW qui lisent le MIDI. Si ton logiciel importe du MIDI (et ils le font tous), c'est bon.",
      },
      {
        q: "Est-ce que je peux vraiment vendre des beats faits avec ces patterns ?",
        a: "Oui ! Ton achat inclut une licence commerciale complète. Tu peux vendre tes beats, les mettre sur BeatStars, les licencier à des artistes et même les sortir sur les grandes plateformes de streaming. Tu gardes 100 % des bénéfices. Aucuns frais en plus, aucun partage de royalties.",
      },
      {
        q: "En combien de temps je peux commencer à gagner de l'argent avec ?",
        a: "Tout de suite. Le téléchargement prend 2 minutes, l'import dans ton DAW 30 secondes, et tu peux avoir un beat fini en ligne sur les plateformes de vente dans l'heure. Certains producteurs rentabilisent leur achat dès la première vente de beat.",
      },
      {
        q: "Est-ce qu'il me faut des samples de batterie chers pour que ça sonne bien ?",
        a: "Non. Les sons comptent, mais ce qui fait bouger les gens, ce sont les rythmes, pas les sons.",
      },
    ],
  },

  guarantee: {
    title: "Ne réfléchis pas trop.|Tu es ==protégé== par notre ==garantie qualité== de 14 jours",
    card: "Sans risque",
    text: "Chaque pattern MIDI est testé et vérifié avant sa sortie. Si quelque chose ne va pas avec tes fichiers (téléchargement cassé, pattern corrompu, contenu manquant), on règle ça sous 14 jours : un nouveau téléchargement, un remplacement, ou un remboursement si on n'arrive pas à corriger le problème.",
    promise: "Notre promesse : si tes fichiers ne s'ouvrent pas ou ne correspondent pas à ce qui est décrit sur cette page, écris à support@thegrind.studio dans les 14 jours. On corrige vite, et si on n'y arrive pas, on te rembourse.",
    badgeAlt: "Garantie",
  },

  oneShot: {
    title: "Tu n'as qu'==une seule chance.==|Ne la laisse pas passer.",
    decision:
      "**C'EST LE MOMENT DE CHOISIR :** tu peux continuer à galérer avec des beats qui sonnent amateur... ou rejoindre les ==2 847 producteurs== qui utilisent déjà ces « patterns d'initiés » pour créer des hits taillés pour les charts en moins de 10 minutes.",
    warning: "**ATTENTION :** l'offre Black Friday se termine bientôt.",
    cta: "Oui ! Je veux ces patterns MIDI qui font des hits",
    small: "Garantie qualité de 14 jours • Téléchargement immédiat • Commence à vendre dès aujourd'hui • Utilisés par des artistes du Billboard",
  },

  disclaimer: [
    "**AVERTISSEMENT :** le MIDI DRUM KIT est conçu pour t'aider à créer des beats au son professionnel et à améliorer ton workflow de production, mais les résultats varient d'une personne à l'autre et aucun résultat, revenu ou succès précis n'est garanti. Les références à des artistes, y compris les citations de leurs déclarations publiques, sont faites à titre illustratif, éducatif et de commentaire uniquement et n'impliquent aucun soutien de leur part. Les patterns de batterie ne relèvent pas de la propriété intellectuelle ; ces fichiers MIDI sont des transcriptions originales de structures rythmiques non protégées.",
    "GRIND STUDIO ne fait pas partie du site Facebook ni de Meta Platforms, Inc. Ce site n'est en AUCUN cas approuvé par Facebook.",
    "FACEBOOK et INSTAGRAM sont des marques de META PLATFORMS, Inc.",
  ],
  footer: { terms: "Conditions générales", privacy: "Politique de confidentialité", refund: "Politique de remboursement", contact: "Contact :" },

  order: {
    secure: "Paiement sécurisé",
    summaryTitle: "Récapitulatif :",
    productAlt: "MIDI Drum Kit : 1050 patterns de batterie MIDI + 3 bonus",
    dl: "Le lien de téléchargement te sera aussi envoyé par email.",
    bullets: [
      "Des patterns de batterie dignes des Grammy",
      "Termine tes beats 27x plus vite",
      "Utilise la dopamine pour accrocher tes auditeurs",
      "Fais-toi remarquer par des artistes reconnus",
      "Des patterns utilisés dans des hits",
      "Fais facilement 750 beats par an",
      "Une énorme bibliothèque à explorer",
      "Plus jamais de page blanche",
      "Compatible Mac, PC et tous les DAW",
      "Offre à durée limitée",
      "Garantie qualité (zéro risque)",
      "Limité à 1 250 licences",
    ],
    completeTitle: "Finalise ta commande :",
    paylogosAlt: "PayPal, Visa, Mastercard, American Express, Discover",
    reviews: [
      { quote: "« Les patterns de batterie sont exactement ce qu'il me fallait. Parfaits pour la trap et la drill actuelles. »", name: "Marcus Thompson", role: "Producteur trap", avatar: "avatar-c" },
      { quote: "« Ces fichiers MIDI m'ont fait gagner des centaines d'heures. Les patterns sont au niveau des standards de l'industrie. »", name: "Ardan Solis", role: "Client vérifié", avatar: "avatar-a" },
      { quote: "« Parfait pour la trap. Les fragments ajoutent la petite touche qui fait ressortir les beats. »", name: "Niko Varela", role: "Client vérifié", avatar: "avatar-a" },
      { quote: "« Voilà à quoi ressemblent de vrais outils de prod trap. Chaque pattern est un hit en puissance. »", name: "Soraya Kenji", role: "Cliente vérifiée", avatar: "avatar-a" },
      { quote: "« Les patterns MIDI sont dingues. Je les utilise à chaque session depuis que j'ai le pack. »", name: "Marek Tulan", role: "Beatmaker hip-hop et trap", avatar: "avatar-a" },
      { quote: "« Enfin des patterns qui ont l'énergie de la trap actuelle. Ce pack est légendaire. »", name: "Aisha Moretti", role: "Beatmakeuse", avatar: "avatar-a" },
      { quote: "« La créativité que ces MIDI m'ont donnée est folle. La base parfaite pour n'importe quel beat trap. »", name: "Dara Kwon", role: "Productrice trap, plus de 100 M de streams", avatar: "avatar-a" },
      { quote: "« Ces patterns tapent plus fort que tout ce que j'ai trouvé. Des outils indispensables pour les producteurs d'aujourd'hui. »", name: "Ravi Lomax", role: "Producteur trap, plus de 100 M de streams", avatar: "avatar-a" },
    ],
    starsAlt: "5 étoiles",
    guaranteeTitle: "Garantie qualité de 14 jours",
    guaranteeText:
      "Chaque pattern de ce kit est testé avant sa sortie. Si quelque chose ne va pas avec tes fichiers, écris à support@thegrind.studio dans les 14 jours et on règle ça : un nouveau téléchargement, un remplacement, ou un remboursement si on n'arrive pas à corriger le problème.",
    secureTitle: "Paiements sécurisés",
    secureText:
      "Les paiements passent par toutes les grandes cartes bancaires et PayPal, avec un chiffrement SSL 256 bits. Aucune donnée de paiement n'est conservée.",
    timer: { title: "TON EXEMPLAIRE EST RÉSERVÉ PENDANT", min: "MIN", sec: "SEC", ms: "MS", label: "Ton exemplaire est réservé" },
  },

  form: {
    step1: "Tes infos",
    step1Sub: "Nom et email",
    step2: "Paiement",
    step2Sub: "Infos de paiement",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    next: "PASSER À L'ÉTAPE 2",
    back: "Retour",
    respect: "Nous respectons ta vie privée et tes informations.",
    paymentInfo: "INFORMATIONS DE PAIEMENT",
    paymentMethod: "Moyen de paiement",
    card: "Carte",
    paypal: "PayPal",
    notConnected: "Le paiement par carte s'active dès que les clés Stripe sont ajoutées.",
    orCard: "ou paie par carte",
    paypalNote: "Après avoir cliqué sur le bouton, tu termines le paiement sur la page sécurisée de PayPal, puis tu reviens directement à ton téléchargement.",
    oto: "OFFRE UNIQUE :",
    summary: "Récapitulatif",
    total: "Total",
    pay: "Je valide ma commande !",
    processing: "Paiement en cours…",
    openingPaypal: "Ouverture de PayPal…",
    waiver: "En payant, tu as accès au téléchargement immédiatement et tu acceptes que ton droit de rétractation de 14 jours prenne fin dès qu'il commence.",
    paymentFailed: "Le paiement n'a pas pu démarrer.",
    paypalFailed: "PayPal n'a pas pu démarrer.",
    bumps: {
      expansions: {
        headline: "OUI ! Ajoute encore plus de patterns de batterie !",
        body: [
          "3 extensions du MIDI Drum Kit. Avec des **Complete Beats House, Lo-Fi et Afrobeat**. Génère des drums de niveau pro 27x plus vite. Normalement 147 {c}, mais tu peux tout avoir maintenant pour seulement 7 {c} !!",
        ],
      },
      hustle: {
        headline: "OUI ! Je veux aussi 31 packs MIDI mélodiques !",
        body: [
          "Le bundle « HUSTLE » contient 31 packs MIDI professionnels avec des idées musicales, des progressions d'accords et des mélodies. Jazz, trap, hip-hop, lofi, pop et plus encore. Chaque pack MIDI coûte 29 {c} (899 {c} au total), mais tu peux tout avoir maintenant à -90 % pour seulement 25 {c} !!",
          "Limité aux 150 premières commandes.",
        ],
      },
      chords: {
        headline: "OUI ! Je veux les progressions d'accords !",
        body: [
          "« Pique » légalement les progressions d'accords des 750 meilleures chansons de tous les temps. Crée des mélodies taillées pour les charts **50x plus vite**. Chaque transcription vaut 19 {c} (14 250 {c} au total), mais tu peux tout avoir maintenant pour seulement 25 {c} !! (Bonus : The Chord Progressions Bible, des Drum Loops et 3 packs MIDI Emotional Keys)",
          "Offre à durée limitée.",
        ],
      },
    },
  },

  thanks: {
    paid: "C'est bon, tu l'as !",
    pending: "Paiement en cours…",
    failed: "Paiement non finalisé",
    paidLead: "Paiement reçu. Tes téléchargements sont juste en dessous. Garde cette page en favori : les boutons marchent toujours quand tu reviens.",
    pendingLead: "Ta banque confirme encore le paiement. Recharge cette page dans une minute et tes téléchargements apparaîtront.",
    failedLead: "Rien n'a été débité. Reviens en arrière et réessaie avec une autre carte ou avec PayPal.",
    download: "Télécharger",
    receipt: (provider: string, email: string | null) =>
      `${provider} t'a envoyé ton reçu${email ? ` à ${email}` : ""}. Un fichier ne s'ouvre pas ? Écris à`,
    fix: "et on règle ça.",
    back: "Retour au paiement",
  },
};

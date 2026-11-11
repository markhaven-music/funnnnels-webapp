import type { Copy } from "./en";

// The MIDI Drum Kit funnel in French: ./en.ts translated line by line, same
// marks and structure. Prices put the sign after the number ("27 €"), as
// French does. One deliberate change from the English page: the guarantee is
// called a quality guarantee everywhere ("Garantie qualité"), never a
// money-back one, because the refund policy only refunds broken or
// mis-described files (the English page's own guarantee section says the same).
// Product, folder and bonus names stay in English: they're the names on the
// boxes and in the zip.

export const fr: Copy = {
  meta: {
    title: "1050 patterns de batterie MIDI + 6 bonus",
    description: "Fais des beats qui bougent avec des drums MIDI en glisser-déposer. 1050 patterns et rolls de batterie MIDI + 6 bonus, par GRIND STUDIO.",
    orderTitle: "Commander le MIDI Drum Kit",
    thanksTitle: "Merci · MIDI Drum Kit",
  },
  orderTopbar: "**BLACK FRIDAY :** -90 %, l'offre se termine bientôt",

  footer: { terms: "Conditions générales", privacy: "Politique de confidentialité", refund: "Politique de remboursement", contact: "Contact :" },

  order: {
    secure: "Paiement sécurisé",
    summaryTitle: "Récapitulatif :",
    productAlt: "MIDI Drum Kit : 1050 patterns de batterie MIDI + 6 bonus",
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
    stack: {
      title: "1050 patterns de batterie MIDI, un dossier par élément",
      items: [
        "Kick, snare, hi-hats fermés et ouverts, 808 et un dossier de rolls en plus",
        "Plus de 500 patterns de 4 mesures prêts pour la radio et plus de 250 fragments (rolls, fills)",
        "Fichiers multipistes : kick et snare, kick et 808 dans un seul fichier MIDI",
        "Glisser-déposer dans n'importe quel DAW, sur Mac ou PC",
        "Licence commerciale : vends tes beats, sans royalties",
      ],
      bonusesTitle: "Plus 6 bonus offerts",
      bonuses: ["Famous Beats MIDI Bundle", "Beat Starters MIDI Bundle", "Hit-Maker Drums Sample Pack", "Drunk Swing Grooves (211 fichiers MIDI)", "MYSTERY Hooks Pack (17 hooks WAV)", "Guide du MIDI Drum Kit (PDF, en anglais)"],
      free: "Offert",
      totalValue: "Valeur totale",
      today: "Aujourd'hui",
    },
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
      "Ton paiement est traité par Stripe, la plateforme de paiement utilisée par des millions d'entreprises, dont Amazon, Google et Shopify, ou par PayPal. Les données de ta carte vont directement à Stripe avec un chiffrement SSL 256 bits et ne passent jamais par nos serveurs.",
    aboutTitle: "Qui est derrière GRIND STUDIO",
    aboutText:
      "On est des beatmakers, et on est dans le game depuis des années, à faire des beats et à créer des outils pour des producteurs comme toi. Il nous a fallu 4 ans pour extraire ces patterns des morceaux qui font bouger les gens, et 2 847 producteurs les utilisent aujourd'hui. Une question ? Écris à support@thegrind.studio : l'un de nous lit chaque e-mail et y répond.",
    timer: { title: "TON EXEMPLAIRE EST RÉSERVÉ PENDANT :", min: "min", sec: "sec", ms: "ms", label: "Ton exemplaire est réservé" },
  },

  form: {
    step1: "Tes infos",
    step1Sub: "Nom et email",
    step2: "Paiement",
    step2Sub: "Infos de paiement",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    next: "CONTINUER",
    back: "Retour",
    respect: "Nous respectons ta vie privée et tes informations.",
    paymentInfo: "INFORMATIONS DE PAIEMENT",
    paymentMethod: "Moyen de paiement",
    card: "Carte",
    paypal: "PayPal",
    notConnected: "Le paiement par carte s'active dès que les clés Stripe sont ajoutées.",
    orCard: "ou paie par carte",
    cardNumber: "Numéro de carte",
    cardExpiry: "MM / AA",
    cardCvc: "CVV",
    paypalNote: "Après avoir cliqué sur « JE VEUX LE PACK ! » ci-dessous, tu termines le paiement sur la page sécurisée de PayPal, puis tu reviens directement à ton téléchargement.",
    oto: "OFFRE UNIQUE :",
    summary: "Récapitulatif",
    total: "Total",
    pay: "JE VEUX LE PACK !",
    paySub: "Obtiens un accès immédiat",
    payBar: "Payer {price}",
    bumpMore: "Détails",
    bumpLess: "Masquer",
    processing: "Paiement en cours…",
    openingPaypal: "Ouverture de PayPal…",
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
      "top-hits": {
        headline: "OUI ! Ajoute le TOP HITS MIDI Bundle !",
        body: [
          "1000 progressions d'accords des plus grands hits (Drake, Kendrick Lamar, Travis Scott, Lil Baby, The Weeknd et d'autres) en **fichiers MIDI glisser-déposer**. Mets-en une sous tes drums et ton beat a l'harmonie d'un hit. Ajoute-le maintenant pour seulement 97 {c}.",
          "Une fois ta commande validée, cette case disparaît : coche-la maintenant et le bundle arrive dans le même téléchargement.",
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
    title: "Merci !",
    sub: "C'est bon, tu es dedans. À toi de cuisiner.",
    paid: "C'est bon, tu l'as !",
    pending: "Paiement en cours…",
    failed: "Paiement non finalisé",
    paidLead: "Paiement reçu. Tes téléchargements sont juste en dessous. Garde cette page en favori : les boutons marchent toujours quand tu reviens.",
    pendingLead: "Ta banque confirme encore le paiement. Recharge cette page dans une minute et tes téléchargements apparaîtront.",
    failedLead: "Rien n'a été débité. Reviens en arrière et réessaie avec une autre carte ou avec PayPal.",
    download: "Télécharger",
    receipt: (provider: string, email: string | null) =>
      `${provider} t'a envoyé ton reçu${email ? ` à ${email}` : ""}.`,
    account: "Retrouve tes téléchargements à tout moment sur",
    fix: "et on règle ça.",
    back: "Retour au paiement",
    support: "Un problème ? Écris-nous à",
  },
};

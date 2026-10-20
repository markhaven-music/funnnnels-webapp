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
    title: "1050 patterns de batterie MIDI + 3 bonus",
    description: "Fais des beats qui bougent avec des drums MIDI en glisser-déposer. 1050 patterns et rolls de batterie MIDI + 3 bonus, par GRIND STUDIO.",
    orderTitle: "Commander le MIDI Drum Kit",
    thanksTitle: "Merci · MIDI Drum Kit",
  },
  orderTopbar: "**ENCORE PLUS DE BLACK FRIDAY :** -90 %, l'offre se termine bientôt",

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

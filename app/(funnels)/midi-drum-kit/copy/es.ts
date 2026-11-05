import type { Copy } from "./en";

// The MIDI Drum Kit funnel in Spanish: ./en.ts translated line by line, same
// marks and structure, in a neutral Spanish that reads right in Spain and in
// Latin America (tú, never vos or vosotros). Prices are written the Spanish
// way, sign after the number ("27 {c}"); dollar visitors get "$27" (./index.ts).
// As in French, the guarantee is a quality guarantee ("Garantía de calidad"),
// never a money-back one: the refund policy only refunds broken or
// mis-described files. Product, folder and bonus names stay in English:
// they're the names on the boxes and in the zip.

export const es: Copy = {
  meta: {
    title: "1050 patrones de batería MIDI + 3 bonos",
    description: "Haz beats que se mueven con baterías MIDI de arrastrar y soltar. 1050 patrones y rolls de batería MIDI + 3 bonos, por GRIND STUDIO.",
    orderTitle: "Pedir el MIDI Drum Kit",
    thanksTitle: "Gracias · MIDI Drum Kit",
  },
  orderTopbar: "**BLACK FRIDAY:** -90 %, la oferta termina pronto",

  footer: { terms: "Términos y condiciones", privacy: "Política de privacidad", refund: "Política de reembolso", contact: "Contacto:" },

  order: {
    secure: "Pago seguro",
    summaryTitle: "Resumen del pedido:",
    productAlt: "MIDI Drum Kit: 1050 patrones de batería MIDI + 3 bonos",
    dl: "También te enviaremos el enlace de descarga por email.",
    bullets: [
      "Patrones de batería de nivel Grammy",
      "Termina tus beats 27x más rápido",
      "Usa la dopamina para enganchar a quien escucha",
      "Llama la atención de artistas top",
      "Patrones usados en grandes hits",
      "Haz fácilmente 750 beats al año",
      "Una biblioteca enorme para explorar",
      "Nunca más te quedes en blanco",
      "Compatible con Mac, PC y cualquier DAW",
      "Oferta por tiempo limitado",
      "Garantía de calidad (sin riesgo)",
      "Limitado a 1250 licencias",
    ],
    completeTitle: "Completa tu pedido:",
    paylogosAlt: "PayPal, Visa, Mastercard, American Express, Discover",
    reviews: [
      { quote: "“Los patrones de batería son justo lo que necesitaba. Perfectos para el trap y el drill de hoy.”", name: "Marcus Thompson", role: "Productor de trap", avatar: "avatar-c" },
      { quote: "“Estos archivos MIDI me ahorraron cientos de horas. Los patrones tienen calidad de estándar de la industria.”", name: "Ardan Solis", role: "Cliente verificado", avatar: "avatar-a" },
      { quote: "“Perfecto para el trap. Los fragmentos le dan ese toque extra que hace destacar los beats.”", name: "Niko Varela", role: "Cliente verificado", avatar: "avatar-a" },
      { quote: "“Así son las herramientas de verdad para producir trap. Cada patrón es un hit esperando a pasar.”", name: "Soraya Kenji", role: "Clienta verificada", avatar: "avatar-a" },
      { quote: "“Los patrones MIDI son una locura. Los uso en cada sesión desde que tengo el pack.”", name: "Marek Tulan", role: "Beatmaker de hip-hop y trap", avatar: "avatar-a" },
      { quote: "“Por fin patrones con la energía del trap actual. Este pack es legendario.”", name: "Aisha Moretti", role: "Beatmaker", avatar: "avatar-a" },
      { quote: "“La creatividad que me dieron estos MIDI es brutal. La base perfecta para cualquier beat de trap.”", name: "Dara Kwon", role: "Productora de trap, más de 100 M de streams", avatar: "avatar-a" },
      { quote: "“Estos patrones pegan más fuerte que todo lo que había encontrado. Herramientas imprescindibles para los productores de hoy.”", name: "Ravi Lomax", role: "Productor de trap, más de 100 M de streams", avatar: "avatar-a" },
    ],
    starsAlt: "5 estrellas",
    guaranteeTitle: "Garantía de calidad de 14 días",
    guaranteeText:
      "Cada patrón de este kit se prueba antes de salir. Si algo falla con tus archivos, escribe a support@thegrind.studio dentro de los 14 días y lo solucionamos: una nueva descarga, un reemplazo o un reembolso si no conseguimos arreglarlo.",
    secureTitle: "Pagos seguros",
    secureText:
      "Los pagos se procesan con todas las tarjetas principales y PayPal, con cifrado SSL de 256 bits. No guardamos ningún dato de pago.",
    timer: { title: "TU COPIA ESTÁ RESERVADA DURANTE:", min: "min", sec: "seg", ms: "ms", label: "Tu copia está reservada" },
  },

  form: {
    step1: "Tus datos",
    step1Sub: "Nombre y email",
    step2: "Pago",
    step2Sub: "Datos de pago",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Email",
    next: "CONTINUAR",
    back: "Volver",
    respect: "Respetamos tu privacidad y tus datos.",
    paymentInfo: "DATOS DE PAGO",
    paymentMethod: "Método de pago",
    card: "Tarjeta",
    paypal: "PayPal",
    notConnected: "El pago con tarjeta se activa en cuanto se añadan las claves de Stripe.",
    orCard: "o paga con tarjeta",
    cardNumber: "Número de tarjeta",
    cardExpiry: "MM / AA",
    cardCvc: "CVV",
    paypalNote: "Después de hacer clic en «¡QUIERO EL PACK!» abajo, terminas el pago en la página segura de PayPal y vuelves directamente a tu descarga.",
    oto: "OFERTA ÚNICA:",
    summary: "Resumen",
    total: "Total",
    pay: "¡QUIERO EL PACK!",
    paySub: "Obtén acceso inmediato",
    processing: "Procesando el pago…",
    openingPaypal: "Abriendo PayPal…",
    paymentFailed: "No se pudo iniciar el pago.",
    paypalFailed: "No se pudo abrir PayPal.",
    bumps: {
      expansions: {
        headline: "¡SÍ! ¡Añade todavía más patrones de batería!",
        body: [
          "3 expansiones del MIDI Drum Kit. Incluyen **Complete Beats de House, Lo-Fi y Afrobeat**. Genera baterías de nivel pro 27x más rápido. Normalmente cuestan 147 {c}, ¡¡pero ahora puedes tenerlas todas por solo 7 {c}!!",
        ],
      },
      hustle: {
        headline: "¡SÍ! ¡También quiero 31 packs MIDI melódicos!",
        body: [
          "El bundle “HUSTLE” incluye 31 packs MIDI profesionales con ideas musicales, progresiones de acordes y melodías. Jazz, trap, hip-hop, lofi, pop y más. Cada pack MIDI cuesta 29 {c} (899 {c} en total), ¡¡pero ahora puedes tenerlos todos con un 90 % de descuento por solo 25 {c}!!",
          "Limitado a los primeros 150 pedidos.",
        ],
      },
      chords: {
        headline: "¡SÍ! ¡Quiero las progresiones de acordes!",
        body: [
          "“Roba” legalmente las progresiones de acordes de las 750 mejores canciones de todos los tiempos. Crea melodías para los charts **50x más rápido**. Cada transcripción vale 19 {c} (14.250 {c} en total), ¡¡pero ahora puedes tenerlas todas por solo 25 {c}!! (Bonos: The Chord Progressions Bible, Drum Loops y 3 packs MIDI Emotional Keys)",
          "Oferta por tiempo limitado.",
        ],
      },
    },
  },

  thanks: {
    title: "¡Gracias!",
    sub: "Ya estás dentro. Te toca cocinar.",
    paid: "¡Ya es tuyo!",
    pending: "Procesando el pago…",
    failed: "Pago no completado",
    paidLead: "Pago recibido. Tus descargas están justo abajo. Guarda esta página en favoritos: los botones siguen funcionando cuando vuelvas.",
    pendingLead: "Tu banco todavía está confirmando el pago. Recarga esta página en un minuto y aparecerán tus descargas.",
    failedLead: "No se te ha cobrado nada. Vuelve atrás e inténtalo de nuevo con otra tarjeta o con PayPal.",
    download: "Descargar",
    receipt: (provider: string, email: string | null) =>
      `${provider} te ha enviado el recibo${email ? ` a ${email}` : ""}.`,
    account: "Encuentra tus descargas cuando quieras en",
    fix: "y lo solucionamos.",
    back: "Volver al pago",
    support: "¿Algún problema? Escríbenos a",
  },
};

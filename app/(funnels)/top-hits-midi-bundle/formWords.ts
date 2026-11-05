// The order form's own words (./OrderForm.tsx), on TOP HITS' and Famous Beats'
// order pages; with the dashboard's edits through the page's words (./words.ts ORDER.form).
// Apart from ./words.ts so the form (a client component) doesn't carry the landing's copy.
export const FORM = {
  step1: "Your Info",
  step1Sub: "Name & Email",
  step2: "Payment",
  step2Sub: "Payment Info",
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  toStep2: "GO TO STEP 2",
  respect: "We respect your privacy & information.",
  back: "Go Back",
  payInfo: "PAYMENT INFORMATION",
  card: "Card",
  paypal: "Paypal",
  orCard: "or pay by card",
  cardNumber: "Card number",
  cardExpiry: "MM / YY",
  cardCvc: "CVV",
  paypalNote: "After you click **GET THE PACK!** below, you finish paying on PayPal's secure page, then come straight back to your download.",
  oto: "ONE-TIME OFFER:",
  summary: "Summary",
  total: "Total",
  pay: "GET THE PACK!",
  paySub: "Get Instant Access",
  processing: "Processing…",
  openingPaypal: "Opening PayPal…",
};
export type FormWords = typeof FORM;

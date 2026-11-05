// The Jazz thank-you page's words (./thank-you/page.tsx), so the dashboard can
// edit them (funnel map → Edit; lib/words.ts). _words_ are the heading's italics;
// {name}, {files}, {provider}, {to}, {email}, {support} and {account} are filled by the page.
export const THANKS = {
  paid: { title: "You're in. _Go write._", lead: "Payment received. Your files are below. Bookmark this page: the buttons keep working when you come back." },
  pending: { title: "Payment _processing._", lead: "Your bank is still confirming the payment. Refresh this page in a minute and your downloads will appear." },
  failed: { title: "Payment _not completed._", lead: "Nothing was charged. Go back and try again with another card or PayPal." },
  download: "Download {name}",
  downloadBonus: "Download bonus: {name}",
  zip: ".zip · {files} MIDI files",
  receipt: "Start with folder 01, file 01. {provider} has emailed your receipt{to}. A file doesn't open? Email {support} and we fix it.",
  receiptTo: " to {email}",
  account: "Find your downloads anytime at {account}",
  back: "Back to checkout",
};

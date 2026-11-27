import { letter, type Recipient } from "@/lib/mail";
import type { Email } from "@/lib/ses";

// The email someone gets the moment they join the MIDI DRUMS BIBLE early-access
// list (/api/checkout/bible), modelled on Cymatics' "You're officially on the
// Early Access List" confirmations (DREAMS, PHARAOH: the date and hour, "watch
// for the text and email with the link", "be ready 15 minutes early", what's
// inside) in Grind Studio's voice (~/.claude/CLAUDE.md "Grind Studio emails").
// One link: video 1.

const VIDEO_1 = "https://m.thegrind.studio/free/bible/1";

export function confirmEmail(to: Recipient): Email {
  return letter({
    to,
    subject: "You're in",
    preheader: "December 21, 11 AM New York. You get in first.",
    body: `Hey {first_name},

You are on the list.

On December 21 the biggest drum pack we ever made comes out.

Everyone else gets it at 12 PM New York time but you get it at 11 AM, one hour before them.

At 11 AM I send you the link by text and by email. Be at your computer 15 minutes early.

Here is what you get: 48 drum styles and whole beats from the first bar to the last. Intro, verse, hook, switch-ups and outro, all in MIDI.

You drop one file in your DAW and you have the drums for a full song.

Most producers will hear about it late but you will be first.

While you wait, watch the first video. It shows you why your beats stay loops.

**[Watch video 1](${VIDEO_1})**`,
    track: { kind: "launch", ref: "bible-confirm" },
  });
}

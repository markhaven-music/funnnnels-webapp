import { letter, type Recipient } from "@/lib/mail";
import type { Email } from "@/lib/ses";
import { KIT_HOME } from "@/lib/liveUrl";

// The email with the download link, sent by /api/optin as soon as someone
// opts in (every time, so asking again gets the link again). ClickFunnels'
// first email of the lead workflows, word for word: "Hey here's the pack" of
// "[#1] (FREE) Rolls Sequence" (the live branch of its 0/100 split test), and
// the same email in "(FREE) Bounce MIDI Pack". The follow-ups are sequences
// (db/free-leads.sql). ClickFunnels' footer (address, unsubscribe) is the one
// letter() adds.
//
// The Bounce one: ClickFunnels' handed out the Rolls pack (the Bounce zip
// only came with the backup link an hour later). Since 2026-11-04 (the
// free-packs ad test, where each pack must stand alone) it's the Rolls email
// line by line with the Bounce pack ("Yes, fix it").

const ROLLS_ZIP = `${KIT_HOME}/free/download/rolls`;

const ROLLS = {
  subject: "Hey {first_name}, here's the 'Rolls' pack",
  preheader: "Here's a direct link to the Rolls pack you requested.",
  body: `Hey {first_name},

As promised, **[here is the Snare and Hi-Hat MIDI Rolls Pack](${ROLLS_ZIP}).**

These rolls are very useful. You can sprinkle them on top of your beats easily.

Some of them are simple, other very complex.

I love them.

(if you're using FL Studio, just drag-and-drop them into the piano roll while holding CTRL or CMD. Then just turn on "Blend with existing data" and move it around)

Reply "THX" and I'll send you another pack in the following days.

Enjoy bro.

P.S.: If you found this email in your "Promotions" tab, please drag it in the "Primary" folder so you will get our future packs in the Primary tabs.`,
};

const BOUNCE = {
  subject: "Hey {first_name}, here's the 'Bounce' pack",
  preheader: "Here's a direct link to the Bounce pack you requested.",
  body: ROLLS.body
    .replace(`**[here is the Snare and Hi-Hat MIDI Rolls Pack](${ROLLS_ZIP}).**`, `**[here is the Bounce MIDI Drum Pack](${KIT_HOME}/free/download/bounce).**`)
    .replace("These rolls are very useful. You can sprinkle them on top of your beats easily.", "These patterns are very useful. You can drop them into your beats easily."),
};

// The Mystery Hooks opt-in (2026-11-04): the Rolls email line by line with
// the Hooks pack; the FL Studio tip is MIDI-only, so it's left out.
const HOOKS = {
  subject: "Hey {first_name}, here's the 'Mystery Hooks' pack",
  preheader: "Here's a direct link to the Mystery Hooks pack you requested.",
  body: `Hey {first_name},

As promised, **[here are the 17 MYSTERY VocaSpace™ Hooks](${KIT_HOME}/free/download/mystery-hooks).**

These hooks leave space for the artist's voice. You can drag them into your DAW and build your beat around them.

They're WAV files, ready to go in any DAW.

I love them.

Reply "THX" and I'll send you another pack in the following days.

Enjoy bro.

P.S.: If you found this email in your "Promotions" tab, please drag it in the "Primary" folder so you will get our future packs in the Primary tabs.`,
};

const COPY = { rolls: ROLLS, bounce: BOUNCE, hooks: HOOKS } as const;

export function firstEmail(which: keyof typeof COPY, to: Recipient): Email {
  const c = COPY[which];
  return letter({ to, subject: c.subject, preheader: c.preheader, body: c.body, lang: "en" });
}

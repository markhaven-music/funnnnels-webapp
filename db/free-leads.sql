-- The free lead magnets' follow-ups, from ClickFunnels (2026-11-03, read from
-- its workflow builder): word for word, ClickFunnels' footer left to letter().
-- The first email (the download link) isn't here: /api/optin sends it at once
-- (app/free/firstEmail.ts). Each sequence starts on the opt-in's tag
-- (app/free/packs.ts); edited from then on in dashboard → Automations. Run once.
--
-- ClickFunnels' "[#1] (FREE) Rolls Sequence" (Rolls opt-ins):
--   email "Hey here's the pack" → 10 min → "💾 Backup Link: Rolls Pack" → tag
--   lead-rolls → 1 day → 50/50 "checkin' in" / "yo" → 1 day → "[#2] MYSTERY
--   Hooks Pack (to Leads)": "A gift for you" (and an SMS) → 2 days → "some tips
--   for the hooks I sent you" → 2 days → Grind Minute.
-- ClickFunnels' "(FREE) Bounce MIDI Pack" (its triggers were off: Bounce
--   opt-ins ran the Rolls one), the same with the Bounce zip in the backup
--   link, tag bounce-pack-ig and "checkin' in" alone.
-- Here: sequences count in hours, so the backup goes 1 hour after the opt-in
-- (ClickFunnels: 10 minutes); one email where ClickFunnels split-tested two
-- ("checkin' in", the one both workflows have); no SMS; and they end after
-- the hooks tips, since Grind Minute is switched off here (docs/email.md).
-- Links: the zips at m.thegrind.studio/free/download/<pack> (app/free),
-- the hooks' page at m.thegrind.studio/mystery-hooks-pack (its ClickFunnels path).
begin;

with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('Free Rolls pack · after opt-in', 'lead-rolls', null, true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 1, $body$💾 Backup Link: Rolls Pack$body$, $body$Hey,

I want to make 100% sure you got your files.

Sometimes technology glitches or emails get buried.

Just in case you couldn't access the main download, here is a direct backup link to the ZIP file:

**👉 [[CLICK HERE TO DOWNLOAD YOUR PACK](https://m.thegrind.studio/free/download/rolls)]**

At Grind Studio, we want you to win.

We are for ambitious beatmakers only.

And we have big things coming up for you.

So put this email in your main Gmail tab.

And reply with "AMBITION" so we know you're serious.

Are you in?

Time to cook up.

Grind Studio$body$),
  (1, 24, $body$checkin' in$body$, $body$Hey {first_name},

I'm really busy rn but I wanted to quickly check in with you... have you tried the Rolls pack?

**What do you think?**

Did those rolls give your drums the bounce you were looking for?

Grind Studio$body$),
  (2, 24, $body$A gift for {first_name|you}$body$, $body$Hey {first_name},

I've been talking a lot about drums lately.

But a beat isn't just drums. You need the **Soul**.

So, to say thanks for reading my emails, I want to give you something special (usually locked in the vault).

**The MYSTERY VocaSpace™ Hooks.**

It’s a folder of **17 Melodies** engineered to leave space for the artist (DopaSpace technology).

No strings attached.

Just grab them and cook up.

**[👉 [Download your 17 Mystery Hooks here](https://m.thegrind.studio/mystery-hooks-pack)]**

Enjoy the sauce.

Grind Studio$body$),
  (3, 48, $body$some tips for the hooks I sent you$body$, $body$Hey {first_name},

I hope you’ve been experimenting with the **Mystery Hooks** I sent you a few days ago.

But I need to address a common issue I see when producers use high-quality loops.

You drag in a professional melody. It sounds amazing solo.

Then you add your drums... and suddenly, the whole beat feels "small."

The magic disappears.

Why?

It’s what I call **The 50/50 Frequency Rule.**

A modern beat is a conversation between two elements:

**The Top Line** (Melodies/Vocals)

**The Foundation** (Kick/Snare/Bass)

The Mystery Hooks I gave you are engineered with VocaSpace™ technology.

They are clean. They leave space.

**But space is useless if you don't fill it with power.**

If your drums are weak, thin, or off-grid, the melody has nothing to "lean" on.

It’s like trying to build a skyscraper on quicksand.

**Here is the technical reality:**

A great melody actually highlights bad drums.

If the melody is crisp and wide, but your Kick is muddy or your Snare pattern is robotic, the contrast makes your drums sound even more amateur.

**So, how do you fix the Foundation?**

It comes down to **Selection over Processing.**

Most producers try to fix weak drums with EQ and Compressors.

They boost the bass. They add saturation.

But you cannot polish a bad source sound.

**The Pro Workflow:**

Don't touch the mix knob yet.

Swap the sample.

Find a Kick that naturally hits at **50-60Hz** (Chest punch).
Find a Snare that naturally cuts at **200Hz** (Body) and **5kHz** (Snap).

When you pair a DopaSpace™ Melody with well-selected drums, you don't need to mix.

The track mixes itself because the puzzle pieces fit together physically.

Go back to your DAW.

Take one of the Mystery Hooks.

And instead of trying to "fix" your current drums, try swapping them for heavier, cleaner samples.

You will hear the difference instantly.

Talk soon,

Grind Studio$body$)
) as v(position, delay_hours, subject, body);

-- Bounce: the same follow-ups, with ClickFunnels' Bounce backup link.
with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('Free Bounce pack · after opt-in', 'bounce-pack-ig', null, true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, st.position, st.delay_hours, st.subject,
       case when st.position = 0
            then replace(st.body, '**👉 [[CLICK HERE TO DOWNLOAD YOUR PACK](https://m.thegrind.studio/free/download/rolls)]**', '**👉 [[CLICK HERE TO DOWNLOAD "BOUNCE"](https://m.thegrind.studio/free/download/bounce)]**')
            else st.body end
from s, public.sequence_steps st
join public.sequences r on r.id = st.sequence_id and r.name = 'Free Rolls pack · after opt-in';

commit;

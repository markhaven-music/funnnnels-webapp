-- The Drum Kit follow-up for free-pack leads (2026-11-04, "Yes, draft it" →
-- "Yes, turn it on"). Rolls, Bounce and Mystery Hooks opt-ins also get the
-- free-pack tag (app/free/packs.ts); the pack's own emails end on day 4, and
-- nothing in them links to the Drum Kit. Four emails on days 5, 7, 10 and 14
-- (the first delay counts from the opt-in, the others from the previous email),
-- one link each, claims from grind-studio-landing-pages/docs/product-brief.md,
-- the price US/Canada visitors see ($27). Drum Kit buyers (owns-midi-drum-kit)
-- never start it and drop out when they buy. Run once.
begin;

with s as (
  insert into public.sequences (name, trigger_tag, exit_tag, lang, active)
  values ('Free packs · Drum Kit follow-up', 'free-pack', 'owns-midi-drum-kit', null, true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 120, $body$why your drums sound stiff$body$, $body$Hey {first_name},

Quick question.

When you finish a beat, do the drums sound stiff?

Every hit on the grid. Same velocity. It sounds programmed, not played.

It's rarely the samples. It's the pattern.

Beats on the radio bounce because of where the hits land. The kick and snare balance. The hi-hat rolls. The sweet spot between simple and complex.

We spent 4 years turning that into MIDI. 1050 drum patterns, modeled after Billboard producers.

Drag one into your DAW and the bounce is already there.

[See the MIDI Drum Kit](https://m.thegrind.studio/en/midi-drum-kit?utm_source=email&utm_medium=sequence&utm_campaign=free-packs-kit&utm_content=day5)

Grind Studio$body$),
  (1, 48, $body$what's inside the kit$body$, $body$Hey {first_name},

If the free pack worked for you, here's what the full kit looks like.

1050 MIDI files, in two kinds. Patterns: full 4-bar arrangements, 500+. Fragments: rolls, fills and short pieces, 250+.

Folders for 808, kick, snare, closed and open hi-hats, accents and extra rolls. Kick & snare, kick & 808 and complete beats come as multi-track MIDI.

Hi-hats go from Basic to Complex to Hyper-Complex, with roll ups and roll downs.

Standard .mid. FL Studio, Ableton, Logic, Pro Tools, Cubase, Studio One, Reaper.

Three bonuses: Famous Beats (multi-track transcriptions of famous beats), Beat Starters (MIDI ideas) and Hit-Maker Drums (one-shot WAVs). 1,465 files in total.

$27. One payment.

[Get the kit](https://m.thegrind.studio/en/midi-drum-kit?utm_source=email&utm_medium=sequence&utm_campaign=free-packs-kit&utm_content=day7)

Grind Studio$body$),
  (2, 72, $body$two questions we get a lot$body$, $body$Hey {first_name},

Two questions producers ask before getting the kit.

Do I need new samples? No. It's MIDI. Your own kick, snare and 808 play the patterns.

Can I sell beats made with it? Yes. Full commercial license. BeatStars, placements, zero royalties.

And a few things they told us after:

"I realized how dumb it was to program every single drum from scratch. Thank you." Arlen Kovak, trap producer

"Finally found MIDI patterns that actually sound like the beats on the radio." Luca Marberg, beat maker

"Can't explain but they sound like money." Stefan Kožar, advanced beatmaker

[Get the kit](https://m.thegrind.studio/en/midi-drum-kit?utm_source=email&utm_medium=sequence&utm_campaign=free-packs-kit&utm_content=day10)

Grind Studio$body$),
  (3, 96, $body$last one about the kit$body$, $body$Hey {first_name},

Last email about this, then I'll leave it.

If you're still programming every hi-hat by hand, the MIDI Drum Kit is $27. One payment, yours forever.

Drag a pattern in. Put your sounds on it. Move on to the melody.

If a file doesn't load in your DAW, reply to this email and we fix it.

[Get the kit](https://m.thegrind.studio/en/midi-drum-kit?utm_source=email&utm_medium=sequence&utm_campaign=free-packs-kit&utm_content=day14)

Grind Studio$body$)
) as v(position, delay_hours, subject, body);

commit;

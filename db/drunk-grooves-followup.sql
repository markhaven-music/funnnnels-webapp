-- The follow-up after a Drunk Swing Grooves purchase (2026-11-08, "dopo che qualcuno
-- compra drunk swing grooves una sequenza per fargli prendere anche midi drum kit? o
-- jazz progressions?" → "si"). Two sequences on the same trigger, because a sequence
-- has one exit tag: the Jazz MIDI Pack first (same buyer: lofi, neo soul; grooves +
-- chords), the MIDI Drum Kit after. Whoever owns the product (owns-<product>, every
-- order incl. add-ons and upsells, and ClickFunnels' buyers: lib/catalog.ts) never
-- starts that sequence and drops out the moment they buy it.
-- Jazz: day 1, 3, 6. Drum Kit: day 8, 11 (first delay from the purchase, the
-- others from the previous email). One link each. Claims: jazz-midi-pack/BRIEF.md,
-- grind-studio-landing-pages/docs/product-brief.md (as db/free-packs-kit.sql).
-- English only: the funnel is English. Run once.
begin;

with s as (
  insert into public.sequences (name, trigger_tag, exit_tag, lang, active)
  values ('Drunk Swing Grooves · Jazz MIDI Pack follow-up', 'buyer-drunk-swing-grooves', 'owns-jazz-midi-pack', null, true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 24, $body$what goes on top of the grooves$body$, $body$Hey {first_name},

Your Drunk Swing Grooves give you the feel. The drums lean back, the beat breathes.

Then you open a piano roll for the chords and it's back to stiff: block triads, every note on the grid.

That's the part the Jazz MIDI Pack does. The progressions behind lofi, neo soul and jazz, as MIDI, already voiced the way a pianist plays them. The voices move by small steps from one chord to the next, so it sounds played, not stacked.

Drag a progression over one of your grooves and the beat is there.

[Hear the Jazz MIDI Pack](https://m.thegrind.studio/jazz-midi-pack?utm_source=email&utm_medium=sequence&utm_campaign=drunk-grooves-jazz&utm_content=day1)

Grind Studio$body$),
  (1, 48, $body$what's inside the Jazz MIDI Pack$body$, $body$Hey {first_name},

Here's what you'd drop over your grooves.

10,496 MIDI files in 5 folders.

82 progressions: ii-V-I, turnarounds, the changes of standards like Autumn Leaves and Fly Me to the Moon, neo soul staples like the Royal Road. Each one in 12 voicings and 8 rhythms.

Every progression in all 12 keys. Walking, two-feel and bossa bass lines. Lofi, neo soul, trap soul and deep house loops with chords, bass and drums as separate MIDI.

The chord names are written into every file, so you see what's playing.

Plus six bonuses, a PDF guide among them.

$27 (€27 in Europe). One payment.

[Get the Jazz MIDI Pack](https://m.thegrind.studio/jazz-midi-pack?utm_source=email&utm_medium=sequence&utm_campaign=drunk-grooves-jazz&utm_content=day3)

Grind Studio$body$),
  (2, 72, $body$last one about the chords$body$, $body$Hey {first_name},

Last email about the Jazz MIDI Pack.

Do you need to know jazz theory? No. The voicings are done. You pick a progression, drag it in, put your own piano or Rhodes on it.

Does it work in my DAW? Any DAW that opens .mid: Ableton, Logic, FL Studio, Cubase, Studio One, Reaper, GarageBand.

If a file doesn't load, reply to this email and we fix it. It's covered by the 14-day guarantee.

[Get the Jazz MIDI Pack](https://m.thegrind.studio/jazz-midi-pack?utm_source=email&utm_medium=sequence&utm_campaign=drunk-grooves-jazz&utm_content=day6)

Grind Studio$body$)
) as v(position, delay_hours, subject, body);

with s as (
  insert into public.sequences (name, trigger_tag, exit_tag, lang, active)
  values ('Drunk Swing Grooves · MIDI Drum Kit follow-up', 'buyer-drunk-swing-grooves', 'owns-midi-drum-kit', null, true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 192, $body$when the beat isn't swing$body$, $body$Hey {first_name},

Your Drunk Swing Grooves cover the laid-back beats.

But not every beat is lofi. Trap, drill, pop-rap: there the drums have to bounce, and programming that by hand takes hours.

The MIDI Drum Kit is 1050 drum patterns modeled after Billboard producers. Full 4-bar patterns, rolls, fills, hi-hats from basic to hyper-complex, and complete beats as multi-track MIDI.

Drag one in, put your own kick, snare and 808 on it, and the bounce is already there.

[See the MIDI Drum Kit](https://m.thegrind.studio/en/midi-drum-kit?utm_source=email&utm_medium=sequence&utm_campaign=drunk-grooves-kit&utm_content=day8)

Grind Studio$body$),
  (1, 72, $body$last one about the kit$body$, $body$Hey {first_name},

Last email about this, then I'll leave it.

The MIDI Drum Kit: 1050 patterns, plus three bonuses (Famous Beats, Beat Starters and Hit-Maker Drums), 1,465 files in total. Full commercial license, zero royalties.

$27. One payment, yours forever.

If a file doesn't load in your DAW, reply to this email and we fix it.

[Get the kit](https://m.thegrind.studio/en/midi-drum-kit?utm_source=email&utm_medium=sequence&utm_campaign=drunk-grooves-kit&utm_content=day11)

Grind Studio$body$)
) as v(position, delay_hours, subject, body);

commit;

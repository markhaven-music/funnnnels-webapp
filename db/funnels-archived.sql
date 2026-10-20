-- Archived funnels (applied to Supabase wsynmzewejgzugljqpky as migration "funnels_archived").
-- They stay in the table and keep working at /p/<id> and in the editor, but
-- leave the dashboard's funnel list (lib/store.ts listFunnels).
alter table public.funnels add column archived_at timestamptz;

-- Archived on 2026-10-20 ("don't show funnel templates or examples"):
--   the old "New with AI" example prompts (commit 6a36e6e):
--     f_mpg96mj2_bkg8, f_mpfmlxs6_t1l3  Build a SaaS landing page for an AI note-taking app
--     f_mpfl6rp6_p6fu, f_mper6dod_el3m  Build a webinar registration funnel for a free workshop
--     f_mpcwj572_7q0h                   Product page for a $49 MIDI drum kit
--   builder tests from 2026-05-19:
--     f_mpcy8u14_ahf2 undo test, f_mpcxjuic_tqn4 DnD test, f_mpcuxrbp_35kq Test funnel,
--     f_mpcw6a60_uh1o, f_mpcw2mjw_3h0l, f_mpcverda_q9qr Untitled funnel
--   an early draft, not the live page:
--     f_mpcx1nbf_d3ac midi drum kit landing page b2c
-- Bring one back: update public.funnels set archived_at = null where id = '<id>';

-- The Mystery Hooks opt-in's follow-ups (2026-11-04, the free-packs ad test;
-- app/free/hooks.ts). The Rolls sequence (db/free-leads.sql) with the Hooks
-- pack: the backup link is the Hooks zip, the check-in asks about the hooks,
-- the "A gift" email (which hands out the Mystery Hooks) is left out, and the
-- hooks tips come on the same day as for Rolls opt-ins (hour 97). Run once.
begin;

with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('Free Mystery Hooks pack · after opt-in', 'lead-hooks', null, true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id,
       case st.position when 3 then 2 else st.position end,
       case st.position when 3 then 72 else st.delay_hours end,
       case st.position when 0 then '💾 Backup Link: Mystery Hooks Pack' else st.subject end,
       case st.position
         when 0 then replace(st.body, 'https://m.thegrind.studio/free/download/rolls', 'https://m.thegrind.studio/free/download/mystery-hooks')
         when 1 then replace(replace(st.body,
           'have you tried the Rolls pack?', 'have you tried the Mystery Hooks?'),
           'Did those rolls give your drums the bounce you were looking for?', 'Did those hooks give your beats the soul you were looking for?')
         else st.body end
from s, public.sequence_steps st
join public.sequences r on r.id = st.sequence_id and r.name = 'Free Rolls pack · after opt-in'
where st.position in (0, 1, 3);

commit;

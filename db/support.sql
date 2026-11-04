-- Support inbox (dashboard → Support), applied to Supabase wsynmzewejgzugljqpky
-- as migration "support_inbox". The email job (/api/cron/email) copies
-- support@thegrind.studio's INBOX and Sent folders from Namecheap Private
-- Email over IMAP (lib/support.ts); replies go out over its SMTP and are
-- saved to its Sent folder, so the mailbox stays the one source of truth.
-- RLS on, no policies: only the server (service role) reads or writes.

-- One row per email, either way. A conversation is everything with one
-- customer address (`customer`, lower case).
create table public.support_messages (
  id bigint generated always as identity primary key,
  -- The RFC Message-ID, or "<folder>:<uidvalidity>:<uid>" when it has none.
  message_id text not null unique,
  folder text not null,
  uid bigint,
  direction text not null check (direction in ('in', 'out')),
  customer text not null,
  from_email text,
  from_name text,
  to_email text,
  subject text,
  text_body text,
  html_body text,
  -- The first ~160 characters of the text, for the conversation list
  -- (added as migration "support_inbox_snippet").
  snippet text,
  in_reply_to text,
  refs text,
  sent_at timestamptz not null,
  -- Opened in the dashboard (incoming only).
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index support_messages_customer_idx on public.support_messages (customer, sent_at desc);
create index support_messages_sent_idx on public.support_messages (sent_at desc);
alter table public.support_messages enable row level security;

-- Where the copy got to, per IMAP folder.
create table public.support_sync (
  folder text primary key,
  uid_validity bigint not null,
  last_uid bigint not null default 0,
  synced_at timestamptz not null default now()
);
alter table public.support_sync enable row level security;

-- A conversation marked done; a newer incoming email opens it again.
create table public.support_threads (
  customer text primary key,
  done_at timestamptz
);
alter table public.support_threads enable row level security;

-- Allow one email address to join more than one product waitlist while keeping
-- repeat submissions for the same product idempotent.
begin;

alter table public.waitlist
  alter column source set not null;

create unique index waitlist_email_source_key
  on public.waitlist (lower(email), source);

drop index public.waitlist_email_key;

commit;

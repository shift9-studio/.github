-- Keep every waitlist membership attributable to a real product surface.
alter table public.waitlist
  add constraint waitlist_source_nonempty
  check (length(btrim(source)) > 0);

-- Structured error monitoring hooks schema

create table if not exists public.log_events (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  event text not null,
  context jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists log_events_occurred_at_idx
  on public.log_events (occurred_at desc);

create index if not exists log_events_level_idx
  on public.log_events (level);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'log_events_level_check'
      and conrelid = 'public.log_events'::regclass
  ) then
    alter table public.log_events
      add constraint log_events_level_check
      check (level in ('info', 'warn', 'error'));
  end if;
end $$;


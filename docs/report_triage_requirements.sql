-- Moderation/report triage schema updates

alter table if exists public.reports
  add column if not exists status text not null default 'open';

alter table if exists public.reports
  add column if not exists review_note text;

alter table if exists public.reports
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

alter table if exists public.reports
  add column if not exists reviewed_at timestamptz;

create index if not exists reports_status_created_at_idx
  on public.reports(status, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_status_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_status_check
      check (status in ('open', 'under_review', 'resolved', 'dismissed'));
  end if;
end $$;


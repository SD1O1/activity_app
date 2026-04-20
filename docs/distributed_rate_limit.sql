-- Distributed rate-limit primitives for API routes.
-- This replaces single-instance in-memory counters with DB-backed counters.

create table if not exists public.rate_limit_buckets (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_reset_at_idx
  on public.rate_limit_buckets (reset_at);

create or replace function public.consume_rate_limit_atomic(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_row public.rate_limit_buckets%rowtype;
  v_now timestamptz := now();
  v_reset timestamptz := v_now + make_interval(secs => (p_window_ms::numeric / 1000.0));
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return false;
  end if;

  if p_limit <= 0 or p_window_ms <= 0 then
    return false;
  end if;

  insert into public.rate_limit_buckets as b (key, count, reset_at, created_at, updated_at)
  values (p_key, 1, v_reset, v_now, v_now)
  on conflict (key) do nothing;

  select *
  into v_row
  from public.rate_limit_buckets
  where key = p_key
  for update;

  if v_row.reset_at <= v_now then
    update public.rate_limit_buckets
    set count = 1, reset_at = v_reset, updated_at = v_now
    where key = p_key;
    return false;
  end if;

  if v_row.count >= p_limit then
    return true;
  end if;

  update public.rate_limit_buckets
  set count = count + 1, updated_at = v_now
  where key = p_key;

  return false;
end;
$$;

grant execute on function public.consume_rate_limit_atomic(text, integer, integer) to service_role;


-- Review public replies. Apply in the Supabase SQL editor for this Review project.
-- No secrets belong in this file. This schema is for Review only.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'trial',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.review_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_cases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.review_businesses (id) on delete cascade,
  reviewer_name text check (reviewer_name is null or char_length(reviewer_name) between 1 and 120),
  platform text check (platform is null or char_length(platform) between 1 and 40),
  review_text text not null check (char_length(review_text) between 1 and 8000),
  approved_replies jsonb not null default '[]'::jsonb,
  refund_wording text,
  replacement_wording text,
  timeline_wording text,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_cases_replies_array check (jsonb_typeof(approved_replies) = 'array'),
  constraint review_cases_replies_count check (jsonb_array_length(approved_replies) <= 20),
  constraint review_cases_replies_strings check (
    not exists (
      select 1 from jsonb_array_elements(approved_replies) as reply
      where jsonb_typeof(reply) <> 'string'
        or char_length(reply #>> '{}') < 1
        or char_length(reply #>> '{}') > 2000
    )
  ),
  constraint review_cases_refund_len check (refund_wording is null or char_length(refund_wording) between 1 and 500),
  constraint review_cases_replacement_len check (replacement_wording is null or char_length(replacement_wording) between 1 and 500),
  constraint review_cases_timeline_len check (timeline_wording is null or char_length(timeline_wording) between 1 and 500)
);

create table if not exists public.review_support_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.review_request_buckets (
  user_id uuid primary key,
  window_start timestamptz not null,
  hits integer not null
);

create index if not exists review_businesses_owner_idx on public.review_businesses (owner_id, updated_at desc);
create index if not exists review_cases_business_idx on public.review_cases (business_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.review_businesses enable row level security;
alter table public.review_cases enable row level security;
alter table public.review_support_requests enable row level security;
alter table public.review_request_buckets enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "own businesses" on public.review_businesses
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own cases" on public.review_cases
  for all to authenticated
  using (exists (select 1 from public.review_businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.review_businesses b where b.id = business_id and b.owner_id = auth.uid()));

create or replace function public.handle_new_review_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_review on auth.users;
create trigger on_auth_user_created_review
  after insert on auth.users
  for each row execute function public.handle_new_review_user();

create or replace function public.verify_review_connection()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select auth.uid() is not null
$$;

create or replace function public.consume_review_request(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket_start timestamptz := date_trunc('minute', now());
  next_hits integer;
begin
  if auth.role() is distinct from 'service_role' then
    return false;
  end if;
  insert into public.review_request_buckets as bucket (user_id, window_start, hits)
  values (p_user, bucket_start, 1)
  on conflict (user_id) do update
    set hits = case when bucket.window_start = excluded.window_start then bucket.hits + 1 else 1 end,
        window_start = excluded.window_start
  returning hits into next_hits;
  return next_hits <= 60;
end;
$$;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.review_businesses to authenticated;
grant select, insert, update, delete on public.review_cases to authenticated;
grant execute on function public.verify_review_connection() to authenticated;
grant execute on function public.consume_review_request(uuid) to service_role;

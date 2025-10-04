-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- 1) Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

-- Function to insert profile when a new user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email);
  return new;
end;$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 2) Tutors
create table if not exists public.tutors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- 3) Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  featured_image_url text,
  youtube_url text,
  tutor_id uuid not null references public.tutors(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes int generated always as ((extract(epoch from (ends_at - starts_at))/60)::int) stored,
  price_cents int not null default 0,
  capacity int not null check (capacity >= 0),
  recurrence_rule text,
  created_at timestamptz not null default now()
);
create index if not exists courses_starts_at_idx on public.courses (starts_at);

-- 4) Registrations
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','waitlisted','refunded')),
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);
create index if not exists registrations_course_idx on public.registrations (course_id);
create index if not exists registrations_user_idx on public.registrations (user_id, status);

-- 5) View to count seats taken per course
create or replace view public.course_counts as
select
  c.id as course_id,
  c.capacity,
  count(r.*) filter (where r.status in ('pending','confirmed')) as taken
from public.courses c
left join public.registrations r on r.course_id = c.id
group by c.id;

-- RPC to lock a course row and return capacity and current taken seats. Used by the
-- claim-seat Edge Function to atomically reserve seats.
create or replace function public.lock_course_and_count(p_course_id uuid)
returns table (course_id uuid, capacity int, taken int)
language plpgsql as $$
begin
  -- lock the specific course row to prevent concurrent modifications
  perform 1 from public.courses where id = p_course_id for update;
  return query
    select c.id,
           c.capacity,
           count(r.*) filter (where r.status in ('pending','confirmed')) as taken
    from public.courses c
    left join public.registrations r on r.course_id = c.id
    where c.id = p_course_id
    group by c.id, c.capacity;
end;
$$;

-- 6) Prevent registrations for past courses
create or replace function public.prevent_past_registration()
returns trigger language plpgsql as $$
declare
  course_rec record;
begin
  select * into course_rec from public.courses where id = new.course_id;
  if course_rec.starts_at < now() then
    raise exception 'Cannot register for past course';
  end if;
  return new;
end;$$;
create trigger registrations_no_past
before insert on public.registrations
for each row execute procedure public.prevent_past_registration();

-- 7) Row Level Security
alter table public.profiles enable row level security;
alter table public.tutors enable row level security;
alter table public.courses enable row level security;
alter table public.registrations enable row level security;

-- profiles: users can read/update their own; admins can manage all
create policy if not exists "profiles select self" on public.profiles
for select using (auth.uid() = user_id);
create policy if not exists "profiles update self" on public.profiles
for update using (auth.uid() = user_id);
create policy if not exists "profiles admin all" on public.profiles
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- tutors: public read; admins manage
create policy if not exists "tutors read" on public.tutors
for select using (true);
create policy if not exists "tutors admin all" on public.tutors
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- courses: public read; admins manage
create policy if not exists "courses read" on public.courses
for select using (true);
create policy if not exists "courses admin all" on public.courses
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- registrations: owners read/write; admins manage
create policy if not exists "registrations own read" on public.registrations
for select using (auth.uid() = user_id);
create policy if not exists "registrations own insert" on public.registrations
for insert with check (auth.uid() = user_id);
create policy if not exists "registrations own update" on public.registrations
for update using (auth.uid() = user_id);
create policy if not exists "registrations admin all" on public.registrations
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
-- ============================================================
-- Migration 002: Profile enhancements
-- ============================================================

-- Add new columns to profiles
alter table public.profiles
  add column if not exists phone       text,
  add column if not exists city        text,
  add column if not exists bio         text,
  add column if not exists is_public   boolean not null default true;

-- Update trigger to read role from metadata at signup time
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'homeowner')
  );
  return new;
end;
$$;

-- Allow users to always see their own profile regardless of is_public
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

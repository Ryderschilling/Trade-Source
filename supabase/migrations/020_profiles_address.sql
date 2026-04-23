alter table public.profiles
  add column if not exists address text;

-- Update trigger to also persist address from signup metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, address)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'homeowner'),
    new.raw_user_meta_data->>'address'
  );
  return new;
end;
$$;

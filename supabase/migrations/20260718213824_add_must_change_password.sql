alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

revoke update (must_change_password) on table public.profiles from anon, authenticated;

create or replace function public.handle_user_password_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.encrypted_password is distinct from new.encrypted_password then
    update public.profiles
    set must_change_password = false,
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_user_password_updated() from public, anon, authenticated;

drop trigger if exists on_auth_user_password_updated on auth.users;
create trigger on_auth_user_password_updated
after update of encrypted_password on auth.users
for each row execute function public.handle_user_password_updated();

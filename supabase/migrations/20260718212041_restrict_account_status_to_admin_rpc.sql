revoke update (account_status) on table public.profiles from authenticated;

create or replace function public.update_teacher_account_status(
  p_profile_id uuid,
  p_account_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only an active platform administrator can change account status'
      using errcode = '42501';
  end if;

  if p_account_status not in ('active', 'suspended', 'rejected') then
    raise exception 'Invalid account status'
      using errcode = '22023';
  end if;

  select profile.account_status
  into current_status
  from public.profiles as profile
  where profile.id = p_profile_id
    and profile.role = 'teacher'
  for update;

  if not found then
    raise exception 'Teacher profile not found'
      using errcode = 'P0002';
  end if;

  if not (
    (current_status in ('pending', 'rejected') and p_account_status = 'active')
    or (current_status = 'pending' and p_account_status = 'rejected')
    or (current_status = 'active' and p_account_status = 'suspended')
    or (current_status = 'suspended' and p_account_status = 'active')
  ) then
    raise exception 'Invalid account status transition'
      using errcode = '22023';
  end if;

  update public.profiles
  set account_status = p_account_status,
      updated_at = now()
  where id = p_profile_id
    and role = 'teacher';

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  )
  values (
    (select auth.uid()),
    'teacher_account_status_changed',
    'profile',
    p_profile_id,
    jsonb_build_object('account_status', current_status),
    jsonb_build_object('account_status', p_account_status)
  );
end;
$$;

revoke all on function public.update_teacher_account_status(uuid, text) from public, anon;
grant execute on function public.update_teacher_account_status(uuid, text) to authenticated;

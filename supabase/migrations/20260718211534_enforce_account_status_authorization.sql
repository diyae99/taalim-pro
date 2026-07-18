create or replace function public.is_active_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'teacher'
      and profile.account_status = 'active'
  );
$$;

revoke all on function public.is_active_teacher() from public;
grant execute on function public.is_active_teacher() to authenticated;

create or replace function public.protect_profile_authorization_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.account_status is distinct from old.account_status)
    and not public.is_platform_admin()
  then
    raise exception 'Only an active platform administrator can change role or account status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_authorization_fields() from public, anon, authenticated;

drop trigger if exists protect_profile_authorization_fields on public.profiles;
create trigger protect_profile_authorization_fields
before update of role, account_status on public.profiles
for each row execute function public.protect_profile_authorization_fields();

revoke insert, update, delete on table public.profiles from anon;
revoke insert, update, delete on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (
  full_name,
  phone,
  avatar_path,
  city,
  school_name,
  school_level,
  school_subject,
  updated_at,
  account_status
) on table public.profiles to authenticated;

drop policy if exists "levels_read_active_or_admin" on public.levels;
create policy "levels_read_active_or_admin"
on public.levels for select to authenticated
using ((select public.is_platform_admin()) or ((select public.is_active_teacher()) and is_active));

drop policy if exists "subjects_read_active_or_admin" on public.subjects;
create policy "subjects_read_active_or_admin"
on public.subjects for select to authenticated
using ((select public.is_platform_admin()) or ((select public.is_active_teacher()) and is_active));

drop policy if exists "plans_read_active_or_admin" on public.plans;
create policy "plans_read_active_or_admin"
on public.plans for select to authenticated
using ((select public.is_platform_admin()) or ((select public.is_active_teacher()) and is_active));

drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin"
on public.subscriptions for select to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "subscription_subjects_select_own_or_admin" on public.subscription_subjects;
create policy "subscription_subjects_select_own_or_admin"
on public.subscription_subjects for select to authenticated
using (
  (select public.is_platform_admin())
  or (
    (select public.is_active_teacher())
    and exists (
      select 1
      from public.subscriptions as subscription
      where subscription.id = subscription_subjects.subscription_id
        and subscription.teacher_id = (select auth.uid())
    )
  )
);

drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin"
on public.payments for select to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "quota_transactions_select_own_or_admin" on public.quota_transactions;
create policy "quota_transactions_select_own_or_admin"
on public.quota_transactions for select to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "exam_downloads_select_own_or_admin" on public.exam_downloads;
create policy "exam_downloads_select_own_or_admin"
on public.exam_downloads for select to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "exam_events_select_own_or_admin" on public.exam_events;
create policy "exam_events_select_own_or_admin"
on public.exam_events for select to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "exam_events_insert_own_or_admin" on public.exam_events;
create policy "exam_events_insert_own_or_admin"
on public.exam_events for insert to authenticated
with check (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "header_profiles_select_own_or_admin" on public.teacher_header_profiles;
create policy "header_profiles_select_own_or_admin"
on public.teacher_header_profiles for select to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "header_profiles_insert_own_or_admin" on public.teacher_header_profiles;
create policy "header_profiles_insert_own_or_admin"
on public.teacher_header_profiles for insert to authenticated
with check (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "header_profiles_update_own_or_admin" on public.teacher_header_profiles;
create policy "header_profiles_update_own_or_admin"
on public.teacher_header_profiles for update to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
)
with check (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

drop policy if exists "header_profiles_delete_own_or_admin" on public.teacher_header_profiles;
create policy "header_profiles_delete_own_or_admin"
on public.teacher_header_profiles for delete to authenticated
using (
  (select public.is_platform_admin())
  or ((select public.is_active_teacher()) and teacher_id = (select auth.uid()))
);

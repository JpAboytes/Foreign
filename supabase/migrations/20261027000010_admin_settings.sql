-- Admin y ajustes: preferencia de notificaciones, políticas de moderación del admin y RPCs
-- para listar/borrar usuarios y borrar la propia cuenta. El rol admin sigue saliendo de user_roles
-- vía is_admin(); ninguna de estas rutas confía en datos enviados por el cliente.

-- Preferencia de notificaciones (antes users.notificationsEnabled en Firestore).
-- El usuario ya puede editar su propio perfil (profiles_update_own).
alter table public.profiles
  add column notifications_enabled boolean not null default true;

-- El admin puede corregir perfiles ajenos (moderación).
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- El admin puede editar los temas/bio/disponibilidad de cualquier mentor
-- (el grant por columna de mentors ya limita las columnas editables; rating sigue protegido).
create policy "mentors_update_admin" on public.mentors
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Listado de usuarios para el panel admin. El correo vive en auth.users, así que se
-- expone solo por esta función, que exige ser admin.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  name text,
  photo_url text,
  university text,
  created_at timestamptz,
  is_mentor boolean,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
    select
      p.id,
      u.email::text,
      p.name,
      p.photo_url,
      p.university,
      p.created_at,
      exists (select 1 from public.mentors m where m.user_id = p.id),
      exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin')
    from public.profiles p
    join auth.users u on u.id = p.id;
end;
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- Borra a un usuario (auth.users; el resto se elimina en cascada). No permite borrarse
-- a sí mismo ni a otros admins. Los archivos de Storage no se borran aquí.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'No puedes eliminar tu propia cuenta desde el panel' using errcode = '22023';
  end if;
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'admin') then
    raise exception 'No se puede eliminar a un administrador' using errcode = '22023';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- Borrado de la propia cuenta (requisito de las tiendas). Elimina auth.users y, en cascada,
-- perfil y contenido. Pendiente (Edge Function): borrar los archivos del usuario en Storage.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Une las políticas permisivas duplicadas que el advisor de rendimiento marca como
-- `multiple_permissive_policies` (mentors, messages, profiles). Postgres combina las
-- políticas permisivas con OR, así que una sola política con `A or B` (en USING y en
-- WITH CHECK) da exactamente el mismo acceso y se evalúa una sola vez por fila.

-- mentors: UPDATE = admin o el propio mentor.
drop policy if exists mentors_update_admin on public.mentors;
drop policy if exists mentors_update_own on public.mentors;
create policy mentors_update on public.mentors
  for update to authenticated
  using ((select public.is_admin()) or user_id = (select auth.uid()))
  with check ((select public.is_admin()) or user_id = (select auth.uid()));

-- profiles: UPDATE = admin o el propio usuario.
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using ((select public.is_admin()) or id = (select auth.uid()))
  with check ((select public.is_admin()) or id = (select auth.uid()));

-- messages: SELECT = participante del chat, o admin si el mensaje tiene un reporte abierto.
drop policy if exists messages_select_participant on public.messages;
drop policy if exists messages_select_admin_reported on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (
    (select public.is_chat_participant(messages.session_id))
    or (
      (select public.is_admin())
      and exists (
        select 1 from public.reports r
        where r.target_type = 'message'
          and r.target_id = messages.id::text
          and r.status = 'open'
      )
    )
  );

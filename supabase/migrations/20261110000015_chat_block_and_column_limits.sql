-- Chat: el bloqueo corta el contacto (Apple 1.2 / Google UGC) y se limitan las columnas que el
-- cliente puede modificar.
--  * Antes, un participante podía reescribir cualquier columna de cualquier mensaje de la sesión
--    (incluido el texto del otro) y reasignar mentor_id/student_id de la sesión.
--  * Antes, un usuario bloqueado podía seguir enviando mensajes y abrir sesiones nuevas.

-- ¿Hay un bloqueo entre a y b en cualquier dirección? Solo responde si quien pregunta es a o b,
-- para no revelar bloqueos entre terceros. security definer porque la RLS de blocks solo deja
-- ver al bloqueador.
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) in (a, b)
     and exists (
       select 1 from public.blocks bl
       where (bl.blocker_id = a and bl.blocked_id = b)
          or (bl.blocker_id = b and bl.blocked_id = a)
     );
$$;
revoke all on function public.is_blocked_pair(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;

-- messages: no se envía si hay bloqueo entre los participantes.
drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.is_chat_participant(session_id))
    and not exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and public.is_blocked_pair(s.mentor_id, s.student_id)
    )
  );

-- messages: solo el destinatario marca como leído, y solo la columna is_read.
revoke update on public.messages from anon, authenticated;
grant update (is_read) on public.messages to authenticated;
drop policy if exists "messages_update_participant" on public.messages;
create policy "messages_update_recipient" on public.messages for update to authenticated
  using ((select public.is_chat_participant(session_id)) and sender_id <> (select auth.uid()))
  with check ((select public.is_chat_participant(session_id)) and sender_id <> (select auth.uid()));

-- chat_sessions: no se abre una sesión con alguien con quien hay bloqueo.
drop policy if exists "chat_sessions_insert_student" on public.chat_sessions;
create policy "chat_sessions_insert_student" on public.chat_sessions for insert to authenticated
  with check (student_id = (select auth.uid()) and not public.is_blocked_pair(mentor_id, student_id));

-- chat_sessions: el cliente solo actualiza el último mensaje, nunca los participantes.
revoke update on public.chat_sessions from anon, authenticated;
grant update (last_message, last_message_at) on public.chat_sessions to authenticated;

-- Notificaciones de amistad y de mensajes de chat, generadas en la base de datos
-- (mismo patrón que 20261023000007_post_activity_notifications.sql).
-- security definer: el emisor no necesita permisos extra sobre notifications; nunca se notifica a uno mismo.
-- No crea tablas nuevas, así que no cambia RLS; las notificaciones nuevas siguen sujetas a
-- las políticas existentes de public.notifications (solo el destinatario las lee, marca y borra)
-- y a la publicación Realtime ya activa. Cada insert dispara además enqueue_push_for_notification.

-- Solicitud de amistad nueva -> notifica al destinatario.
create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' and new.requester_id <> new.addressee_id then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text)
    values (new.addressee_id, new.requester_id, 'friend_request', new.requester_id::text, '');
  end if;
  return new;
end;
$$;
revoke all on function public.notify_friend_request() from public, anon, authenticated;

drop trigger if exists friendships_notify_request on public.friendships;
create trigger friendships_notify_request
  after insert on public.friendships
  for each row execute function public.notify_friend_request();

-- Solicitud aceptada -> notifica al solicitante.
create or replace function public.notify_friend_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'pending' and new.status = 'accepted' then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text)
    values (new.requester_id, new.addressee_id, 'friend_accepted', new.addressee_id::text, '');
  end if;
  return new;
end;
$$;
revoke all on function public.notify_friend_accepted() from public, anon, authenticated;

drop trigger if exists friendships_notify_accepted on public.friendships;
create trigger friendships_notify_accepted
  after update of status on public.friendships
  for each row execute function public.notify_friend_accepted();

-- Mensaje de chat nuevo -> notifica al otro participante de la sesión.
-- content_id = id de la sesión; la app agrupa por sesión y cuenta las no leídas.
create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_id uuid;
begin
  select case when s.mentor_id = new.sender_id then s.student_id else s.mentor_id end
    into recipient_id
    from public.chat_sessions s
    where s.id = new.session_id;
  if recipient_id is not null and recipient_id <> new.sender_id then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text)
    values (recipient_id, new.sender_id, 'chat_message', new.session_id::text, left(new.text, 100));
  end if;
  return new;
end;
$$;
revoke all on function public.notify_chat_message() from public, anon, authenticated;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_chat_message();

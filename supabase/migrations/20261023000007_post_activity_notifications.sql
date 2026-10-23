-- Notificaciones de likes y comentarios en posts, generadas en la base de datos
-- (antes la app las creaba a mano después de cada like/comentario).
-- security definer: el emisor no necesita permisos extra; nunca se notifica al propio autor.

create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text)
    values (owner_id, new.user_id, 'post_like', new.post_id::text, '');
  end if;
  return new;
end;
$$;
revoke all on function public.notify_post_like() from public, anon, authenticated;

create trigger post_likes_notify
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text, related_content_id)
    values (owner_id, new.user_id, 'post_comment', new.post_id::text, left(new.text, 100), new.id::text);
  end if;
  return new;
end;
$$;
revoke all on function public.notify_post_comment() from public, anon, authenticated;

create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_post_comment();

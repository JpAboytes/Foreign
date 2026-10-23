-- Foro: likes y comentarios de respuestas (existían en Firebase y faltaban en el esquema),
-- y notificaciones del foro generadas por la base de datos.

create table public.forum_answer_likes (
  answer_id uuid not null references public.forum_answers (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);
create index forum_answer_likes_user_id_idx on public.forum_answer_likes (user_id);
alter table public.forum_answer_likes enable row level security;

create policy "forum_answer_likes_select" on public.forum_answer_likes
  for select to authenticated using (true);
create policy "forum_answer_likes_insert_own" on public.forum_answer_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "forum_answer_likes_delete_own" on public.forum_answer_likes
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.forum_answer_comments (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.forum_answers (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index forum_answer_comments_answer_id_idx on public.forum_answer_comments (answer_id, created_at desc);
create index forum_answer_comments_user_id_idx on public.forum_answer_comments (user_id);
alter table public.forum_answer_comments enable row level security;

create policy "forum_answer_comments_select" on public.forum_answer_comments
  for select to authenticated using (true);
create policy "forum_answer_comments_insert_own" on public.forum_answer_comments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "forum_answer_comments_delete_own_or_admin" on public.forum_answer_comments
  for delete to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Notificaciones (security definer; nunca al propio autor).

-- Nueva respuesta → autor de la pregunta.
create or replace function public.notify_forum_answer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.forum_questions where id = new.question_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text)
    values (owner_id, new.user_id, 'forum_question_comment', new.question_id::text, left(new.content, 100));
  end if;
  return new;
end;
$$;
revoke all on function public.notify_forum_answer() from public, anon, authenticated;

create trigger forum_answers_notify
  after insert on public.forum_answers
  for each row execute function public.notify_forum_answer();

-- Like a una respuesta → autor de la respuesta.
create or replace function public.notify_forum_answer_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  answer record;
begin
  select user_id, question_id, content into answer from public.forum_answers where id = new.answer_id;
  if answer.user_id is not null and answer.user_id <> new.user_id then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text, related_content_id)
    values (answer.user_id, new.user_id, 'forum_answer_like', new.answer_id::text,
            left(answer.content, 100), answer.question_id::text);
  end if;
  return new;
end;
$$;
revoke all on function public.notify_forum_answer_like() from public, anon, authenticated;

create trigger forum_answer_likes_notify
  after insert on public.forum_answer_likes
  for each row execute function public.notify_forum_answer_like();

-- Comentario en una respuesta → autor de la respuesta.
create or replace function public.notify_forum_answer_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  answer record;
begin
  select user_id, question_id into answer from public.forum_answers where id = new.answer_id;
  if answer.user_id is not null and answer.user_id <> new.user_id then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text, related_content_id)
    values (answer.user_id, new.user_id, 'forum_answer_comment', new.answer_id::text,
            left(new.content, 100), answer.question_id::text);
  end if;
  return new;
end;
$$;
revoke all on function public.notify_forum_answer_comment() from public, anon, authenticated;

create trigger forum_answer_comments_notify
  after insert on public.forum_answer_comments
  for each row execute function public.notify_forum_answer_comment();

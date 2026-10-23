-- Fase 3: Realtime + cola de push.
-- Nota: `push_tokens` (con RLS y políticas "own") y la publicación de `messages`/`notifications`
-- ya existen desde 20261020000003_social_chat_moderation.sql; aquí solo se añade lo que falta
-- y se deja idempotente el alta en la publicación.

-- Realtime (idempotente).
do $$
declare t text;
begin
  foreach t in array array['messages', 'notifications'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Cola de push: la consume una Edge Function con service role. Sin políticas para clientes.
create table if not exists public.push_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists push_queue_user_id_idx on public.push_queue (user_id);
create index if not exists push_queue_pending_idx on public.push_queue (created_at) where status = 'pending';
alter table public.push_queue enable row level security;
revoke all on public.push_queue from anon, authenticated;

-- Trigger: cada notificación nueva encola un push para su destinatario.
-- security definer porque el emisor (authenticated) no tiene acceso a push_queue.
create or replace function public.enqueue_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.push_queue (user_id, title, body, data)
  values (
    new.user_id,
    'Nueva notificación',
    coalesce(new.content_text, ''),
    jsonb_build_object(
      'notification_id', new.id,
      'type', new.type,
      'from_user_id', new.from_user_id,
      'content_id', new.content_id,
      'related_content_id', new.related_content_id
    )
  );
  return new;
end;
$$;
revoke all on function public.enqueue_push_for_notification() from public, anon, authenticated;

drop trigger if exists notifications_enqueue_push on public.notifications;
create trigger notifications_enqueue_push
  after insert on public.notifications
  for each row execute function public.enqueue_push_for_notification();

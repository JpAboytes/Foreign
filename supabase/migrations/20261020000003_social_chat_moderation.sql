-- Social: mentores, chat, notificaciones, amistades, raites y moderación (reports/blocks/push_tokens).

-- Mentores: solo el admin (service role / panel admin) los da de alta.
create table public.mentors (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bio text not null default '',
  topics text[] not null default '{}',
  is_available boolean not null default true,
  rating numeric(2,1) check (rating between 0 and 5),
  created_at timestamptz not null default now()
);
alter table public.mentors enable row level security;

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (mentor_id, student_id),
  check (mentor_id <> student_id)
);
create index chat_sessions_student_id_idx on public.chat_sessions (student_id);
alter table public.chat_sessions enable row level security;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_session_id_created_at_idx on public.messages (session_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);
alter table public.messages enable row level security;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  content_id text,
  content_text text,
  related_content_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index notifications_from_user_id_idx on public.notifications (from_user_id);
alter table public.notifications enable row level security;

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index friendships_addressee_id_idx on public.friendships (addressee_id);
alter table public.friendships enable row level security;

create table public.raites (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete cascade,
  origin text not null,
  destination text not null,
  departs_at timestamptz not null,
  seats smallint not null default 1 check (seats between 1 and 8),
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index raites_driver_id_idx on public.raites (driver_id);
create index raites_departs_at_idx on public.raites (departs_at);
alter table public.raites enable row level security;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'forum_question', 'forum_answer', 'message', 'user', 'map_location', 'raite')),
  target_id text not null,
  reason text not null check (char_length(reason) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);
create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_status_idx on public.reports (status);
alter table public.reports enable row level security;

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_id_idx on public.blocks (blocked_id);
alter table public.blocks enable row level security;

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_id_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;

-- Helper para políticas de chat (evita recursión de RLS).
create or replace function public.is_chat_participant(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.chat_sessions s
    where s.id = p_session_id
      and (select auth.uid()) in (s.mentor_id, s.student_id)
  );
$$;
revoke all on function public.is_chat_participant(uuid) from public, anon;
grant execute on function public.is_chat_participant(uuid) to authenticated;

-- mentors
create policy "mentors_select" on public.mentors for select to authenticated using (true);
create policy "mentors_update_own" on public.mentors for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "mentors_admin_insert" on public.mentors for insert to authenticated with check ((select public.is_admin()));
create policy "mentors_admin_delete" on public.mentors for delete to authenticated using ((select public.is_admin()));
-- El mentor solo puede cambiar su disponibilidad, bio y temas; no su calificación.
revoke update on public.mentors from authenticated;
grant update (bio, topics, is_available) on public.mentors to authenticated;

-- chat_sessions
create policy "chat_sessions_select_participant" on public.chat_sessions for select to authenticated
  using ((select auth.uid()) in (mentor_id, student_id));
create policy "chat_sessions_insert_student" on public.chat_sessions for insert to authenticated
  with check (student_id = (select auth.uid()));
create policy "chat_sessions_update_participant" on public.chat_sessions for update to authenticated
  using ((select auth.uid()) in (mentor_id, student_id))
  with check ((select auth.uid()) in (mentor_id, student_id));

-- messages
create policy "messages_select_participant" on public.messages for select to authenticated
  using ((select public.is_chat_participant(session_id)));
create policy "messages_insert_participant" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and (select public.is_chat_participant(session_id)));
create policy "messages_update_participant" on public.messages for update to authenticated
  using ((select public.is_chat_participant(session_id)))
  with check ((select public.is_chat_participant(session_id)));

-- notifications: las crea el emisor para el destinatario; el destinatario las lee, marca y borra.
create policy "notifications_select_recipient" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications_insert_sender" on public.notifications for insert to authenticated
  with check (from_user_id = (select auth.uid()));
create policy "notifications_update_recipient" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications_delete_recipient" on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

-- friendships
create policy "friendships_select_involved" on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
create policy "friendships_insert_requester" on public.friendships for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy "friendships_accept_addressee" on public.friendships for update to authenticated
  using (addressee_id = (select auth.uid()))
  with check (addressee_id = (select auth.uid()) and status = 'accepted');
create policy "friendships_delete_involved" on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- raites
create policy "raites_select" on public.raites for select to authenticated using (true);
create policy "raites_insert_own" on public.raites for insert to authenticated with check (driver_id = (select auth.uid()));
create policy "raites_update_own" on public.raites for update to authenticated
  using (driver_id = (select auth.uid())) with check (driver_id = (select auth.uid()));
create policy "raites_delete_own_or_admin" on public.raites for delete to authenticated
  using (driver_id = (select auth.uid()) or (select public.is_admin()));

-- reports: cualquiera reporta; solo el admin revisa.
create policy "reports_insert_own" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');
create policy "reports_select_own_or_admin" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "reports_update_admin" on public.reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- blocks
create policy "blocks_select_own" on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "blocks_insert_own" on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "blocks_delete_own" on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

-- push_tokens
create policy "push_tokens_select_own" on public.push_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy "push_tokens_insert_own" on public.push_tokens for insert to authenticated with check (user_id = (select auth.uid()));
create policy "push_tokens_update_own" on public.push_tokens for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "push_tokens_delete_own" on public.push_tokens for delete to authenticated using (user_id = (select auth.uid()));

-- Realtime para chat y notificaciones.
alter publication supabase_realtime add table public.messages, public.notifications;

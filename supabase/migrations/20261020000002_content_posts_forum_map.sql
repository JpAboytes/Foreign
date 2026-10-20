-- Contenido: feed, foro y mapa de recomendaciones. RLS activo desde la creación.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text,
  caption text not null default '' check (char_length(caption) <= 2000),
  created_at timestamptz not null default now()
);
create index posts_user_id_idx on public.posts (user_id);
create index posts_created_at_idx on public.posts (created_at desc);
alter table public.posts enable row level security;

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_id_idx on public.post_likes (user_id);
alter table public.post_likes enable row level security;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_post_id_idx on public.comments (post_id);
create index comments_user_id_idx on public.comments (user_id);
alter table public.comments enable row level security;

create table public.forum_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  created_at timestamptz not null default now()
);
create index forum_questions_user_id_idx on public.forum_questions (user_id);
alter table public.forum_questions enable row level security;

create table public.forum_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.forum_questions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index forum_answers_question_id_idx on public.forum_answers (question_id);
create index forum_answers_user_id_idx on public.forum_answers (user_id);
alter table public.forum_answers enable row level security;

create table public.map_locations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  types text[] not null default '{}',
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index map_locations_created_by_idx on public.map_locations (created_by);
alter table public.map_locations enable row level security;

create table public.map_location_ratings (
  location_id uuid not null references public.map_locations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  primary key (location_id, user_id)
);
create index map_location_ratings_user_id_idx on public.map_location_ratings (user_id);
alter table public.map_location_ratings enable row level security;

-- Políticas: lectura para autenticados; escritura solo del autor; admin puede borrar (moderación).
-- posts
create policy "posts_select" on public.posts for select to authenticated using (true);
create policy "posts_insert_own" on public.posts for insert to authenticated with check (user_id = (select auth.uid()));
create policy "posts_update_own" on public.posts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "posts_delete_own_or_admin" on public.posts for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- post_likes
create policy "post_likes_select" on public.post_likes for select to authenticated using (true);
create policy "post_likes_insert_own" on public.post_likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "post_likes_delete_own" on public.post_likes for delete to authenticated using (user_id = (select auth.uid()));
-- comments
create policy "comments_select" on public.comments for select to authenticated using (true);
create policy "comments_insert_own" on public.comments for insert to authenticated with check (user_id = (select auth.uid()));
create policy "comments_delete_own_or_admin" on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- forum_questions
create policy "forum_questions_select" on public.forum_questions for select to authenticated using (true);
create policy "forum_questions_insert_own" on public.forum_questions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "forum_questions_delete_own_or_admin" on public.forum_questions for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- forum_answers
create policy "forum_answers_select" on public.forum_answers for select to authenticated using (true);
create policy "forum_answers_insert_own" on public.forum_answers for insert to authenticated with check (user_id = (select auth.uid()));
create policy "forum_answers_delete_own_or_admin" on public.forum_answers for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- map_locations
create policy "map_locations_select" on public.map_locations for select to authenticated using (true);
create policy "map_locations_insert_own" on public.map_locations for insert to authenticated with check (created_by = (select auth.uid()));
create policy "map_locations_update_own" on public.map_locations for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "map_locations_delete_own_or_admin" on public.map_locations for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));
-- map_location_ratings
create policy "map_location_ratings_select" on public.map_location_ratings for select to authenticated using (true);
create policy "map_location_ratings_insert_own" on public.map_location_ratings for insert to authenticated with check (user_id = (select auth.uid()));
create policy "map_location_ratings_update_own" on public.map_location_ratings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "map_location_ratings_delete_own" on public.map_location_ratings for delete to authenticated using (user_id = (select auth.uid()));

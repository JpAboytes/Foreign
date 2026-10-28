-- Solicitudes de raite (antes raiteRequests/<uid> en Firebase Realtime Database).
-- Cada usuario tiene a lo más una solicitud activa (PK = requester_id). Solo la ven el
-- solicitante, los amigos a quienes se la mandó y quien la aceptó. Se aceptan con
-- accept_raite() para que el amigo no pueda modificar otros campos de la solicitud.

create table public.raite_requests (
  requester_id uuid primary key references public.profiles (id) on delete cascade,
  from_lat double precision,
  from_lng double precision,
  to_lat double precision not null,
  to_lng double precision not null,
  recipients uuid[] not null check (cardinality(recipients) between 1 and 50),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  accepted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index raite_requests_recipients_idx on public.raite_requests using gin (recipients);
alter table public.raite_requests enable row level security;

create policy "raite_requests_select_involved" on public.raite_requests
  for select to authenticated
  using (
    requester_id = (select auth.uid())
    or (select auth.uid()) = any (recipients)
    or accepted_by = (select auth.uid())
  );

-- Solo se puede pedir raite a amigos aceptados (evita notificar a desconocidos).
create policy "raite_requests_insert_own_to_friends" on public.raite_requests
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and accepted_by is null
    and not exists (
      select 1 from unnest(recipients) as r(id)
      where not exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and ((f.requester_id = (select auth.uid()) and f.addressee_id = r.id)
            or (f.addressee_id = (select auth.uid()) and f.requester_id = r.id))
      )
    )
  );

create policy "raite_requests_delete_own" on public.raite_requests
  for delete to authenticated using (requester_id = (select auth.uid()));

-- Aceptar la solicitud de un amigo (solo si me la mandó a mí y sigue pendiente).
create or replace function public.accept_raite(p_requester_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.raite_requests
     set status = 'accepted', accepted_by = (select auth.uid())
   where requester_id = p_requester_id
     and status = 'pending'
     and (select auth.uid()) = any (recipients);
  if not found then
    raise exception 'La solicitud ya no está disponible' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.accept_raite(uuid) from public, anon;
grant execute on function public.accept_raite(uuid) to authenticated;

-- Notificaciones: nueva solicitud -> cada destinatario; aceptada -> solicitante.
create or replace function public.notify_raite_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_name text;
begin
  if tg_op = 'INSERT' then
    select name into requester_name from public.profiles where id = new.requester_id;
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text)
    select r.id, new.requester_id, 'raite_request', new.requester_id::text,
           coalesce(nullif(requester_name, ''), 'Un amigo') || ' necesita un raite. ¡Toca aquí para responder!'
      from unnest(new.recipients) as r(id)
     where r.id <> new.requester_id;
  elsif old.status = 'pending' and new.status = 'accepted' and new.accepted_by is not null then
    insert into public.notifications (user_id, from_user_id, type, content_id, content_text)
    values (new.requester_id, new.accepted_by, 'raite_accepted', new.requester_id::text, 'Aceptó tu solicitud de raite');
  end if;
  return new;
end;
$$;
revoke all on function public.notify_raite_request() from public, anon, authenticated;

create trigger raite_requests_notify
  after insert or update of status on public.raite_requests
  for each row execute function public.notify_raite_request();

-- Realtime para que los amigos vean las solicitudes al instante (respeta RLS).
alter publication supabase_realtime add table public.raite_requests;

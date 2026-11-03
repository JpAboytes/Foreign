-- Aceptación de Términos y Condiciones (EULA): requisito de Apple 1.2 y de la política de UGC de Google Play.
-- Se guarda cuándo y qué versión aceptó cada persona.
--
-- RLS: no se crean políticas nuevas. profiles_update_own (id = auth.uid()) ya limita cada edición
-- al propio perfil y profiles_update_admin al admin; el rol admin vive en user_roles (no en profiles),
-- así que estas columnas no dan ningún privilegio. La aceptación es declarativa: una persona solo
-- puede escribir la suya.
alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text check (terms_version is null or char_length(terms_version) <= 20);

-- El registro con correo (y Google/Apple) crea el perfil en este trigger. Si el cliente manda
-- terms_version en los metadatos del signUp, la fecha de aceptación la pone el servidor (now()).
-- Los altas sociales (Google/Apple) no mandan metadatos: quedan en null y la app pide aceptar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_terms text := nullif(left(meta ->> 'terms_version', 20), '');
begin
  insert into public.profiles (id, name, photo_url, university, origin, interests, terms_accepted_at, terms_version)
  values (
    new.id,
    left(coalesce(meta ->> 'name', meta ->> 'full_name', ''), 100),
    meta ->> 'avatar_url',
    nullif(left(meta ->> 'university', 100), ''),
    nullif(left(meta ->> 'origin', 100), ''),
    case
      when jsonb_typeof(meta -> 'interests') = 'array'
        then array(select left(value, 50) from jsonb_array_elements_text(meta -> 'interests') limit 20)
      else '{}'::text[]
    end,
    case when v_terms is not null then now() end,
    v_terms
  );
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

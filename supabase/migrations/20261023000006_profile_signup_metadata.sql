-- El registro con email puede quedar pendiente de confirmación (sin sesión), así que la app
-- no puede escribir el perfil justo después de signUp. El trigger lo crea completo a partir
-- de los metadatos del registro. Son los mismos campos que el usuario puede editar después
-- (profiles_update_own), así que tomarlos de raw_user_meta_data no da privilegios extra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, name, photo_url, university, origin, interests)
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
    end
  );
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

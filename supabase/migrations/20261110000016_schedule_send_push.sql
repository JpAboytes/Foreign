-- Programa el envío de push: cada minuto, si hay pendientes en push_queue, pg_cron llama a la
-- Edge Function send-push con pg_net.
-- La función se autentica con un secreto compartido que se genera aquí dentro de la base y vive
-- solo en Vault: nunca pasa por git, por el cliente ni por las variables de la función. La función
-- lo valida con check_push_cron_secret(), que solo puede ejecutar service_role.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Secreto y URL de la función en Vault (idempotente; un entorno nuevo genera su propio secreto).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'push_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'push_cron_secret',
      'Secreto compartido entre pg_cron y la Edge Function send-push');
  end if;
  if not exists (select 1 from vault.secrets where name = 'send_push_url') then
    perform vault.create_secret('https://zoidnphuqxuvocoelrfj.supabase.co/functions/v1/send-push',
      'send_push_url', 'URL de la Edge Function send-push de este proyecto');
  end if;
end $$;

-- La Edge Function (con la service role) pregunta si el secreto recibido es el correcto.
create or replace function public.check_push_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'push_cron_secret' and decrypted_secret = p_secret
  );
$$;
revoke all on function public.check_push_cron_secret(text) from public, anon, authenticated;
grant execute on function public.check_push_cron_secret(text) to service_role;

-- Llama a send-push solo si hay trabajo pendiente (no gasta invocaciones con la cola vacía).
create or replace function public.dispatch_push_queue()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.push_queue where status = 'pending') then
    return;
  end if;
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'send_push_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')
    ),
    body := '{}'::jsonb
  );
end;
$$;
revoke all on function public.dispatch_push_queue() from public, anon, authenticated;

select cron.unschedule('dispatch-push-queue') where exists (select 1 from cron.job where jobname = 'dispatch-push-queue');
select cron.schedule('dispatch-push-queue', '* * * * *', 'select public.dispatch_push_queue()');

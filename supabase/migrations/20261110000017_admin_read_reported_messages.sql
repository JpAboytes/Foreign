-- La cola de moderación necesita resumir los mensajes reportados. Un admin solo puede leer
-- un mensaje si existe un reporte abierto contra él; el resto del chat sigue privado.
create policy "messages_select_admin_reported" on public.messages for select to authenticated
  using (
    (select public.is_admin())
    and exists (
      select 1 from public.reports r
      where r.target_type = 'message'
        and r.target_id = messages.id::text
        and r.status = 'open'
    )
  );

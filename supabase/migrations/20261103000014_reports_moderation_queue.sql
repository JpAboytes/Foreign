-- Cola de moderación (Apple 1.2 / Google UGC). Las políticas reports_select_own_or_admin y
-- reports_update_admin ya existen (0003); aquí se añade la trazabilidad de la revisión (SLA de 24 h),
-- un índice para la cola y se limita qué columnas puede modificar el admin.
alter table public.reports
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Cola: reportes abiertos, los más antiguos primero.
create index if not exists reports_open_created_at_idx on public.reports (created_at) where status = 'open';

-- El admin solo cambia el estado y la marca de revisión; no puede reescribir motivo, reportero ni objetivo.
revoke update on public.reports from anon, authenticated;
grant update (status, reviewed_by, reviewed_at) on public.reports to authenticated;

-- Refuerza la política de actualización: el revisor registrado debe ser quien actualiza.
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and (reviewed_by is null or reviewed_by = (select auth.uid())));

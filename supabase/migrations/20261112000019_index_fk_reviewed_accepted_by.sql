-- Índices para las llaves foráneas sin índice que reporta el advisor de rendimiento
-- (unindexed_foreign_keys). Aceleran el ON DELETE SET NULL al borrar un perfil
-- y las consultas por quién aceptó un raite o revisó un reporte.
create index if not exists raite_requests_accepted_by_idx
  on public.raite_requests (accepted_by);

create index if not exists reports_reviewed_by_idx
  on public.reports (reviewed_by);

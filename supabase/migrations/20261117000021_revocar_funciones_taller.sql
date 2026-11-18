-- Advisors de seguridad (2026-11-17): las funciones SECURITY DEFINER
-- public.taller_reset(text) y public.taller_set_poll(smallint, text) son restos
-- de un taller/prototipo. La app (MyApp/) y las migraciones no las usan, pero
-- anon y authenticated podian ejecutarlas por /rest/v1/rpc.
-- Se revoca EXECUTE; no se borran funciones ni datos (taller_clave se conserva).
-- Si algun dia se necesitan de nuevo, se pueden volver a conceder a un rol concreto.

revoke execute on function public.taller_reset(text) from public, anon, authenticated;
revoke execute on function public.taller_set_poll(smallint, text) from public, anon, authenticated;

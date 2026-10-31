-- El borrado de la propia cuenta pasa por la Edge Function `delete-account`, que también
-- limpia Storage. La RPC dejaba archivos huérfanos, así que ya no la puede llamar el cliente.
revoke execute on function public.delete_my_account() from authenticated;

-- El borrado de usuarios desde el panel admin pasa por la Edge Function `admin-delete-user`,
-- que también limpia Storage (avatars y post-images). La RPC dejaba archivos huérfanos, así que
-- ya no la puede llamar el cliente. La función sigue existiendo en la base.
revoke execute on function public.admin_delete_user(uuid) from authenticated;

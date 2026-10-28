import { supabase } from './supabase/client';

// Preferencia de notificaciones del usuario autenticado (profiles.notifications_enabled).
export const getNotificationsEnabled = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('notifications_enabled')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.notifications_enabled ?? true;
};

export const setNotificationsEnabled = async (userId: string, value: boolean): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ notifications_enabled: value }).eq('id', userId);
  if (error) throw error;
};

// Correo y método de acceso de la sesión actual. Solo quien entró con correo y contraseña
// puede reconfirmar con contraseña; con Google o Apple no hay contraseña que pedir.
export const getAccountAccessInfo = async (): Promise<{ email: string | null; hasPassword: boolean }> => {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  return {
    email: user?.email ?? null,
    hasPassword: !!user?.identities?.some((i) => i.provider === 'email'),
  };
};

// Elimina la cuenta del usuario autenticado. Si entra con contraseña se reconfirma antes.
// La Edge Function delete-account (JWT del usuario, sin user_id en el cuerpo) borra sus archivos
// de Storage (avatars y post-images) y después auth.users, que en cascada borra perfil y contenido.
export const deleteMyAccount = async (password?: string): Promise<void> => {
  const { email, hasPassword } = await getAccountAccessInfo();
  if (hasPassword) {
    if (!email || !password) throw new Error('Ingresa tu contraseña para confirmar.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Contraseña incorrecta.');
  }

  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new Error('No se pudo eliminar la cuenta. Intenta de nuevo.');

  // La sesión local ya no es válida; se limpia sin llamar al servidor.
  await supabase.auth.signOut({ scope: 'local' });
};

// Borra a un usuario desde el panel admin: objetos de Storage (avatars y post-images,
// carpeta <uid>/) y después auth.users (el resto de los datos cae en cascada).
// verify_jwt activo (valor por defecto al desplegar; no usar --no-verify-jwt).
// La identidad del llamador sale SIEMPRE del JWT; del cuerpo solo se toma `user_id` (el objetivo).
// Reglas iguales a las de la antigua RPC admin_delete_user: solo admins, no a sí mismo, no a otros admins.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const BUCKETS = ['avatars', 'post-images'];
const PAGE = 100;
const REMOVE_BATCH = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// Lista todos los archivos bajo `prefix`, entrando a subcarpetas (las carpetas no traen `id`).
async function listAll(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  const folders: string[] = [prefix];
  while (folders.length) {
    const folder = folders.pop()!;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: PAGE, offset });
      if (error) throw new Error(`list ${bucket}/${folder}: ${error.message}`);
      for (const item of data ?? []) {
        const path = `${folder}/${item.name}`;
        if (item.id) paths.push(path);
        else folders.push(path);
      }
      if (!data || data.length < PAGE) break;
    }
  }
  return paths;
}

async function purgeStorage(admin: SupabaseClient, uid: string): Promise<void> {
  for (const bucket of BUCKETS) {
    const paths = await listAll(admin, bucket, uid);
    for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + REMOVE_BATCH));
      if (error) throw new Error(`remove ${bucket}: ${error.message}`);
    }
  }
}

async function isAdmin(admin: SupabaseClient, uid: string): Promise<boolean> {
  const { data, error } = await admin
    .from('user_roles')
    .select('user_id')
    .eq('user_id', uid)
    .eq('role', 'admin')
    .limit(1);
  if (error) throw new Error(`user_roles: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'No autenticado' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Identidad del llamador exclusivamente desde el JWT (validado contra Auth).
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const callerId = userData?.user?.id;
  if (userError || !callerId) return json({ error: 'Sesión inválida' }, 401);

  let targetId: unknown;
  try {
    targetId = (await req.json())?.user_id;
  } catch {
    return json({ error: 'Solicitud inválida' }, 400);
  }

  try {
    if (!(await isAdmin(admin, callerId))) return json({ error: 'No autorizado' }, 403);

    if (typeof targetId !== 'string' || !UUID_RE.test(targetId)) {
      return json({ error: 'Identificador de usuario inválido' }, 400);
    }
    if (targetId.toLowerCase() === callerId.toLowerCase()) {
      return json({ error: 'No puedes eliminar tu propia cuenta desde el panel' }, 422);
    }
    if (await isAdmin(admin, targetId)) {
      return json({ error: 'No se puede eliminar a un administrador' }, 422);
    }

    // Primero Storage: si falla, la cuenta sigue intacta y se puede reintentar.
    await purgeStorage(admin, targetId);
    const { error } = await admin.auth.admin.deleteUser(targetId);
    if (error) throw new Error(`deleteUser: ${error.message}`);
  } catch (e) {
    console.error('admin-delete-user falló', callerId, targetId, e instanceof Error ? e.message : e);
    return json({ error: 'No se pudo eliminar al usuario. Intenta de nuevo.' }, 500);
  }

  return json({ ok: true });
});

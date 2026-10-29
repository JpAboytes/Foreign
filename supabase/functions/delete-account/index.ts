// Borra la cuenta del usuario que la invoca: objetos de Storage (avatars y post-images,
// carpeta <uid>/) y después auth.users (el resto de los datos cae en cascada).
// verify_jwt activo (valor por defecto al desplegar; no usar --no-verify-jwt).
// El user_id sale SIEMPRE del JWT; el cuerpo de la petición se ignora.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const BUCKETS = ['avatars', 'post-images'];
const PAGE = 100;
const REMOVE_BATCH = 100;

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'No autenticado' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Identidad exclusivamente desde el JWT (validado contra Auth).
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const uid = userData?.user?.id;
  if (userError || !uid) return json({ error: 'Sesión inválida' }, 401);

  try {
    // Primero Storage: si falla, la cuenta sigue intacta y el usuario puede reintentar.
    await purgeStorage(admin, uid);
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) throw new Error(`deleteUser: ${error.message}`);
  } catch (e) {
    console.error('delete-account falló', uid, e instanceof Error ? e.message : e);
    return json({ error: 'No se pudo eliminar la cuenta. Intenta de nuevo.' }, 500);
  }

  return json({ ok: true });
});

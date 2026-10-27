// Consume public.push_queue y envía los push vía Expo Push API.
// Se invoca con la service role (pg_cron / Database Webhook); verify_jwt activo.
import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH = 100;
const MAX_ATTEMPTS = 3;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: jobs, error } = await supabase
    .from('push_queue')
    .select('id, user_id, title, body, data, attempts')
    .eq('status', 'pending')
    .order('created_at')
    .limit(BATCH);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let sent = 0;
  let failed = 0;
  for (const job of jobs ?? []) {
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', job.user_id);

    const messages = (tokens ?? []).map((t) => ({
      to: t.token,
      title: job.title,
      body: job.body,
      data: job.data,
      sound: 'default',
    }));

    let ok = messages.length === 0; // sin dispositivos: nada que enviar
    if (messages.length > 0) {
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        });
        const body = await res.json();
        ok = res.ok;
        // Tokens que Expo reporta como inválidos se eliminan.
        const receipts: { status: string; details?: { error?: string } }[] = body.data ?? [];
        const dead = receipts
          .map((r, i) => (r.details?.error === 'DeviceNotRegistered' ? messages[i].to : null))
          .filter((t): t is string => !!t);
        if (dead.length) await supabase.from('push_tokens').delete().in('token', dead);
      } catch {
        ok = false;
      }
    }

    const attempts = job.attempts + 1;
    if (ok) {
      await supabase
        .from('push_queue')
        .update({ status: 'sent', attempts, sent_at: new Date().toISOString() })
        .eq('id', job.id);
      sent++;
    } else {
      await supabase
        .from('push_queue')
        .update({ status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending', attempts })
        .eq('id', job.id);
      failed++;
    }
  }
  return Response.json({ processed: jobs?.length ?? 0, sent, failed });
});

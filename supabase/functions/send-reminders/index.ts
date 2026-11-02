// Boēthos reminder sender (Supabase Edge Function, Deno).
//
// Two ways in:
//  • the scheduler (pg_cron, every 5 minutes) with `Authorization: Bearer <CRON_SECRET>`:
//    sends every due, unsent reminder and marks it sent (each key once, so retries never duplicate);
//  • you, from the app, with your own sign-in token and `{ "test": true }`: one test push to your devices.
//
// The text is always generic. Lock screens are not private, so no names, notes or care details are ever sent.
//
// Secrets (Project settings → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com), CRON_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const env = (k: string) => Deno.env.get(k) ?? '';
webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };

const BODY: Record<string, string> = {
  attendance: 'attendance', followups: 'follow-ups', sermon: 'Thursday preparation', campaigns: 'campaign actions',
};
// Spoudazō: your own rhythm (quiet time, prayer times, study, fast days)
const LIFE: Record<string, string> = {
  quiet: 'Time for your quiet time.', prayer: 'Time to pray.', study: 'Time for your Bible study.', fasting: 'Today is a fast day.',
  fasteve: 'Tomorrow is a fast day.', points: 'Your prayer points are waiting for you.', prayerlog: 'Log today’s prayer before you sleep.', reading: 'Time to read your book.',
};
// Telepastoring, several times a day: a reminder with a verse (KJV), changing day by day
const TELE = [
  'Feed my sheep. (John 21:17)', 'Be thou diligent to know the state of thy flocks, and look well to thy herds. (Proverbs 27:23)',
  'Feed the flock of God which is among you, taking the oversight thereof. (1 Peter 5:2)', 'Go out into the highways and hedges, and compel them to come in, that my house may be filled. (Luke 14:23)',
  'I will feed my flock, and I will cause them to lie down, saith the Lord GOD. (Ezekiel 34:15)', 'The good shepherd giveth his life for the sheep. (John 10:11)',
  'Exhort one another daily, while it is called To day. (Hebrews 3:13)',
];
// A category ending "~30" is a heads-up 30 minutes before the reminder itself.
const SOON: Record<string, string> = {
  quiet: 'your quiet time.', prayer: 'a prayer time.', study: 'your Bible study.', points: 'your prayer points.',
  prayerlog: 'log today’s prayer.', reading: 'your reading.',
};
function text(cats: string[], n: number) {
  const soon = cats.filter((c) => c.includes('~'));
  if (soon.length) {
    const rest = cats.filter((c) => !c.includes('~'));
    const lead = soon[0].split('~')[1];
    const base = [...new Set(soon.map((c) => c.split('~')[0]))];
    let line: string;
    if (base.includes('tele')) {
      const v = TELE[Math.floor(Date.now() / 86400000) % TELE.length];
      line = `Telepastoring in ${lead} minutes. “${v.replace(/ \(.*\)$/, '')}” ${v.match(/\((.*)\)$/)?.[1] ?? ''}`;
    } else {
      const mine = base.filter((c) => SOON[c]).map((c) => SOON[c]);
      const flock = base.filter((c) => !SOON[c]);
      line = `In ${lead} minutes: ${[...mine, ...(flock.length ? [`${flock.length === 1 ? 'something' : `${flock.length} things`} for Greater Love.`] : [])].join(' ')}`;
    }
    return rest.length ? `${line} ${text(rest, rest.length)}` : line;
  }
  if (cats.includes('tele')) {
    const rest = cats.filter((c) => c !== 'tele');
    const v = TELE[Math.floor(Date.now() / 86400000) % TELE.length];
    return `Time to telepastor. “${v.replace(/ \(.*\)$/, '')}” ${v.match(/\((.*)\)$/)?.[1] ?? ''}${rest.length ? ' ' + text(rest, rest.length) : ''}`;
  }
  const mine = [...new Set(cats.filter((c) => LIFE[c]))].map((c) => LIFE[c]);
  const flock = cats.filter((c) => !LIFE[c]);
  const parts = [...mine];
  if (flock.includes('digest')) parts.push('Greater Love: your morning summary is ready.');
  else if (flock.length) {
    const what = [...new Set(flock)].map((c) => BODY[c] ?? 'things').join(', ');
    parts.push(`Greater Love: ${flock.length} ${flock.length === 1 ? 'thing needs' : 'things need'} you (${what}).`);
  }
  return parts.join(' ') || 'Boēthos: something needs you.';
}

async function sendTo(userId: string, payload: Record<string, string>) {
  const { data: subs } = await admin.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id', userId);
  let delivered = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
      delivered++;
    } catch (e) {
      // The browser dropped this subscription: forget it
      if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
    }
  }
  return delivered;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const body = await req.json().catch(() => ({}));

  // A test from the app: only to the caller's own devices
  if (body?.test) {
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: 'Sign in first' }), { status: 401, headers: cors });
    const n = await sendTo(user.id, { title: 'Boēthos', body: 'Boēthos: test reminder.', url: '/?go#/settings', tag: 'boethos-test' });
    return new Response(JSON.stringify({ devices: n }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  // The scheduler
  if (!env('CRON_SECRET') || token !== env('CRON_SECRET')) return new Response('Forbidden', { status: 403, headers: cors });
  const { data: due } = await admin.from('reminder_queue').select('user_id,key,category,body').is('sent_at', null)
    .lte('send_at', new Date().toISOString()).gte('send_at', new Date(Date.now() - 6 * 3600e3).toISOString()).limit(500);
  const byUser = new Map<string, { key: string; category: string; body: string | null }[]>();
  for (const r of due ?? []) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);
  let sent = 0;
  for (const [userId, rows] of byUser) {
    // Mark first, so an overlapping run can never send the same reminder twice
    const keys = rows.map((r) => r.key);
    const { data: claimed } = await admin.from('reminder_queue').update({ sent_at: new Date().toISOString() })
      .eq('user_id', userId).in('key', keys).is('sent_at', null).select('key,category,body');
    if (!claimed?.length) continue;
    // Each reminder says exactly what it is (its own words, made on your device). Without words, a short summary.
    const worded = claimed.filter((r) => r.body), plain = claimed.filter((r) => !r.body);
    for (const r of worded.slice(0, 4)) await sendTo(userId, { title: 'Boēthos', body: r.body as string, url: '/?go#/home', tag: 'boethos-' + r.key });
    if (worded.length > 4) await sendTo(userId, { title: 'Boēthos', body: `And ${worded.length - 4} more things need you.`, url: '/?go#/home', tag: 'boethos-more' });
    if (plain.length) await sendTo(userId, { title: 'Boēthos', body: text(plain.map((r) => r.category), plain.length), url: '/?go#/home', tag: 'boethos-poimaino' });
    sent += claimed.length;
  }
  return new Response(JSON.stringify({ sent }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});

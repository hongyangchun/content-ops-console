/**
 * 内容作战台 · 跨设备云同步（Cloudflare Pages Functions）
 * 与页面同域部署（/sync），直接绑定 KV（SYNC_KV）。
 * 数据已由前端用「同步口令」做 AES-GCM 客户端加密，本函数只存/取密文（零知识）。
 *
 * 接口：
 *   GET  /sync?k=<keyhash>        -> { v, data, ts }   (data 为密文 base64，无数据则 data:null)
 *   PUT  /sync  body {k,data,ts}  -> { ok, ts }        (last-write-wins，按 ts 覆盖)
 *   OPTIONS /sync                -> CORS 预检
 */
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const k = url.searchParams.get('k');
  if (!k) return json({ error: 'missing k' }, 400);
  const kv = context.env.SYNC_KV;
  if (!kv) return json({ error: 'KV not bound' }, 500);
  const raw = await kv.get(k);
  if (!raw) return json({ v: 0, data: null, ts: 0 });
  try {
    return json(JSON.parse(raw));
  } catch {
    return json({ v: 0, data: null, ts: 0 });
  }
}

export async function onRequestPut(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'bad json' }, 400); }
  if (!body || typeof body.k !== 'string' || typeof body.data === 'undefined') {
    return json({ error: 'bad body' }, 400);
  }
  const kv = context.env.SYNC_KV;
  if (!kv) return json({ error: 'KV not bound' }, 500);
  const rec = { v: Date.now(), data: body.data, ts: Date.now() };
  await kv.put(body.k, JSON.stringify(rec));
  return json({ ok: true, ts: rec.ts });
}

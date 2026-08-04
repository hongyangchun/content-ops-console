/**
 * 内容作战台 · 跨设备云同步 Worker
 * 存储：Cloudflare KV (binding: SYNC_KV)
 * 数据：前端已用「同步口令」做 AES-GCM 客户端加密，本 Worker 只存密文（零知识）。
 *
 * 接口：
 *   GET  /sync?k=<keyhash>        -> { v, data, ts }   (data 为密文 base64，无数据则 data:null)
 *   PUT  /sync  body {k,data,ts}  -> { ok, ts }        (last-write-wins，按 ts 覆盖)
 *   OPTIONS /sync                -> CORS 预检
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const url = new URL(request.url);
    if (url.pathname !== '/sync') {
      return json({ error: 'not found' }, 404);
    }

    const kv = env.SYNC_KV;
    if (!kv) {
      return json({ error: 'KV not bound' }, 500);
    }

    // ---- 拉取 ----
    if (request.method === 'GET') {
      const k = url.searchParams.get('k');
      if (!k) return json({ error: 'missing k' }, 400);
      const raw = await kv.get(k);
      if (!raw) return json({ v: 0, data: null, ts: 0 });
      try {
        return json(JSON.parse(raw));
      } catch (e) {
        return json({ v: 0, data: null, ts: 0 });
      }
    }

    // ---- 推送 ----
    if (request.method === 'PUT') {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      if (!body || typeof body.k !== 'string' || typeof body.data === 'undefined') {
        return json({ error: 'bad body' }, 400);
      }
      const rec = { v: Date.now(), data: body.data, ts: Date.now() };
      await kv.put(body.k, JSON.stringify(rec));
      return json({ ok: true, ts: rec.ts });
    }

    return json({ error: 'method not allowed' }, 405);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'content-type': 'application/json' }, corsHeaders())
  });
}

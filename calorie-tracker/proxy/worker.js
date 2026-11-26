// Optional: a tiny Cloudflare Worker that keeps your Anthropic API key off your phone.
// The app sends the same request body it would send to Anthropic; this Worker adds the key.
//
// Setup (free Cloudflare account):
//   1. Workers & Pages -> Create -> Create Worker -> paste this file -> Deploy.
//   2. Worker -> Settings -> Variables and Secrets -> add a Secret named ANTHROPIC_API_KEY.
//   3. Add a plain variable ALLOWED_ORIGIN with your app's address, e.g. https://yourname.github.io
//   4. In the app: Settings -> AI photo analysis -> Provider "My own proxy URL" -> paste the Worker URL.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2026-10-21';
const ALLOWED_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'];
const MAX_BODY_BYTES = 6 * 1024 * 1024; // about one compressed photo plus text

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const reply = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } });

    if (!allowed || origin !== allowed) return reply(403, { error: { message: 'Origin not allowed. Set ALLOWED_ORIGIN on the Worker.' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { error: { message: 'Use POST.' } });
    if (!env.ANTHROPIC_API_KEY) return reply(500, { error: { message: 'ANTHROPIC_API_KEY secret is not set on the Worker.' } });

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return reply(413, { error: { message: 'Request too large.' } });
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return reply(400, { error: { message: 'Body must be JSON.' } });
    }
    if (!ALLOWED_MODELS.includes(body.model)) return reply(400, { error: { message: 'Model not allowed.' } });
    body.max_tokens = Math.min(Number(body.max_tokens) || 4000, 4000);
    delete body.stream;

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': API_VERSION },
      body: JSON.stringify(body),
    });
    return new Response(res.body, { status: res.status, headers: { ...cors, 'content-type': 'application/json' } });
  },
};

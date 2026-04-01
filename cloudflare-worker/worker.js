/**
 * Cloudflare Worker: Mailgun contact form relay
 *
 * Keeps Mailgun API key secret (never expose it in browser JS).
 *
 * Env vars (Workers -> Settings -> Variables):
 * - MAILGUN_API_KEY
 * - MAILGUN_DOMAIN                 (e.g. sandboxXXXX.mailgun.org)
 * - CONTACT_TO                     (e.g. infocasekompasshdh@gmail.com)
 * - CONTACT_FROM                   (optional; default: "Ergotherapie Mobil <postmaster@${MAILGUN_DOMAIN}>" )
 * - ALLOWED_ORIGINS                (optional; comma-separated)
 */

function json(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  const allowList = (env.ALLOWED_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500,https://ergotherapie-mobil.de,https://www.ergotherapie-mobil.de')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (allowList.includes('*')) return origin;
  return allowList.includes(origin) ? origin : null;
}

function withCorsHeaders(response, origin) {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return withCorsHeaders(new Response(null, { status: 204 }), origin);
    }

    if (request.method !== 'POST') {
      return withCorsHeaders(json({ success: false, message: 'Method not allowed' }, { status: 405 }), origin);
    }

    const apiKey = env.MAILGUN_API_KEY;
    const domain = env.MAILGUN_DOMAIN;
    const contactTo = env.CONTACT_TO;

    if (!apiKey || !domain || !contactTo) {
      return withCorsHeaders(
        json({ success: false, message: 'Server not configured (missing MAILGUN_API_KEY/MAILGUN_DOMAIN/CONTACT_TO)' }, { status: 500 }),
        origin
      );
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return withCorsHeaders(json({ success: false, message: 'Invalid form data' }, { status: 400 }), origin);
    }

    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const anliegen = String(form.get('anliegen') || '').trim();
    const prescription = String(form.get('prescription') || '').trim();
    const message = String(form.get('message') || '').trim();
    const consent = form.get('consent');

    if (!name || !email || !message || !consent) {
      return withCorsHeaders(
        json({ success: false, message: 'Missing required fields' }, { status: 400 }),
        origin
      );
    }

    const subject = String(form.get('subject') || 'Neue Ergotherapie Anfrage').trim() || 'Neue Ergotherapie Anfrage';

    const textLines = [
      'Neue Kontaktanfrage (Website)',
      '',
      `Name: ${name}`,
      `E-Mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
      anliegen ? `Worum geht es: ${anliegen}` : null,
      prescription ? `Rezept: ${prescription}` : null,
      '',
      'Nachricht:',
      message,
    ].filter(Boolean);

    const from = env.CONTACT_FROM || `Ergotherapie Mobil <postmaster@${domain}>`;

    const auth = btoa(`api:${apiKey}`);
    const body = new URLSearchParams();
    body.set('from', from);
    body.set('to', contactTo);
    body.set('subject', subject);
    body.set('text', textLines.join('\n'));
    body.set('h:Reply-To', email);

    const mgResp = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    const mgText = await mgResp.text();
    if (!mgResp.ok) {
      return withCorsHeaders(
        json({ success: false, message: `Mailgun error: HTTP ${mgResp.status}`, details: mgText.slice(0, 500) }, { status: 502 }),
        origin
      );
    }

    return withCorsHeaders(json({ success: true }), origin);
  },
};




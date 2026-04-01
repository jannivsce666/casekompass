/**
 * Netlify Function: Mailgun contact relay
 *
 * Env vars in Netlify (Site settings -> Environment variables):
 * - MAILGUN_API_KEY
 * - MAILGUN_DOMAIN
 * - CONTACT_TO              (e.g. infocasekompasshdh@gmail.com)
 * - CONTACT_FROM            (optional; default: "Ergotherapie Mobil <postmaster@${MAILGUN_DOMAIN}>" )
 */

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}

function decodeBody(event) {
  if (!event.body) return '';
  if (event.isBase64Encoded) {
    return Buffer.from(event.body, 'base64').toString('utf8');
  }
  return event.body;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const contactTo = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || (domain ? `Ergotherapie Mobil <postmaster@${domain}>` : 'Ergotherapie Mobil <postmaster@example.com>');

  if (!apiKey || !domain || !contactTo) {
    return json(500, { success: false, message: 'Server not configured (missing MAILGUN_API_KEY/MAILGUN_DOMAIN/CONTACT_TO)' });
  }

  const raw = decodeBody(event);
  const params = new URLSearchParams(raw);

  const name = (params.get('name') || '').trim();
  const email = (params.get('email') || '').trim();
  const phone = (params.get('phone') || '').trim();
  const anliegen = (params.get('anliegen') || '').trim();
  const prescription = (params.get('prescription') || '').trim();
  const message = (params.get('message') || '').trim();
  const consent = params.get('consent');

  if (!name || !email || !message || !consent) {
    return json(400, { success: false, message: 'Missing required fields' });
  }

  const subject = (params.get('subject') || 'Neue Ergotherapie Anfrage').trim() || 'Neue Ergotherapie Anfrage';

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

  const body = new URLSearchParams();
  body.set('from', from);
  body.set('to', contactTo);
  body.set('subject', subject);
  body.set('text', textLines.join('\n'));
  body.set('h:Reply-To', email);

  const auth = Buffer.from(`api:${apiKey}`).toString('base64');

  const resp = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  const respText = await resp.text();
  if (!resp.ok) {
    return json(502, { success: false, message: `Mailgun error: HTTP ${resp.status}`, details: respText.slice(0, 500) });
  }

  return json(200, { success: true });
};




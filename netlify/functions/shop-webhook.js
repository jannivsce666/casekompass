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

function getBaseUrl(event) {
  const forwardedProto = event.headers['x-forwarded-proto'] || 'https';
  const forwardedHost = event.headers['x-forwarded-host'] || event.headers.host;
  const envUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL;

  if (envUrl) return envUrl.replace(/\/$/, '');
  return `${forwardedProto}://${forwardedHost}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

const PRODUCTS = {
  'pflegegrad-ratgeber-pdf': {
    id: 'pflegegrad-ratgeber-pdf',
    name: 'PDF-Ratgeber: Pflegegrad beantragen - einfach vorbereitet',
    downloadPath: '/downloads/pflegegrad-beantragen-einfach-vorbereitet.pdf',
  },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const contactTo = process.env.CONTACT_TO;
  const contactFrom = process.env.CONTACT_FROM || (mailgunDomain ? `casekompass.de <postmaster@${mailgunDomain}>` : 'casekompass.de <postmaster@example.com>');

  if (!mollieApiKey) {
    return json(500, { success: false, message: 'Server not configured (missing MOLLIE_API_KEY)' });
  }

  if (!mailgunApiKey || !mailgunDomain) {
    return json(500, { success: false, message: 'Server not configured (missing MAILGUN_API_KEY/MAILGUN_DOMAIN)' });
  }

  const raw = decodeBody(event);
  const params = new URLSearchParams(raw);
  const paymentId = String(params.get('id') || '').trim();

  if (!paymentId) {
    return json(400, { success: false, message: 'Missing Mollie payment id' });
  }

  const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${mollieApiKey}`,
      Accept: 'application/json',
    },
  });

  const payment = await mollieResponse.json().catch(() => ({}));
  if (!mollieResponse.ok) {
    return json(502, {
      success: false,
      message: `Mollie error: HTTP ${mollieResponse.status}`,
      details: typeof payment?.detail === 'string' ? payment.detail : 'Unknown Mollie error',
    });
  }

  if (!payment.isPaid) {
    return json(200, { success: true, status: payment.status, message: 'Payment not paid yet' });
  }

  const productId = String(payment?.metadata?.productId || '').trim();
  const customerEmail = String(payment?.metadata?.customerEmail || '').trim();
  const product = PRODUCTS[productId];

  if (!product || !isValidEmail(customerEmail)) {
    return json(400, { success: false, message: 'Missing or invalid product/email metadata' });
  }

  const baseUrl = getBaseUrl(event);
  const downloadUrl = `${baseUrl}${product.downloadPath}`;
  const emailBody = [
    'Guten Tag,',
    '',
    'vielen Dank fuer Ihren Kauf.',
    '',
    `Ihr Download fuer "${product.name}" steht hier bereit:`,
    downloadUrl,
    '',
    'Falls es Probleme beim Download gibt, antworten Sie einfach auf diese E-Mail oder schreiben Sie an casekompass@gmx.de.',
    '',
    'Freundliche Gruesse',
    'Johannes Piperidis',
    'casekompass.de',
  ].join('\n');

  const mailBody = new URLSearchParams();
  mailBody.set('from', contactFrom);
  mailBody.set('to', customerEmail);
  if (contactTo) {
    mailBody.set('bcc', contactTo);
  }
  mailBody.set('subject', `Ihr Download: ${product.name}`);
  mailBody.set('text', emailBody);
  mailBody.set('h:Reply-To', 'casekompass@gmx.de');

  const auth = Buffer.from(`api:${mailgunApiKey}`).toString('base64');
  const mailResponse = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: mailBody,
  });

  const mailText = await mailResponse.text();
  if (!mailResponse.ok) {
    return json(502, {
      success: false,
      message: `Mailgun error: HTTP ${mailResponse.status}`,
      details: mailText.slice(0, 500),
    });
  }

  return json(200, { success: true, mailedTo: customerEmail, paymentId });
};
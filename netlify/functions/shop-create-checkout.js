function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
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

function buildMailConfig() {
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const contactTo = process.env.CONTACT_TO;
  const contactFrom = process.env.CONTACT_FROM || (mailgunDomain ? `casekompass.de <postmaster@${mailgunDomain}>` : 'casekompass.de <postmaster@example.com>');

  if (!mailgunApiKey || !mailgunDomain) {
    return null;
  }

  return {
    mailgunApiKey,
    mailgunDomain,
    contactTo,
    contactFrom,
  };
}

async function sendDownloadEmail(mailConfig, customerEmail, product, baseUrl) {
  const downloadUrl = `${baseUrl}${product.downloadPath}`;
  const emailBody = [
    'Guten Tag,',
    '',
    'vielen Dank fuer Ihren Download.',
    '',
    `Ihr PDF fuer "${product.name}" steht hier bereit:`,
    downloadUrl,
    '',
    'Falls es Probleme beim Download gibt, antworten Sie einfach auf diese E-Mail oder schreiben Sie an casekompass@gmx.de.',
    '',
    'Freundliche Gruesse',
    'Johannes Piperidis',
    'casekompass.de',
  ].join('\n');

  const mailBody = new URLSearchParams();
  mailBody.set('from', mailConfig.contactFrom);
  mailBody.set('to', customerEmail);
  if (mailConfig.contactTo) {
    mailBody.set('bcc', mailConfig.contactTo);
  }
  mailBody.set('subject', `Ihr Download: ${product.name}`);
  mailBody.set('text', emailBody);
  mailBody.set('h:Reply-To', 'casekompass@gmx.de');

  const auth = Buffer.from(`api:${mailConfig.mailgunApiKey}`).toString('base64');
  const mailResponse = await fetch(`https://api.mailgun.net/v3/${mailConfig.mailgunDomain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: mailBody,
  });

  if (!mailResponse.ok) {
    const mailText = await mailResponse.text();
    throw new Error(`Mailgun error: HTTP ${mailResponse.status} ${mailText.slice(0, 300)}`);
  }
}

const PRODUCTS = {
  'pflegegrad-ratgeber-pdf': {
    id: 'pflegegrad-ratgeber-pdf',
    name: 'PDF-Ratgeber: Pflegegrad beantragen - einfach vorbereitet',
    description: 'Digitaler PDF-Ratgeber fuer einen klaren und strukturierten Einstieg in den Pflegegrad-Antrag.',
    amount: '0.00',
    currency: 'EUR',
    downloadPath: '/downloads/pflegegrad-beantragen-einfach-vorbereitet.pdf',
  },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const body = parseBody(event);
  const productId = String(body.productId || '').trim();
  const customerEmail = String(body.customerEmail || '').trim();
  const product = PRODUCTS[productId];

  if (!product) {
    return json(400, { success: false, message: 'Unknown product' });
  }

  if (!isValidEmail(customerEmail)) {
    return json(400, { success: false, message: 'Valid customerEmail is required' });
  }

  const baseUrl = getBaseUrl(event);
  const redirectUrl = `${baseUrl}/shop-ratgeber.html?product=${encodeURIComponent(product.id)}`;

  if (product.amount === '0.00') {
    const mailConfig = buildMailConfig();
    if (!mailConfig) {
      return json(500, { success: false, message: 'Server not configured (missing MAILGUN_API_KEY/MAILGUN_DOMAIN)' });
    }

    try {
      await sendDownloadEmail(mailConfig, customerEmail, product, baseUrl);
    } catch (error) {
      return json(502, {
        success: false,
        message: 'Mail could not be sent',
        details: error instanceof Error ? error.message : 'Unknown mail error',
      });
    }

    return json(200, {
      success: true,
      productId: product.id,
      paymentId: `free:${product.id}:${Date.now()}`,
      checkoutUrl: redirectUrl,
    });
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) {
    return json(500, { success: false, message: 'Server not configured (missing MOLLIE_API_KEY)' });
  }

  const webhookUrl = `${baseUrl}/api/shop/webhook`;

  const response = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mollieApiKey}`,
    },
    body: JSON.stringify({
      amount: {
        currency: product.currency,
        value: product.amount,
      },
      description: product.name,
      redirectUrl,
      webhookUrl,
      metadata: {
        productId: product.id,
        customerEmail,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(502, {
      success: false,
      message: `Mollie error: HTTP ${response.status}`,
      details: typeof data?.detail === 'string' ? data.detail : 'Unknown Mollie error',
    });
  }

  const checkoutUrl = data?._links?.checkout?.href;
  const paymentId = data?.id;

  if (!checkoutUrl || !paymentId) {
    return json(502, { success: false, message: 'Invalid Mollie checkout response' });
  }

  return json(200, {
    success: true,
    productId: product.id,
    paymentId,
    checkoutUrl,
  });
};
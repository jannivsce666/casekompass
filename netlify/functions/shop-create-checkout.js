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

const PRODUCTS = {
  'pflegegrad-ratgeber-pdf': {
    id: 'pflegegrad-ratgeber-pdf',
    name: 'PDF-Ratgeber: Pflegegrad beantragen - einfach vorbereitet',
    description: 'Digitaler PDF-Ratgeber fuer einen klaren und strukturierten Einstieg in den Pflegegrad-Antrag.',
    amount: '9.90',
    currency: 'EUR',
  },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) {
    return json(500, { success: false, message: 'Server not configured (missing MOLLIE_API_KEY)' });
  }

  const body = parseBody(event);
  const productId = String(body.productId || '').trim();
  const product = PRODUCTS[productId];

  if (!product) {
    return json(400, { success: false, message: 'Unknown product' });
  }

  const baseUrl = getBaseUrl(event);
  const redirectUrl = `${baseUrl}/shop-ratgeber.html?product=${encodeURIComponent(product.id)}`;

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
      metadata: {
        productId: product.id,
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
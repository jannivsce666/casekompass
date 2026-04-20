const crypto = require('crypto');
const { createSignedToken, getShopTokenSecret } = require('./_shop-token');

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

function isValidApplicantName(name) {
  const normalized = String(name || '').trim();
  return normalized.length >= 3 && normalized.length <= 120;
}

function createOrderRef() {
  return `pflegegrad-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
}

function createNonce() {
  return crypto.randomBytes(12).toString('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const body = parseBody(event);
  const customerEmail = String(body.customerEmail || '').trim();
  const applicantName = String(body.applicantName || '').trim();

  if (!isValidApplicantName(applicantName)) {
    return json(400, { success: false, message: 'Applicant name is required' });
  }

  if (!isValidEmail(customerEmail)) {
    return json(400, { success: false, message: 'Valid customerEmail is required' });
  }

  const tokenSecret = getShopTokenSecret();
  if (!tokenSecret) {
    return json(500, { success: false, message: 'Server not configured (missing SHOP_TOKEN_SECRET or MOLLIE_API_KEY)' });
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) {
    return json(500, { success: false, message: 'Server not configured (missing MOLLIE_API_KEY)' });
  }

  const orderRef = createOrderRef();
  const nonce = createNonce();
  const baseUrl = getBaseUrl(event);
  const returnToken = createSignedToken({
    purpose: 'pflegegrad-return',
    orderRef,
    nonce,
    applicantName,
    customerEmail,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 3,
  }, tokenSecret);

  const response = await fetch('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mollieApiKey}`,
    },
    body: JSON.stringify({
      amount: {
        currency: 'EUR',
        value: '99.50',
      },
      description: `Pflegegrad-Startpaket für ${applicantName}`,
      locale: 'de_DE',
      redirectUrl: `${baseUrl}/pflegegrad-startpaket-abschluss.html?token=${encodeURIComponent(returnToken)}`,
      metadata: {
        orderRef,
        flowType: 'pflegegrad-startpaket',
        applicantName,
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
    orderRef,
    paymentId,
    checkoutUrl,
  });
};
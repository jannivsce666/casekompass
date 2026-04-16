const crypto = require('crypto');
const { createSignedToken, getShopTokenSecret, verifySignedToken } = require('./_shop-token');

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

const DISCONTINUED_MESSAGE = 'Dieses Download-Produkt wird nicht mehr angeboten. Bitte nutzen Sie stattdessen das Pflegegrad-Startpaket fuer 199 Euro.';

function createNonce() {
  return crypto.randomBytes(12).toString('hex');
}

async function fetchMollieJson(url, mollieApiKey) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${mollieApiKey}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function findPaymentByOrderRef(orderRef, mollieApiKey) {
  let url = 'https://api.mollie.com/v2/payments?limit=250';
  let pageCount = 0;

  while (url && pageCount < 10) {
    pageCount += 1;
    const { response, data } = await fetchMollieJson(url, mollieApiKey);

    if (!response.ok) {
      return {
        error: {
          status: response.status,
          detail: typeof data?.detail === 'string' ? data.detail : 'Unknown Mollie error',
        },
      };
    }

    const payments = Array.isArray(data?._embedded?.payments) ? data._embedded.payments : [];
    const match = payments.find((payment) => String(payment?.metadata?.orderRef || '').trim() === orderRef);
    if (match) {
      return { payment: match };
    }

    url = typeof data?._links?.next?.href === 'string' ? data._links.next.href : '';
  }

  return { payment: null };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const body = parseBody(event);
  const token = String(body.token || '').trim();

  const tokenSecret = getShopTokenSecret();
  if (!tokenSecret) {
    return json(500, { success: false, message: 'Server not configured (missing SHOP_TOKEN_SECRET or MOLLIE_API_KEY)' });
  }

  const verifiedReturnToken = verifySignedToken(token, tokenSecret);
  if (!verifiedReturnToken.valid || verifiedReturnToken.payload?.purpose !== 'shop-return') {
    return json(403, { success: false, message: 'Invalid or expired token' });
  }

  return json(410, { success: false, message: DISCONTINUED_MESSAGE });
};
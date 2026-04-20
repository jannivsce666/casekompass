const fs = require('fs');
const path = require('path');
const { getShopTokenSecret, verifySignedToken } = require('./_shop-token');

function response(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers,
    body,
  };
}

const DISCONTINUED_MESSAGE = 'Dieses Download-Produkt wird nicht mehr angeboten. Bitte nutzen Sie stattdessen das Pflegegrad-Startpaket statt 199 Euro aktuell fuer 99,50 Euro.';

function resolveFilePath(relativePath) {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(__dirname, '..', '..', relativePath),
    path.resolve('/var/task', relativePath),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

async function getPaymentStatus(paymentId) {
  if (paymentId.startsWith('free:')) {
    return { isPaid: true, productId: paymentId.split(':')[1] || '' };
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) {
    return { isPaid: false, error: 'missing-mollie-key' };
  }

  const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${mollieApiKey}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { isPaid: false, error: `mollie-${response.status}` };
  }

  return {
    isPaid: Boolean(data.isPaid),
    productId: String(data?.metadata?.productId || '').trim(),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return response(405, JSON.stringify({ success: false, message: 'Method not allowed' }), {
      'Content-Type': 'application/json; charset=utf-8',
    });
  }

  const token = String(event.queryStringParameters?.token || '').trim();
  const tokenSecret = getShopTokenSecret();
  if (!tokenSecret) {
    return response(500, 'Server not configured');
  }

  const verification = verifySignedToken(token, tokenSecret);
  if (!verification.valid || verification.payload?.purpose !== 'shop-download') {
    return response(403, 'Ungültiger oder abgelaufener Download-Link');
  }

  return response(410, DISCONTINUED_MESSAGE, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'private, no-store',
  });
};
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

const PRODUCTS = {
  'pflegegrad-ratgeber-pdf': {
    id: 'pflegegrad-ratgeber-pdf',
    name: 'PDF-Ratgeber: Pflegegrad beantragen - einfach vorbereitet',
    downloadUrl: '/downloads/pflegegrad-beantragen-einfach-vorbereitet.pdf',
  },
};

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

  const productIdFromToken = String(verifiedReturnToken.payload?.productId || '').trim();
  const orderRef = String(verifiedReturnToken.payload?.orderRef || '').trim();
  const freePaymentId = String(verifiedReturnToken.payload?.paymentId || '').trim();

  if (freePaymentId.startsWith('free:')) {
    const product = PRODUCTS[productIdFromToken] || null;

    if (!product) {
      return json(403, { success: false, message: 'Token does not match product' });
    }

    const downloadToken = createSignedToken({
      purpose: 'shop-download',
      paymentId: freePaymentId,
      productId: productIdFromToken,
      nonce: createNonce(),
      exp: Math.floor(Date.now() / 1000) + 60 * 20,
    }, tokenSecret);

    return json(200, {
      success: true,
      paymentId: freePaymentId,
      status: 'paid',
      isPaid: true,
      isOpen: false,
      isPending: false,
      isFailed: false,
      isCanceled: false,
      isExpired: false,
      productId: productIdFromToken,
      productName: product?.name || 'Digitales Produkt',
      downloadUrl: product ? `/api/shop/download?token=${encodeURIComponent(downloadToken)}` : null,
      isFreeTest: true,
    });
  }

  if (!orderRef) {
    return json(400, { success: false, message: 'Missing order reference' });
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY;
  if (!mollieApiKey) {
    return json(500, { success: false, message: 'Server not configured (missing MOLLIE_API_KEY)' });
  }

  const lookup = await findPaymentByOrderRef(orderRef, mollieApiKey);
  if (lookup.error) {
    return json(502, {
      success: false,
      message: `Mollie error: HTTP ${lookup.error.status}`,
      details: lookup.error.detail,
    });
  }

  const data = lookup.payment;
  if (!data?.id) {
    return json(404, { success: false, message: 'Payment not found for this token' });
  }

  const productId = data?.metadata?.productId;
  const product = PRODUCTS[productId] || null;

  if (!product || productIdFromToken !== productId) {
    return json(403, { success: false, message: 'Token does not match product' });
  }

  const downloadToken = createSignedToken({
    purpose: 'shop-download',
    paymentId: data.id,
    productId,
    nonce: createNonce(),
    exp: Math.floor(Date.now() / 1000) + 60 * 20,
  }, tokenSecret);

  return json(200, {
    success: true,
    paymentId: data.id,
    status: data.status,
    isPaid: Boolean(data.isPaid),
    isOpen: Boolean(data.isOpen),
    isPending: Boolean(data.isPending),
    isFailed: Boolean(data.isFailed),
    isCanceled: Boolean(data.isCanceled),
    isExpired: Boolean(data.isExpired),
    productId,
    productName: product?.name || data?.description || 'Digitales Produkt',
    downloadUrl: product ? `/api/shop/download?token=${encodeURIComponent(downloadToken)}` : null,
    isFreeTest: false,
  });
};
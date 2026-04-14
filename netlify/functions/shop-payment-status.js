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
  const paymentId = String(body.paymentId || '').trim();

  if (!paymentId) {
    return json(400, { success: false, message: 'Missing paymentId' });
  }

  const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${mollieApiKey}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(502, {
      success: false,
      message: `Mollie error: HTTP ${response.status}`,
      details: typeof data?.detail === 'string' ? data.detail : 'Unknown Mollie error',
    });
  }

  const productId = data?.metadata?.productId;
  const product = PRODUCTS[productId] || null;

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
    downloadUrl: product?.downloadUrl || null,
  });
};
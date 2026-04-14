const crypto = require('crypto');

function getShopTokenSecret() {
  return process.env.SHOP_TOKEN_SECRET || process.env.MOLLIE_API_KEY || '';
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(encodedPayload, secret) {
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function createSignedToken(payload, secret) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function verifySignedToken(token, secret) {
  if (!token || !secret || !String(token).includes('.')) {
    return { valid: false, reason: 'invalid-token' };
  }

  const [encodedPayload, signature] = String(token).split('.');
  const expectedSignature = signPayload(encodedPayload, secret);

  const actual = Buffer.from(signature || '');
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return { valid: false, reason: 'invalid-signature' };
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    if (payload?.exp && Number(payload.exp) < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'invalid-payload' };
  }
}

module.exports = {
  createSignedToken,
  getShopTokenSecret,
  verifySignedToken,
};
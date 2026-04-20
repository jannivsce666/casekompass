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

const DISCONTINUED_MESSAGE = 'Dieses Download-Produkt wird nicht mehr angeboten. Bitte nutzen Sie stattdessen das Pflegegrad-Startpaket statt 199 Euro aktuell fuer 99,50 Euro.';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  return json(410, { success: false, message: DISCONTINUED_MESSAGE });
};
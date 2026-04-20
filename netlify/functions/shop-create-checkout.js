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
const DISCONTINUED_MESSAGE = 'Dieses Download-Produkt wird nicht mehr angeboten. Bitte nutzen Sie stattdessen das Pflegegrad-Startpaket statt 199 Euro aktuell fuer 99,50 Euro.';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  return json(410, { success: false, message: DISCONTINUED_MESSAGE });
};
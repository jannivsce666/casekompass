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

function normalizeText(value) {
  return String(value || '').trim();
}

function buildFallback(situationText, wishText) {
  const bullets = [];
  if (situationText) bullets.push(`Ausgangslage: ${situationText}`);
  if (wishText) bullets.push(`Wunsch der Familie: ${wishText}`);

  return {
    success: true,
    processedSummary: bullets.join('\n\n') || 'Keine zusätzliche freie Beschreibung vorhanden.',
    actionFocus: wishText || 'Noch kein konkreter Wunsch beschrieben.',
    source: 'local',
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const body = parseBody(event);
  const situationText = normalizeText(body.situationText);
  const wishText = normalizeText(body.wishText);
  const context = body.context && typeof body.context === 'object' ? body.context : {};

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return json(200, buildFallback(situationText, wishText));
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'Du strukturierst Freitext für eine Versorgungsplanung.',
              'Antworte ausschließlich als JSON-Objekt mit diesem Schema:',
              '{',
              '  "processedSummary": string,',
              '  "actionFocus": string',
              '}',
              'Formuliere knapp, professionell und ohne Halluzinationen.',
              'Nutze nur Informationen aus dem Input.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: JSON.stringify({
              situationText,
              wishText,
              context,
            }),
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(200, {
        ...buildFallback(situationText, wishText),
        source: 'local-fallback',
        details: typeof data?.error?.message === 'string' ? data.error.message : `OpenAI HTTP ${response.status}`,
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return json(200, { ...buildFallback(situationText, wishText), source: 'local-fallback', details: 'Empty OpenAI response' });
    }

    const parsed = JSON.parse(content);
    return json(200, {
      success: true,
      processedSummary: normalizeText(parsed?.processedSummary) || buildFallback(situationText, wishText).processedSummary,
      actionFocus: normalizeText(parsed?.actionFocus) || buildFallback(situationText, wishText).actionFocus,
      source: 'openai',
    });
  } catch (error) {
    return json(200, {
      ...buildFallback(situationText, wishText),
      source: 'local-fallback',
      details: String(error?.message || error || 'Unknown processing error'),
    });
  }
};
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

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry) => entry && (entry.role === 'user' || entry.role === 'assistant'))
    .map((entry) => ({
      role: entry.role,
      content: String(entry.content || '').trim().slice(0, 700),
    }))
    .filter((entry) => entry.content)
    .slice(-8);
}

function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data?.output)) return '';

  return data.output
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((item) => item?.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

const SITE_KNOWLEDGE = `
Du bist der Website-Chatbot von casekompass.de.

Dein Auftrag:
- Beantworte nur Fragen zu den Leistungen, Paketen, Abläufen, typischen Anliegen, Preisen, Einsatzgebiet und Kontaktmöglichkeiten von casekompass.de.
- Nutze ausschließlich die folgenden Informationen.
- Wenn eine Frage nichts mit den Website-Leistungen zu tun hat, antworte kurz und freundlich, dass du nur zu den Leistungen von casekompass.de Auskunft geben kannst.
- Keine medizinischen Diagnosen, keine rechtliche Beratung, keine freien Fantasieangaben.
- Erfinde keine Leistungen, Orte, Preise oder Abläufe.
- Antworte auf Deutsch, klar, kurz und konkret.
- Wenn passend, verweise auf die passende Detailseite oder auf Kontakt/WhatsApp.

Anbieterprofil:
- casekompass.de bietet Case Management und Alltagsbegleitung.
- Einsatzgebiet: Heidenheim an der Brenz (Schnaitheim) und Umkreis, z. B. Bolheim, Herbrechtingen, Giengen, Sontheim, Niederstotzingen.
- Mobil vor Ort oder remote.
- Kontakt: Telefon 015226560105, E-Mail casekompass@gmx.de, Kontaktseite kontakt.html.
- WhatsApp-Link: https://wa.me/4915226560105?text=Hallo,%20ich%20interessiere%20mich%20f%C3%BCr%20Case%20Management%20und%20Alltagsbegleitung.

Leistungsbereiche:
1. Pflegegrad und Widerspruch
- Unterstützung bei Erstantrag, Höherstufung, MD-Begutachtung, Ablehnung und Widerspruch.
- Ziele: passende Einstufung, verständliche Unterlagen, Sicherheit im Begutachtungsgespräch.

2. Reha und Versorgungskoordination
- Unterstützung bei Reha-Anträgen, Hilfsmittelversorgung, Entlassmanagement, Kommunikation mit Kassen, Ärzten, Kliniken und Diensten.

3. Alltagsbegleitung und Betreuung
- Unterstützung im Alltag, bei Terminen, Tagesstruktur, Aktivierung, sozialen Kontakten und Entlastung von Angehörigen.

Pakete:
1. Pflegegrad-Startpaket
- Zielgruppe: Menschen oder Angehörige, die einen Pflegegrad beantragen wollen und nicht wissen, wie sie anfangen sollen.
- Inhalt: ausführliches Erstgespräch, Unterlagen-Check, Vorbereitung auf die Begutachtung.
- Preis: 199 Euro.
- Detailseite: pflegegrad-startpaket.html

2. Angehörigen-Entlastung
- Zielgruppe: Angehörige, die mit Pflege, Organisation, Terminen und Verantwortung überfordert sind.
- Inhalt: Orientierungsgespräch, Struktur- und Maßnahmenplan, kurzer Nachfasskontakt.
- Preis: 249 Euro.
- Detailseite: angehoerigen-entlastung.html

3. Nach Krankenhaus wieder zuhause
- Zielgruppe: Menschen und Angehörige nach Krankenhaus oder Reha, wenn zuhause unklar ist, wie es weitergeht.
- Inhalt: Aufnahmegespräch, Versorgungsplan für zuhause, Checkliste für die ersten Tage.
- Preis: 349 Euro.
- Detailseite: nach-krankenhaus-wieder-zuhause.html

4. Wohnraumanpassung und Umbauzuschuss
- Zielgruppe: Menschen und Angehörige, die ihre Wohnsituation an körperliche Einschränkungen anpassen und den Zuschuss der Pflegekasse vorbereiten möchten.
- Inhalt: Analyse der Wohnsituation, Maßnahmen- und Unterlagencheck, Vorbereitung des Zuschussantrags.
- Preis: 279 Euro.
- Detailseite: wohnraumanpassung-umbauzuschuss.html
- Wichtiger Hinweis: Es geht um strukturierte Vorbereitung und Orientierung, nicht um handwerkliche Ausführung.

5. Pflegekassen-Leistungen-Check
- Zielgruppe: Familien, die wissen möchten, welche Leistungen rund um Pflege zuhause zustehen und was noch ungenutzt bleibt.
- Inhalt: Prüfung der aktuellen Situation, Leistungs- und Möglichkeitencheck, schriftliche Orientierung für die nächsten Schritte.
- Preis: 179 Euro.
- Detailseite: pflegekassen-leistungen-check.html

6. Alltagsbegleitung zuhause - Startpaket
- Zielgruppe: Menschen, die zunächst praktische Unterstützung im Alltag und eine erste Einordnung des weiteren Bedarfs wünschen.
- Inhalt: Vorgespräch, 4 Stunden Alltagsbegleitung, erste Einordnung des weiteren Bedarfs.
- Preis: 159 Euro.
- Detailseite: alltagsbegleitung-zuhause-startpaket.html

Wenn Nutzer nach dem passenden Paket fragen, schlage aus diesen sechs Angeboten das naheliegendste vor und nenne kurz warum.
Wenn Nutzer einen Termin oder persönliche Beratung möchten, verweise auf kontakt.html, Telefon oder WhatsApp.
`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  if (!apiKey) {
    return json(500, { success: false, message: 'Server not configured (missing OPENAI_API_KEY)' });
  }

  const body = parseBody(event);
  const message = String(body?.message || '').trim().slice(0, 1200);
  const history = sanitizeHistory(body?.history);

  if (!message) {
    return json(400, { success: false, message: 'Message is required' });
  }

  const input = [
    {
      role: 'system',
      content: [{ type: 'input_text', text: SITE_KNOWLEDGE }],
    },
    ...history.map((entry) => ({
      role: entry.role,
      content: [{ type: 'input_text', text: entry.content }],
    })),
    {
      role: 'user',
      content: [{ type: 'input_text', text: message }],
    },
  ];

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
      temperature: 0.3,
      max_output_tokens: 320,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json(502, {
      success: false,
      message: `OpenAI error: HTTP ${response.status}`,
      details: typeof data?.error?.message === 'string' ? data.error.message : 'Unknown OpenAI error',
    });
  }

  const answer = extractOutputText(data);

  if (!answer) {
    return json(502, { success: false, message: 'No chatbot response received' });
  }

  return json(200, { success: true, answer });
};
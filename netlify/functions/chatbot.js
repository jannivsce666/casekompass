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

function extractChatCompletionText(data) {
  return String(data?.choices?.[0]?.message?.content || '').trim();
}

function includesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function buildLocalFallback(message) {
  const text = String(message || '').toLowerCase();

  if (includesAny(text, ['pflegegrad', 'begutachtung', 'md', 'einstufung', 'widerspruch'])) {
    return 'Zum Thema Pflegegrad passt meist das Pflegegrad-Startpaket für 199 Euro. Es umfasst ein ausführliches Erstgespräch, einen Unterlagen-Check und die Vorbereitung auf die Begutachtung. Wenn es schon Probleme mit einer Einstufung oder Ablehnung gibt, ist zusätzlich persönliche Beratung sinnvoll. Details finden Sie auf pflegegrad-startpaket.html oder direkt über kontakt.html.';
  }

  if (includesAny(text, ['angehörig', 'angehoerig', 'überfordert', 'ueberfordert', 'entlastung', 'pflege zu hause', 'pflege zuhause'])) {
    return 'Für überlastete Angehörige passt das Paket Angehörigen-Entlastung für 249 Euro. Es enthält ein Orientierungsgespräch, einen Struktur- und Maßnahmenplan und einen kurzen Nachfasskontakt. Wenn Sie möchten, können Sie direkt über kontakt.html, per WhatsApp oder telefonisch unter 015226560105 anfragen.';
  }

  if (includesAny(text, ['krankenhaus', 'reha', 'entlassung', 'zuhause weiter', 'wieder zuhause'])) {
    return 'Wenn nach Krankenhaus oder Reha unklar ist, wie es zuhause weitergeht, passt das Paket Nach Krankenhaus wieder zuhause für 349 Euro. Es enthält ein Aufnahmegespräch, einen Versorgungsplan für zuhause und eine Checkliste für die ersten Tage. Die Detailseite ist nach-krankenhaus-wieder-zuhause.html.';
  }

  if (includesAny(text, ['umbau', 'wohnraumanpassung', 'bad', 'rampe', 'tür', 'zuschuss'])) {
    return 'Für Anpassungen zuhause passt das Paket Wohnraumanpassung & Umbauzuschuss für 279 Euro. Es geht um Analyse der Wohnsituation, Unterlagencheck und Vorbereitung des Zuschussantrags. Wichtig: Es geht um strukturierte Vorbereitung und Orientierung, nicht um die handwerkliche Ausführung. Mehr dazu auf wohnraumanpassung-umbauzuschuss.html.';
  }

  if (includesAny(text, ['pflegekasse', 'entlastungsbetrag', 'pflegehilfsmittel', 'leistungen-check', 'welche leistungen'])) {
    return 'Dafür passt der Pflegekassen-Leistungen-Check für 179 Euro. Er prüft, welche Leistungen rund um Pflege zuhause schon genutzt werden und was noch offen ist. Enthalten sind die Prüfung der aktuellen Situation, ein Leistungs- und Möglichkeitencheck und eine schriftliche Orientierung für die nächsten Schritte. Details: pflegekassen-leistungen-check.html.';
  }

  if (includesAny(text, ['alltagsbegleitung', 'alltag', 'begleitung', 'einsam', 'struktur im alltag'])) {
    return 'Für praktische Unterstützung im Alltag passt das Alltagsbegleitung zuhause - Startpaket für 159 Euro. Es enthält ein Vorgespräch, 4 Stunden Alltagsbegleitung und eine erste Einordnung des weiteren Bedarfs. Die Detailseite ist alltagsbegleitung-zuhause-startpaket.html.';
  }

  if (includesAny(text, ['preis', 'kosten', 'was kostet'])) {
    return 'Aktuell gibt es diese Pakete: Pflegegrad-Startpaket 199 Euro, Angehörigen-Entlastung 249 Euro, Nach Krankenhaus wieder zuhause 349 Euro, Wohnraumanpassung & Umbauzuschuss 279 Euro, Pflegekassen-Leistungen-Check 179 Euro und Alltagsbegleitung zuhause - Startpaket 159 Euro. Wenn Sie unsicher sind, welches Paket passt, beschreiben Sie kurz Ihre Situation.';
  }

  if (includesAny(text, ['kontakt', 'telefon', 'whatsapp', 'termin', 'anrufen', 'email', 'e-mail'])) {
    return 'Sie können direkt Kontakt aufnehmen über kontakt.html, per E-Mail an casekompass@gmx.de oder telefonisch unter 015226560105. WhatsApp ist ebenfalls möglich: https://wa.me/4915226560105?text=Hallo,%20ich%20interessiere%20mich%20f%C3%BCr%20Case%20Management%20und%20Alltagsbegleitung.';
  }

  if (includesAny(text, ['gebiet', 'heidenheim', 'vor ort', 'remote', 'mobil'])) {
    return 'Das Angebot richtet sich an Heidenheim an der Brenz (Schnaitheim) und Umkreis, zum Beispiel Bolheim, Herbrechtingen, Giengen, Sontheim und Niederstotzingen. Die Unterstützung ist mobil vor Ort oder remote möglich.';
  }

  return 'Ich kann Ihnen bei Fragen zu Pflegegrad, Angehörigen-Entlastung, Hilfe nach dem Krankenhaus, Wohnraumanpassung, Pflegekassen-Leistungen, Alltagsbegleitung sowie Kontakt und Preisen weiterhelfen. Beschreiben Sie am besten kurz Ihre Situation, dann nenne ich das passende Paket oder den besten Kontaktweg.';
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
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const body = parseBody(event);
  const message = String(body?.message || '').trim().slice(0, 1200);
  const history = sanitizeHistory(body?.history);

  if (!message) {
    return json(400, { success: false, message: 'Message is required' });
  }

  const fallbackAnswer = buildLocalFallback(message);

  if (!apiKey) {
    return json(200, { success: true, answer: fallbackAnswer, source: 'local-fallback' });
  }

  const messages = [
    { role: 'system', content: SITE_KNOWLEDGE },
    ...history.map((entry) => ({ role: entry.role, content: entry.content })),
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 320,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return json(200, { success: true, answer: fallbackAnswer, source: 'local-fallback', details: typeof data?.error?.message === 'string' ? data.error.message : 'OpenAI request failed' });
    }

    const answer = extractChatCompletionText(data);
    if (!answer) {
      return json(200, { success: true, answer: fallbackAnswer, source: 'local-fallback', details: 'Empty OpenAI response' });
    }

    return json(200, { success: true, answer, source: 'openai' });
  } catch (error) {
    return json(200, { success: true, answer: fallbackAnswer, source: 'local-fallback', details: String(error?.message || error || 'Unknown error') });
  }
};
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

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  const text = normalizeText(value);
  return text ? [text] : [];
}

function isFilled(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(normalizeText(value));
}

const REQUIRED_FIELDS = [
  { key: 'firstName', label: 'Vorname' },
  { key: 'lastName', label: 'Nachname' },
  { key: 'birthDate', label: 'Geburtsdatum' },
  { key: 'addressLine', label: 'Adresse' },
  { key: 'postalCode', label: 'PLZ' },
  { key: 'city', label: 'Ort' },
  { key: 'phone', label: 'Telefonnummer' },
  { key: 'email', label: 'E-Mail' },
  { key: 'insuranceProvider', label: 'Kranken- oder Pflegekasse' },
  { key: 'filledByRole', label: 'Wer füllt das Formular aus?' },
  { key: 'filledByContact', label: 'Name und Kontaktdaten der ausfüllenden Person' },
  { key: 'requestReason', label: 'Grund der Anfrage' },
  { key: 'mainProblem', label: 'Aktuelles Hauptproblem' },
  { key: 'dailyLimitations', label: 'Größte Alltagseinschränkungen' },
  { key: 'currentHelpers', label: 'Wer hilft aktuell?' },
  { key: 'currentGaps', label: 'Was fehlt aktuell?' },
  { key: 'availableDocuments', label: 'Welche Unterlagen oder Bescheide liegen schon vor?' },
  { key: 'familyGoal', label: 'Was ist das Ziel?' },
];

function buildManualMissing(submission) {
  return REQUIRED_FIELDS
    .filter((field) => !isFilled(submission[field.key]))
    .map((field) => field.label);
}

function summarizeSubmission(submission) {
  const helperTypes = normalizeArray(submission.helperTypes).join(', ');
  const goals = normalizeArray(submission.goalFocus).join(', ');

  return {
    person: `${normalizeText(submission.firstName)} ${normalizeText(submission.lastName)}`.trim(),
    role: normalizeText(submission.filledByRole),
    requestReason: normalizeText(submission.requestReason),
    mainProblem: normalizeText(submission.mainProblem),
    situationSince: normalizeText(submission.situationSince),
    diagnoses: normalizeText(submission.mainDiagnoses),
    dailyLimitations: normalizeText(submission.dailyLimitations),
    currentHelpers: normalizeText(submission.currentHelpers),
    helperTypes,
    currentGaps: normalizeText(submission.currentGaps),
    availableDocuments: normalizeText(submission.availableDocuments),
    familyGoal: normalizeText(submission.familyGoal),
    goalFocus: goals,
    uploadedFiles: normalizeArray(submission.uploadedFiles).join(', '),
  };
}

async function reviewWithOpenAI(submission, apiKey, model) {
  const summary = summarizeSubmission(submission);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Du prüfst Intake-Formulare für eine Versorgungsplanung.',
            'Antworte ausschließlich als JSON-Objekt.',
            'Schema:',
            '{',
            '  "isReady": boolean,',
            '  "missingFields": string[],',
            '  "followUpQuestions": string[],',
            '  "warnings": string[],',
            '  "summary": string',
            '}',
            'Sei streng: Wenn wichtige Informationen für einen belastbaren Versorgungsplan fehlen oder widersprüchlich sind, setze isReady auf false.',
            'Nutze konkrete deutsche Feldbezeichnungen.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: JSON.stringify(summary),
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error?.message === 'string' ? data.error.message : `OpenAI HTTP ${response.status}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned no content');
  }

  const parsed = JSON.parse(content);
  return {
    isReady: Boolean(parsed?.isReady),
    missingFields: normalizeArray(parsed?.missingFields),
    followUpQuestions: normalizeArray(parsed?.followUpQuestions),
    warnings: normalizeArray(parsed?.warnings),
    summary: normalizeText(parsed?.summary),
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
  const submission = body?.submission && typeof body.submission === 'object' ? body.submission : null;

  if (!submission) {
    return json(400, { success: false, message: 'Submission data is required' });
  }

  const manualMissingFields = buildManualMissing(submission);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  let aiReview = {
    isReady: manualMissingFields.length === 0,
    missingFields: [],
    followUpQuestions: [],
    warnings: [],
    summary: '',
  };
  let reviewSource = 'local';
  let reviewError = '';

  if (apiKey) {
    try {
      aiReview = await reviewWithOpenAI(submission, apiKey, model);
      reviewSource = 'openai';
    } catch (error) {
      reviewError = String(error?.message || error || 'Unknown validation error');
    }
  }

  const missingFields = Array.from(new Set([
    ...manualMissingFields,
    ...normalizeArray(aiReview.missingFields),
  ]));
  const ready = missingFields.length === 0 && Boolean(aiReview.isReady || !apiKey);

  return json(200, {
    success: true,
    ready,
    missingFields,
    manualMissingFields,
    followUpQuestions: normalizeArray(aiReview.followUpQuestions),
    warnings: normalizeArray(aiReview.warnings),
    summary: normalizeText(aiReview.summary),
    reviewSource,
    reviewError,
  });
};
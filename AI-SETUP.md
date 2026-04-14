# Chatbot Setup mit Netlify

Der Chatbot läuft serverseitig über eine Netlify Function. Der OpenAI-Schlüssel bleibt dabei im Netlify-Environment und ist nicht im Frontend sichtbar.

## Benötigte Umgebungsvariablen

In Netlify unter Site settings > Environment variables:

- `OPENAI_API_KEY`
	Ihr vorhandener geheimer OpenAI-Key.
- `OPENAI_MODEL`
	Optional. Standard ist `gpt-4.1-mini`.

## Technischer Ablauf

1. Das Frontend sendet Fragen an `/api/chatbot`
2. Netlify leitet auf `netlify/functions/chatbot.js` weiter
3. Die Function ruft OpenAI mit `OPENAI_API_KEY` auf
4. Der Bot beantwortet nur Fragen zu den Leistungen und Paketen von casekompass.de

## Was der Bot beantworten darf

- Leistungen und Pakete
- Preise
- Typische Anwendungsfälle
- Ablauf und Einsatzgebiet
- Kontaktmöglichkeiten

## Was der Bot nicht beantworten soll

- Allgemeinwissen außerhalb der Website
- Medizinische Diagnosen
- Rechtliche Beratung
- Frei erfundene Leistungen oder Preise

## Wichtige Hinweise

- Der Key gehört nicht in `script.js` oder in HTML.
- Wenn `OPENAI_API_KEY` in Netlify gesetzt ist, reicht das für den Betrieb.
- Änderungen an der Function werden nach dem nächsten Deploy aktiv.

## Fehlerbilder

### Chat antwortet nicht
- Prüfen, ob `OPENAI_API_KEY` in Netlify gesetzt ist
- Prüfen, ob der Deploy erfolgreich war
- Prüfen, ob OpenAI-Guthaben vorhanden ist

### 500 Server not configured
- `OPENAI_API_KEY` fehlt in Netlify

### 502 OpenAI error
- Key ungültig, Modell nicht verfügbar oder OpenAI-Konto ohne Guthaben

## Dateien

- `netlify/functions/chatbot.js`
- `netlify.toml`
- `script.js`
- `style.css`

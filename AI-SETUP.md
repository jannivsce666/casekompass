# KI-Text-Verbesserung Setup

## OpenAI API Key einrichten

### Schritt 1: OpenAI API Key erhalten
1. Gehen Sie zu: https://platform.openai.com/api-keys
2. Melden Sie sich an oder erstellen Sie ein Konto
3. Klicken Sie auf "Create new secret key"
4. Kopieren Sie den API Key (beginnt mit `sk-...`)

### Schritt 2: API Key einfügen
Öffnen Sie die Datei `script.js` und suchen Sie nach dieser Zeile (ca. Zeile 257):

```javascript
const API_KEY = 'IHR_OPENAI_API_KEY_HIER';
```

Ersetzen Sie `IHR_OPENAI_API_KEY_HIER` mit Ihrem echten API Key:

```javascript
const API_KEY = 'sk-proj-...IHR_KOMPLETTER_KEY...';
```

**Wichtig**: Der API Key muss mit `sk-` beginnen und vollständig sein!

### Schritt 3: Kosten
- **Modell**: GPT-3.5-Turbo (günstig und schnell)
- **Kosten**: ca. $0.002 pro Anfrage
- **Budget**: Setzen Sie ein monatliches Limit in den OpenAI-Einstellungen (z.B. $5-10/Monat)

### Fehlerbehandlung

**Fehler 401 - "API Key ungültig"**:
- Ihr API Key ist falsch, abgelaufen oder nicht gesetzt
- Lösung: Erstellen Sie einen neuen API Key auf https://platform.openai.com/api-keys
- Stellen Sie sicher, dass der Key mit `sk-` beginnt

**Fehler 429 - "Rate-Limit"**:
- Zu viele Anfragen in kurzer Zeit
- Lösung: Warten Sie 1-2 Minuten und versuchen Sie es erneut

**Fehler 403 - "Zugriff verweigert"**:
- Ihr OpenAI-Konto hat keine Berechtigung oder kein Guthaben
- Lösung: Fügen Sie Guthaben zu Ihrem OpenAI-Konto hinzu

### Wichtige Hinweise

⚠️ **SICHERHEIT**:
- **NIEMALS** den API Key direkt im Frontend-Code lassen für eine Produktionsseite!
- Für eine echte Website sollten Sie einen Backend-Server verwenden, der die API aufruft
- Der API Key ist aktuell im Frontend sichtbar - nur für Test-/Entwicklungszwecke!
- Jeder kann den Key sehen und verwenden - setzen Sie ein Budget-Limit!

### Alternative: Backend-Lösung (Empfohlen für Produktion)

Für eine sichere Produktionsumgebung sollten Sie:
1. Ein Backend (z.B. Node.js, PHP) erstellen
2. Den API Key dort speichern (als Umgebungsvariable)
3. Das Frontend ruft Ihr Backend auf, nicht direkt OpenAI

### Funktion
- Benutzer schreibt Text ins Nachrichtenfeld
- Klickt auf "Text mit KI verbessern"
- KI korrigiert Rechtschreibfehler
- KI macht den Text professioneller und klarer
- Verbesserter Text wird automatisch eingefügt

### Beispiel
**Vorher:**
"halo ich brauch termin hab rezen vom artz weil hand tut we bitte anrufen danke"

**Nachher:**
"Guten Tag, ich benötige einen Termin für eine ergotherapeutische Behandlung. Ich habe ein Rezept von meinem Arzt, da ich Beschwerden in der Hand habe. Bitte rufen Sie mich für einen Terminvorschlag an. Vielen Dank!"

# Success Popup - Kontaktformular

## ✅ Implementiert

Nach dem Absenden des Kontaktformulars erscheint ein Success-Popup mit:
- ✅ Erfolgsbestätigung mit grünem Häkchen
- ✅ Countdown (3 Sekunden)
- ✅ Automatische Weiterleitung zur Startseite
- ✅ Animierte Übergänge
- ✅ Mobile-responsive Design

## 📋 Geänderte Dateien

1. **kontakt.html**: Modal-HTML hinzugefügt
2. **style.css**: Modal-Styling & Animationen
3. **script.js**: Form-Handling mit Fetch API + showSuccessModal()

## 🧪 Testing

Lokaler Server starten:
```bash
cd /Users/jannivsce666/Desktop/Mareike-Seite
python3 -m http.server 8000
```

Dann: http://localhost:8000/kontakt.html

## ⚙️ Konfiguration

**Countdown ändern** (script.js, Zeile ~327):
```javascript
let countdown = 3; // Sekunden
```

**Ziel-URL ändern** (script.js, Zeile ~337):
```javascript
window.location.href = 'index.html';
```

## 🔄 Ablauf

1. User füllt Formular aus
2. Klick auf "Nachricht senden"
3. Validierung + Spinner
4. Bei Erfolg: Modal erscheint
5. Countdown: 3... 2... 1...
6. Weiterleitung zur Startseite

## ⚠️ Wichtig

- Formular funktioniert nur auf Server (nicht `file://`)
- Web3Forms Access Key muss gültig sein
- Internet-Verbindung erforderlich

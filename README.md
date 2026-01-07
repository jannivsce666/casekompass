# Johannes Piperidis – Case Management

Statische HTML/CSS Website.

## Lokal ansehen

Option A: `index.html` direkt im Browser öffnen.

Option B: lokaler Server:

```bash
npx serve . -l 3000
```

Dann `http://localhost:3000` öffnen.

## Bilder ersetzen

Die Hero-Bilder liegen in `images/` (SVG Platzhalter). Du kannst sie durch eigene Bilder ersetzen, z.B. `images/hero-1.jpg`, und die Pfade in `index.html` anpassen.

## Netlify

- Publish directory: `.`
- Build command: `echo 'No build step'`

Konfiguration: `netlify.toml`

## Firebase (Google Login + Realtime Database)

Diese Website nutzt Firebase direkt im Browser (ohne Build Step) via [firebase.js](firebase.js).

### In der Firebase Console aktivieren

- **Authentication** → **Sign-in method** → **Google** aktivieren
- **Realtime Database** anlegen

### Realtime Database Rules

Setze Regeln so, dass Nutzer nur ihre eigenen Daten lesen/schreiben können.
Empfohlene Basisregeln liegen in [firebase-realtimedb-rules.json](firebase-realtimedb-rules.json).

### Wichtige Hinweise

- Bestellungen sind aktuell eine **E-Mail-Anfrage (mailto)**. Wenn ein Nutzer angemeldet ist und der Datenschutz bestätigt wurde, wird diese Anfrage zusätzlich im Profil gespeichert.
- Terminanfragen werden (bei Anmeldung) zusätzlich im Profil gespeichert.

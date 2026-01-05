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

# Mailgun Kontaktformular (Netlify)

Diese Website ist statisch (HTML/CSS/JS). Damit kein API-Key im Browser landet, wird das Kontaktformular über eine **Netlify Function** an Mailgun weitergeleitet.

## 1) Voraussetzungen
- Mailgun Account + Domain (Sandbox geht auch, aber Empfänger müssen ggf. verifiziert werden)
- Cloudflare Account
- Optional: Wrangler CLI (lokal)

## 2) Netlify Dateien
- netlify/functions/contact.js
- netlify.toml

## 3) Netlify Setup
1. Repo zu Netlify verbinden (New site from Git).
2. Build settings:
   - Build command: leer lassen
   - Publish directory: `.`
3. Environment variables setzen (Site settings ? Environment variables):
   - `MAILGUN_API_KEY`
   - `MAILGUN_DOMAIN` (z.B. `sandboxXXXX.mailgun.org`)
   - `CONTACT_TO` = `infocasekompasshdh@gmail.com`
   - optional `CONTACT_FROM` (z.B. `Ergotherapie Mobil <postmaster@sandboxXXXX.mailgun.org>`)
4. Deploy auslösen (neuer Deploy, wenn Variablen gesetzt sind).

## 4) Route / URL
Im [kontakt.html](kontakt.html) ist das Formular auf `action="/api/contact"` eingestellt.
Durch [netlify.toml](netlify.toml) wird das automatisch nach `/.netlify/functions/contact` geroutet.

## 5) Wichtiger Hinweis (Mailgun Sandbox)
Wenn du noch eine Sandbox nutzt, kann Mailgun den Versand an nicht-verifizierte Empfänger blockieren.
Falls keine E-Mails ankommen: Empfängeradresse in Mailgun verifizieren oder eine eigene Sending Domain einrichten.




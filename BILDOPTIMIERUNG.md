# Bildoptimierung für Ergotherapie Mobil

## Stand 2026-04-15
```
logo.png          ~37 KB  ✅ optimiert
1.webp            ~68 KB  ✅ aktiv
2.webp            ~60 KB  ✅ aktiv
3.webp            ~65 KB  ✅ aktiv
4.webp            ~54 KB  ✅ aktiv
m.nebel.webp      ~40 KB  ✅ aktiv
Produktbilder     ~19-26 KB je Datei  ✅ aktiv
```

- Ungenutzte alte PNG- und JPG-Originale wurden aus dem Repo entfernt.
- Die Website verwendet fuer Hero, Portrait und Produktkarten jetzt die kleineren WebP-Dateien.

## Zielgrößen
- **Hero-Bilder**: Max 150-200 KB (WebP)
- **Logo**: Max 50 KB (WebP + PNG Fallback)
- **Portraits**: Max 100 KB (WebP)
- **Icons/Favicons**: Max 20 KB

## Option 1: Online-Tools (Schnell & Einfach)

### Empfohlene Tools:
1. **TinyPNG.com** - PNG/JPG Kompression (bis zu 80% Reduktion)
2. **Squoosh.app** - Google Tool für WebP Konvertierung
3. **Compressor.io** - Verlustfreie Kompression

### Schritte:
1. Gehe zu https://tinypng.com
2. Ziehe alle PNG/JPG Dateien rein
3. Lade optimierte Versionen herunter
4. Ersetze die Originale

Für WebP:
1. Gehe zu https://squoosh.app
2. Lade jedes Bild hoch
3. Wähle "WebP" als Format
4. Quality: 80-85
5. Download und ersetzen

## Option 2: Automatisch mit ImageMagick (Fortgeschritten)

### Installation:
```bash
brew install imagemagick webp
```

### Batch-Konvertierung zu WebP:
```bash
cd images/

# Konvertiere alle PNG zu WebP (80% Qualität)
for file in *.png; do
  cwebp -q 80 "$file" -o "${file%.png}.webp"
done

# Konvertiere alle JPG zu WebP (85% Qualität)
for file in *.jpg; do
  cwebp -q 85 "$file" -o "${file%.jpg}.webp"
done

# Optimiere bestehende WebP
for file in *.webp; do
  cwebp -q 80 "$file" -o "optimized_$file"
  mv "optimized_$file" "$file"
done
```

### PNG Optimierung (falls PNG nötig):
```bash
# Für Logo (mit Transparenz)
pngquant --quality=65-80 logo.png --output logo-optimized.png
mv logo-optimized.png logo.png

# Für alle PNGs
for file in *.png; do
  pngquant --quality=65-80 "$file" --output "temp_$file"
  mv "temp_$file" "$file"
done
```

### JPG Optimierung:
```bash
# Für alle JPGs
for file in *.jpg; do
  convert "$file" -quality 85 -strip "temp_$file"
  mv "temp_$file" "$file"
done
```

## Option 3: VS Code Extension

1. Installiere Extension: "Image Optimizer"
2. Rechtsklick auf Bild → "Optimize Image"
3. Wähle Qualität und Format

## Empfohlene Größen nach Optimierung

```
logo.png           ~40 KB  (aktiver Fallback)
hero-1.webp        ~70 KB  (Startseiten-Hintergrund)
hero-2.webp        ~60 KB  (Startseiten-Hintergrund)
hero-3.webp        ~65 KB  (Startseiten-Hintergrund)
hero-4.webp        ~55 KB  (Startseiten-Hintergrund)
m.nebel.webp       ~40 KB  (Portrait)
produktbilder.webp ~20-30 KB je Datei
```

**Gesamt-Ersparnis: ca. 4.3 MB → 0.7 MB (85% kleiner!)**

## Nach der Optimierung

1. Alte Bilder sichern: `mkdir images_backup && cp images/* images_backup/`
2. Neue oder ersetzte Quelldateien mit `./optimize-images.sh` nach WebP umwandeln
3. Referenzen in HTML/CSS/JS auf die optimierten Dateien umstellen
4. Testen: Seite neu laden und Bilder pruefen

## Notiz
Die vorhandenen Seiten wurden bereits manuell auf kleinere WebP-Dateien umgestellt.

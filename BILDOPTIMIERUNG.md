# Bildoptimierung für Ergotherapie Mobil

## Aktueller Zustand
```
logo.png          1.4 MB  ❌ ZU GROSS
m.nebel.png       566 KB  ❌ ZU GROSS
mobil.png         1.2 MB  ❌ ZU GROSS
ergo2.webp        2.4 MB  ❌ ZU GROSS
ergo3.jpg         248 KB  ⚠️ OPTIMIERBAR
ergo5.webp        142 KB  ⚠️ OPTIMIERBAR
ergo6.jpg         164 KB  ⚠️ OPTIMIERBAR
ergo4.jpg          29 KB  ✅ OK
```

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
logo.webp          ~40 KB  (Original: 1.4 MB)
logo.png           ~80 KB  (Fallback für alte Browser)
m.nebel.webp       ~80 KB  (Original: 566 KB)
mobil.webp         ~100 KB (Original: 1.2 MB)
ergo2.webp         ~150 KB (Original: 2.4 MB)
ergo3.webp         ~100 KB (Original: 248 KB)
ergo4.webp         ~25 KB  (Original: 29 KB)
ergo5.webp         ~80 KB  (Original: 142 KB)
ergo6.webp         ~90 KB  (Original: 164 KB)
```

**Gesamt-Ersparnis: ca. 4.3 MB → 0.7 MB (85% kleiner!)**

## Nach der Optimierung

1. Alte Bilder sichern: `mkdir images_backup && cp images/* images_backup/`
2. Optimierte Bilder in `images/` Ordner kopieren
3. HTML-Code wird automatisch aktualisiert (siehe nächster Schritt)
4. Testen: Seite neu laden und Bilder prüfen

## Notiz
Die HTML-Dateien werden automatisch aktualisiert, um `<picture>` Tags mit WebP + Fallback zu verwenden.

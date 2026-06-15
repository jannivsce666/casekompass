#!/bin/bash

# Bildoptimierungs-Script für Ergotherapie Mobil
# Voraussetzung: brew install imagemagick webp

echo "🖼️  Bildoptimierung gestartet..."
echo ""

# Backup erstellen
if [ ! -d "images_backup" ]; then
    echo "📦 Erstelle Backup in images_backup/..."
    mkdir -p images_backup
    cp -r images/* images_backup/
    echo "✅ Backup erstellt"
    echo ""
fi

cd images/

echo "🔄 Konvertiere und optimiere Bilder zu WebP..."
echo ""

# Logo (wichtig: hohe Qualität für Branding)
if [ -f "logo.png" ]; then
    echo "  • logo.png → logo.webp (Qualität: 85)"
    cwebp -q 85 logo.png -o logo.webp
fi

# Portrait
if [ -f "m.nebel.png" ]; then
    echo "  • m.nebel.png → m.nebel.webp (Qualität: 80)"
    cwebp -q 80 m.nebel.png -o m.nebel.webp
fi

# Mobil Bild
if [ -f "mobil.png" ]; then
    echo "  • mobil.png → mobil.webp (Qualität: 80)"
    cwebp -q 80 mobil.png -o mobil.webp
fi

# Hero Bilder (bereits WebP, aber re-optimieren)
if [ -f "ergo2.webp" ]; then
    echo "  • ergo2.webp → optimiert (Qualität: 75)"
    cwebp -q 75 ergo2.webp -o ergo2_opt.webp
    mv ergo2_opt.webp ergo2.webp
fi

if [ -f "ergo5.webp" ]; then
    echo "  • ergo5.webp → optimiert (Qualität: 80)"
    cwebp -q 80 ergo5.webp -o ergo5_opt.webp
    mv ergo5_opt.webp ergo5.webp
fi

# JPG zu WebP
if [ -f "ergo3.jpg" ]; then
    echo "  • ergo3.jpg → ergo3.webp (Qualität: 85)"
    cwebp -q 85 ergo3.jpg -o ergo3.webp
fi

if [ -f "ergo4.jpg" ]; then
    echo "  • ergo4.jpg → ergo4.webp (Qualität: 85)"
    cwebp -q 85 ergo4.jpg -o ergo4.webp
fi

if [ -f "ergo6.jpg" ]; then
    echo "  • ergo6.jpg → ergo6.webp (Qualität: 85)"
    cwebp -q 85 ergo6.jpg -o ergo6.webp
fi

cd ..

echo ""
echo "✅ Optimierung abgeschlossen!"
echo ""
echo "📊 Größenvergleich:"
echo "   Vorher:  $(du -sh images_backup/ | cut -f1)"
echo "   Nachher: $(du -sh images/ | cut -f1)"
echo ""
echo "💡 Nächste Schritte:"
echo "   1. Bilder prüfen: ls -lh images/"
echo "   2. Website testen: Seite im Browser neu laden"
echo "   3. Wenn alles OK: rm -rf images_backup/"
echo ""

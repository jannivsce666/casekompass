#!/bin/bash

# Bildoptimierungs-Script fuer die verbleibenden Quelldateien
# Voraussetzung: cwebp ist installiert

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

echo "🔄 Erstelle WebP-Versionen fuer vorhandene PNG/JPG-Quelldateien..."
echo ""

find . -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r file; do
    target="${file%.*}.webp"
    echo "  • ${file#./} → ${target#./} (Qualitaet: 82)"
    cwebp -q 82 "$file" -o "$target"
done

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

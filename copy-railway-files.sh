#!/bin/bash
# Script pentru copierea fișierelor Railway în GitHub

echo "📋 Fișierele Railway pentru GitHub:"
echo "=================================="
echo ""

echo "1. Creează nixpacks.toml cu conținutul:"
echo "---------------------------------------"
cat nixpacks.toml
echo ""

echo "2. Creează railway.toml cu conținutul:"
echo "--------------------------------------"
cat railway.toml
echo ""

echo "3. Creează Procfile cu conținutul:"
echo "----------------------------------"
cat Procfile
echo ""

echo "4. Creează .railwayignore cu conținutul:"
echo "----------------------------------------"
cat .railwayignore
echo ""

echo "5. Actualizează .env.example cu conținutul:"
echo "-------------------------------------------"
cat .env.example
echo ""

echo "✅ Toate fișierele sunt gata pentru adăugarea în GitHub!"
echo "📌 După push, Railway va detecta automat noua configurație."
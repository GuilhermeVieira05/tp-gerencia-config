#!/usr/bin/env bash
# Gera os artefatos de entrega do TP1 em ../entrega-tp1/ e testa o zip em pasta limpa.
#   1. Plano consolidado (docs/plano/PLANO_DE_CM.md) e PDF
#   2. Slides em PDF (docs/slides/slides.html)
#   3. Script de implantacao (copia de scripts/deploy.sh)
#   4. ZIP do repositorio (com .git; sem node_modules, dist, coverage)
#   5. Teste do zip: descompacta numa pasta limpa e roda npm ci, build e testes
# Requisitos: python3 com "markdown" (pip install markdown), Google Chrome, zip, npm.
# Uso: ./scripts/gerar-entrega.sh   (commite antes: o .git do zip deve conter o que esta no disco)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${OUT:-../entrega-tp1}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p "$OUT"

if [ -n "$(git status --porcelain)" ]; then
  echo "AVISO: ha mudancas nao commitadas. O .git do zip nao refletira o disco." >&2
fi

echo "[1/5] Plano"
python3 scripts/entrega/montar_plano.py
python3 scripts/entrega/md2pdf.py docs/plano/PLANO_DE_CM.md "$OUT/Plano_de_Gerenciamento_de_Configuracao.pdf"

echo "[2/5] Slides"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$(cd "$OUT" && pwd)/Slides_TP1.pdf" "file://$PWD/docs/slides/slides.html" >/dev/null 2>&1

echo "[3/5] Script de implantacao"
cp scripts/deploy.sh "$OUT/deploy.sh"

echo "[4/5] ZIP do repositorio"
NOME="tp-gerencia-config"
TMP="$(mktemp -d)"
mkdir "$TMP/$NOME"
rsync -a --exclude node_modules --exclude dist --exclude coverage --exclude .DS_Store \
  --exclude PROMPT_AUDITORIA_TP1.md --exclude TP1_Gerencia_de_Configuracao_FONTE_DA_VERDADE.md \
  ./ "$TMP/$NOME/"
rm -f "$OUT/$NOME.zip"
(cd "$TMP" && zip -qr "$(cd - >/dev/null; cd "$OUT" && pwd)/$NOME.zip" "$NOME")
rm -rf "$TMP"

echo "[5/5] Teste do zip em pasta limpa"
LIMPO="$(mktemp -d)"
unzip -q "$OUT/$NOME.zip" -d "$LIMPO"
(cd "$LIMPO/$NOME" && npm ci --silent && npm run build --silent && npm test 2>&1 | grep -E "^Tests:|^Test Suites:")
ls "$LIMPO/$NOME" | tr '\n' ' '; echo
echo "Tamanho do zip: $(du -h "$OUT/$NOME.zip" | cut -f1)"
rm -rf "$LIMPO"
echo "Pronto: $OUT"

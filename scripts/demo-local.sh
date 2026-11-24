#!/usr/bin/env bash
# Demonstracao local do pipeline de Aceitacao (plano B quando o CI ou a rede falham):
# constroi a imagem, sobe o conteiner, confere /health e roda os testes de aceitacao contra ele.
# Nao publica nada e nao usa secrets. Requisitos: Docker em execucao, Node 20+ e npm ci ja feito.
# Uso: ./scripts/demo-local.sh        (PORTA=3000 por padrao; troque com PORTA=3100 ./scripts/demo-local.sh)
set -euo pipefail
cd "$(dirname "$0")/.."

PORTA="${PORTA:-3000}"
NOME="demo-tp-gerencia-config"
IMAGEM="tp-gerencia-config:demo"
VERSAO="$(node -p "require('./package.json').version")"

command -v docker >/dev/null || { echo "ERRO: docker nao encontrado." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "ERRO: o Docker nao esta em execucao (abra o Docker Desktop)." >&2; exit 1; }
[ -d node_modules ] || { echo "ERRO: rode 'npm ci' antes." >&2; exit 1; }

limpar() { docker rm -f "$NOME" >/dev/null 2>&1 || true; }
trap limpar EXIT
limpar

echo "[1/4] Build da imagem $IMAGEM (versao $VERSAO)"
docker build -q -t "$IMAGEM" --build-arg APP_VERSION="$VERSAO" --build-arg VCS_REF="$(git rev-parse HEAD 2>/dev/null || echo local)" .
echo "      ID da imagem: $(docker image inspect "$IMAGEM" --format '{{.Id}}')"

echo "[2/4] Subindo o conteiner na porta $PORTA"
docker run -d --name "$NOME" -p "$PORTA:3000" "$IMAGEM" >/dev/null

echo "[3/4] Aguardando /health"
for i in $(seq 1 20); do
  if RESP="$(curl -fsS "http://localhost:$PORTA/health" 2>/dev/null)"; then break; fi
  sleep 2
done
[ -n "${RESP:-}" ] || { echo "ERRO: a aplicacao nao respondeu." >&2; docker logs "$NOME" >&2; exit 1; }
echo "      /health -> $RESP"

echo "[4/4] Testes de aceitacao contra o conteiner (EXPECTED_VERSION=$VERSAO)"
BASE_URL="http://localhost:$PORTA" EXPECTED_VERSION="$VERSAO" npm run test:acceptance
echo "OK: aceitacao passou contra a imagem local."

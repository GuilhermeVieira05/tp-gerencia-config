#!/usr/bin/env bash
# Script de implantacao: publica no Render a imagem Docker ja publicada no GHCR
# e confirma que a aplicacao responde em /health.
#
# Uso:
#   RENDER_DEPLOY_HOOK_URL=<url> RENDER_APP_URL=<url> ./scripts/deploy.sh ghcr.io/<dono>/<repo>:<versao>
#
# Variaveis:
#   RENDER_DEPLOY_HOOK_URL  (obrigatoria) deploy hook do Render; vem de secret do CI, nunca do codigo
#   RENDER_APP_URL          (opcional)    URL publica; se vazia, pula a verificacao pos-deploy
#   HEALTH_RETRIES          (opcional)    tentativas de health-check, padrao 30
#   HEALTH_INTERVAL         (opcional)    segundos entre tentativas, padrao 10
#
# E o mesmo script usado pela Etapa de Lancamento do pipeline (.github/workflows/pipeline.yml).
set -euo pipefail

IMAGE="${1:-}"
if [ -z "$IMAGE" ]; then
  echo "Uso: $0 <imagem:tag>" >&2
  exit 2
fi
if [ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]; then
  echo "ERRO: RENDER_DEPLOY_HOOK_URL nao configurada." >&2
  exit 1
fi

echo "[1/2] Implantando $IMAGE no Render"
# imgURL faz o Render implantar exatamente a versao recem-publicada
curl -fsS -X POST -G "$RENDER_DEPLOY_HOOK_URL" --data-urlencode "imgURL=$IMAGE" >/dev/null
echo "Deploy solicitado."

if [ -z "${RENDER_APP_URL:-}" ]; then
  echo "[2/2] RENDER_APP_URL vazia: verificacao pos-deploy ignorada."
  exit 0
fi

echo "[2/2] Verificando ${RENDER_APP_URL}/health"
for i in $(seq 1 "${HEALTH_RETRIES:-30}"); do
  if curl -fsS "${RENDER_APP_URL}/health"; then
    echo
    echo "OK: aplicacao respondeu na tentativa $i."
    exit 0
  fi
  sleep "${HEALTH_INTERVAL:-10}"
done
echo "ERRO: aplicacao nao respondeu em ${RENDER_APP_URL}/health" >&2
exit 1

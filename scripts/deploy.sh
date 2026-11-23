#!/usr/bin/env bash
# Script de implantacao: publica no Render a imagem Docker ja publicada no GHCR
# e confirma que a VERSAO implantada e a esperada, consultando /health.
#
# Uso:
#   RENDER_DEPLOY_HOOK_URL=<url> RENDER_APP_URL=<url> ./scripts/deploy.sh ghcr.io/<dono>/<repo>:<versao>
#
# Variaveis:
#   RENDER_DEPLOY_HOOK_URL  (obrigatoria) deploy hook do Render; vem de secret do CI, nunca do codigo
#   RENDER_APP_URL          (obrigatoria) URL publica da aplicacao; vem de variavel do CI
#   SKIP_HEALTH_CHECK       (opcional)    "1" dispensa a verificacao pos-deploy (uso local; nunca no pipeline)
#   HEALTH_RETRIES          (opcional)    tentativas de verificacao, padrao 30
#   HEALTH_INTERVAL         (opcional)    segundos entre tentativas, padrao 10
#   DEPLOY_TIMEOUT          (opcional)    segundos maximos da chamada ao deploy hook, padrao 30
#   HEALTH_TIMEOUT          (opcional)    segundos maximos de cada consulta a /health, padrao 10
#
# A verificacao passa somente quando /health responde com "version" igual a tag da imagem
# (parte depois do ultimo ":"). Uma instancia antiga, que nao informa a versao ou informa
# outra, nao conta como sucesso.
# E o mesmo script usado pela Etapa de Lancamento do pipeline (.github/workflows/pipeline.yml).
set -euo pipefail

IMAGE="${1:-}"
if [ -z "$IMAGE" ]; then
  echo "Uso: $0 <imagem:tag>" >&2
  exit 2
fi
# A tag e o que vem depois do ultimo ":" do NOME da imagem (depois da ultima "/"), para que
# um registro com porta (localhost:5000/repo) sem tag seja recusado.
case "${IMAGE##*/}" in
  *@*) echo "ERRO: referencia por digest (@sha256:...) nao e suportada; use a tag da versao (ex.: ghcr.io/dono/repo:1.2.3)." >&2; exit 2 ;;
  *:?*) ;;
  *) echo "ERRO: informe a imagem com tag (ex.: ghcr.io/dono/repo:1.2.3)." >&2; exit 2 ;;
esac
EXPECTED_VERSION="${IMAGE##*:}"
[ -n "$EXPECTED_VERSION" ] || { echo "ERRO: tag vazia em '$IMAGE'." >&2; exit 2; }

if [ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]; then
  echo "ERRO: RENDER_DEPLOY_HOOK_URL nao configurada." >&2
  exit 1
fi
if [ -z "${RENDER_APP_URL:-}" ] && [ "${SKIP_HEALTH_CHECK:-0}" != "1" ]; then
  echo "ERRO: RENDER_APP_URL nao configurada; sem ela nao ha como confirmar a versao implantada." >&2
  echo "      (para dispensar a verificacao em uso local: SKIP_HEALTH_CHECK=1)" >&2
  exit 1
fi

echo "[1/2] Implantando $IMAGE no Render"
# imgURL faz o Render implantar exatamente a versao recem-publicada
curl -fsS --max-time "${DEPLOY_TIMEOUT:-30}" -X POST -G "$RENDER_DEPLOY_HOOK_URL" \
  --data-urlencode "imgURL=$IMAGE" >/dev/null
echo "Deploy solicitado."

if [ "${SKIP_HEALTH_CHECK:-0}" = "1" ]; then
  echo "[2/2] SKIP_HEALTH_CHECK=1: verificacao pos-deploy dispensada."
  exit 0
fi

URL="${RENDER_APP_URL%/}/health"
echo "[2/2] Aguardando $URL informar a versao $EXPECTED_VERSION"
for i in $(seq 1 "${HEALTH_RETRIES:-30}"); do
  BODY="$(curl -fsS --max-time "${HEALTH_TIMEOUT:-10}" "$URL" 2>/dev/null || true)"
  ATUAL="$(printf '%s' "$BODY" | sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p')"
  if [ "$ATUAL" = "$EXPECTED_VERSION" ]; then
    echo "OK: versao $ATUAL respondeu na tentativa $i."
    exit 0
  fi
  echo "Tentativa $i: versao atual '${ATUAL:-sem resposta}', esperada '$EXPECTED_VERSION'."
  sleep "${HEALTH_INTERVAL:-10}"
done
echo "ERRO: $URL nao informou a versao $EXPECTED_VERSION no tempo previsto." >&2
exit 1

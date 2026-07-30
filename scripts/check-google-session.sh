#!/usr/bin/env bash
# Health check diário da sessão Google do meeting-bot (cron no host do VPS).
# Roda check-google-session.js dentro do container; se a sessão caiu ou a
# infra está fora, empurra um payload sintético pra fila de falhas que o
# backend meta-ads já drena a cada 2min → alerta a equipe no Telegram.
# Nenhum código novo de notificação: reusa a Fase 4 (alert_bot_failure).
set -uo pipefail

BOT_CONTAINER="${BOT_CONTAINER:-meeting-bot-meeting-bot-1}"
REDIS_CONTAINER="${REDIS_CONTAINER:-meta-ads-redis-1}"
FAILURES_LIST="${FAILURES_LIST:-jobs:meetbot:failures}"
REDIS_DB="${REDIS_DB:-2}"

out=$(docker exec "$BOT_CONTAINER" node scripts/check-google-session.js 2>&1)
rc=$?

if [ "$rc" -eq 0 ]; then
  echo "$out"
  exit 0
fi

# Container do bot fora do ar também cai aqui (docker exec falha) — mesmo alerta.
msg=$(echo "$out" | tail -1 | tr -d '"')
payload=$(printf '{"recordingId":"healthcheck-%s","meetingLink":null,"metadata":{"botId":"healthcheck"},"error":{"type":"HealthCheck","message":"HEALTH CHECK do meeting-bot falhou: %s — reunioes novas NAO serao gravadas. Relogar bot@agenciamutuo.tech no chrome-cdp (ver meeting-bot/scripts/check-google-session.js)."}}' \
  "$(date +%Y%m%d-%H%M)" "$msg")

docker exec "$REDIS_CONTAINER" redis-cli -n "$REDIS_DB" rpush "$FAILURES_LIST" "$payload" >/dev/null \
  && echo "alerta enfileirado ($FAILURES_LIST): $msg" \
  || echo "ERRO: não consegui enfileirar o alerta: $msg" >&2

exit "$rc"

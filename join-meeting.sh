#!/bin/bash
# Uso: ./join-meeting.sh <meet-url> <nome-da-reuniao> <event-id>
# Le o JOIN_AUTH_TOKEN do .env local (nunca inline), loga resposta em join-<event-id>.log
set -euo pipefail
cd "$(dirname "$0")"

MEET_URL="${1:?uso: join-meeting.sh <meet-url> <nome> <event-id>}"
NAME="${2:?nome obrigatorio}"
EVENT_ID="${3:?event-id obrigatorio}"

TOKEN=$(grep -E '^JOIN_AUTH_TOKEN=' .env | cut -d= -f2-)
LOG="join-${EVENT_ID}.log"

{
  echo "[$(date -Iseconds)] disparando join para '${NAME}' (${MEET_URL})"
  RESPONSE=$(curl -sS -w '\nHTTP_STATUS:%{http_code}' -X POST http://127.0.0.1:3000/google/join     -H 'Content-Type: application/json'     -d "{\"bearerToken\":\"${TOKEN}\",\"url\":\"${MEET_URL}\",\"name\":\"${NAME}\",\"teamId\":\"mutuo\",\"timezone\":\"America/Sao_Paulo\",\"userId\":\"isabela\",\"eventId\":\"${EVENT_ID}\"}")
  echo "${RESPONSE}"
  echo "[$(date -Iseconds)] fim"
} >> "${LOG}" 2>&1

tail -5 "${LOG}"

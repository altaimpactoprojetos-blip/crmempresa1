#!/usr/bin/env bash
# Backup lógico do banco (pg_dump em formato custom, comprimido).
# Uso: npm run backup            -> gera backups/crm-AAAAMMDD-HHMMSS.dump
# Agende no cron, por exemplo diariamente às 02h:
#   0 2 * * * cd /caminho/do/crm && npm run backup >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
# Carrega o .env somente se DATABASE_URL não vier do ambiente (permite apontar para outro banco)
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then set -a; . ./.env; set +a; fi
: "${DATABASE_URL:?DATABASE_URL não definida}"
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="backups/crm-${STAMP}.dump"
pg_dump --format=custom --no-owner --no-privileges --file="$OUT" "$DATABASE_URL"
echo "Backup gerado: $OUT ($(du -h "$OUT" | cut -f1))"
# Retenção: mantém os últimos 30 arquivos
ls -1t backups/crm-*.dump 2>/dev/null | tail -n +31 | xargs -r rm -f

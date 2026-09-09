#!/usr/bin/env bash
# Restaura um backup gerado por scripts/backup.sh.
# Uso: npm run restore -- backups/crm-AAAAMMDD-HHMMSS.dump
# ATENÇÃO: substitui todos os dados do banco de destino (DATABASE_URL).
set -euo pipefail
cd "$(dirname "$0")/.."
# Carrega o .env somente se DATABASE_URL não vier do ambiente (permite apontar para outro banco)
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then set -a; . ./.env; set +a; fi
: "${DATABASE_URL:?DATABASE_URL não definida}"
FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then echo "Informe o arquivo de backup. Ex.: npm run restore -- backups/crm-20250101-020000.dump"; exit 1; fi
if [ "${CONFIRM:-}" != "sim" ]; then
  read -r -p "Isso vai SUBSTITUIR os dados atuais do banco. Digite 'sim' para continuar: " ANS
  [ "$ANS" = "sim" ] || { echo "Cancelado."; exit 1; }
fi
echo "Pare o servidor do CRM antes de restaurar para evitar gravações concorrentes."
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DATABASE_URL" "$FILE"
echo "Restauração concluída. Reinicie o servidor."

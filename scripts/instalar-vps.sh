#!/usr/bin/env bash
# Instala (ou atualiza) o CRM em um servidor Ubuntu 22.04/24.04 limpo: AWS EC2, Lightsail ou qualquer VPS.
#
# Instala Node.js 22, PostgreSQL, Caddy (HTTPS automático), cria swap, banco, .env com segredos
# aleatórios, serviço systemd e backup diário. Pode ser executado de novo para atualizar o CRM.
#
# Uso (como root):
#   ADMIN_EMAIL=voce@empresa.com ADMIN_SENHA='senha-forte' bash instalar-vps.sh
#
# Variáveis:
#   ADMIN_EMAIL, ADMIN_SENHA  primeiro administrador (obrigatórias só na primeira instalação)
#   ADMIN_NOME                nome do administrador (padrão: Administrador)
#   ADMIN_EMPRESA             nome da primeira empresa (padrão: Minha Empresa)
#   PLATAFORMA_EMAIL, PLATAFORMA_SENHA  cria (ou troca a senha do) acesso ao painel /plataforma (opcional)
#   DOMINIO                   ex.: crm.empresa.com.br — com domínio o Caddy ativa HTTPS; sem ele, HTTP pelo IP
#   REPO_URL, BRANCH          origem do código (padrão: repositório oficial, branch padrão)
#
# Log completo: /var/log/crm-instalacao.log
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/altaimpactoprojetos-blip/crmempresa1.git}"
BRANCH="${BRANCH:-}"
DOMINIO="${DOMINIO:-}"
ADMIN_NOME="${ADMIN_NOME:-Administrador}"
ADMIN_EMPRESA="${ADMIN_EMPRESA:-Minha Empresa}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_SENHA="${ADMIN_SENHA:-}"
PLATAFORMA_EMAIL="${PLATAFORMA_EMAIL:-}"
PLATAFORMA_SENHA="${PLATAFORMA_SENHA:-}"

APP_USER=crm
APP_HOME=/opt/crm
APP_DIR=$APP_HOME/app
DB_NAME=crm
DB_USER=crm

exec > >(tee -a /var/log/crm-instalacao.log) 2>&1
passo() { echo; echo "==> $*"; }
falha() { echo "ERRO: $*" >&2; exit 1; }
como_app() { sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $*"; }

[ "$(id -u)" -eq 0 ] || falha "execute como root (sudo)."
command -v apt-get >/dev/null || falha "este script é para Ubuntu/Debian."
export DEBIAN_FRONTEND=noninteractive

passo "Pacotes do sistema"
apt-get update -q
apt-get install -y -q git curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https postgresql cron

# O serviço usa /usr/bin/node, então é essa instalação que precisa estar na versão 22 ou superior.
if [ ! -x /usr/bin/node ] || [ "$(/usr/bin/node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  passo "Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
fi

if ! command -v caddy >/dev/null; then
  passo "Caddy (servidor web com HTTPS automático)"
  # Ubuntu 24.04 já traz o Caddy; nas versões anteriores, usa o repositório oficial do projeto.
  if ! apt-get install -y -q caddy; then
    curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -q
    apt-get install -y -q caddy
  fi
fi

# Máquinas pequenas (1 GB de RAM) precisam de swap para não travar em picos de memória.
if ! swapon --show | grep -q .; then
  passo "Swap de 2 GB"
  if fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile; then
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  else
    rm -f /swapfile
    echo "Aviso: não foi possível criar o swap (seguindo sem ele)."
  fi
fi

passo "Usuário do sistema e código"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$APP_HOME" --shell /bin/bash "$APP_USER"
if [ -d "$APP_DIR/.git" ]; then
  como_app "git pull --ff-only"
else
  sudo -u "$APP_USER" -H git clone ${BRANCH:+--branch "$BRANCH"} "$REPO_URL" "$APP_DIR"
fi

passo "Banco de dados"
systemctl enable --now postgresql
if [ ! -f "$APP_DIR/.env" ]; then
  DB_PASS="$(openssl rand -hex 24)"
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1; then
    sudo -u postgres psql -qc "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
  else
    sudo -u postgres psql -qc "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
  fi
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 ||
    sudo -u postgres psql -qc "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

  if [ -n "$DOMINIO" ]; then
    APP_URL="https://$DOMINIO"
    COOKIE_SECURE=true
  else
    IP="$(curl -fsS --max-time 5 https://checkip.amazonaws.com | tr -d '[:space:]' || true)"
    APP_URL="http://${IP:-localhost}"
    COOKIE_SECURE=false
  fi

  passo "Arquivo .env (segredos gerados automaticamente)"
  sed \
    -e "s|^APP_URL=.*|APP_URL=$APP_URL|" \
    -e "s|^DATABASE_URL=.*|DATABASE_URL=postgres://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME|" \
    -e "s|^SESSION_SECRET=.*|SESSION_SECRET=$(openssl rand -hex 48)|" \
    -e "s|^COOKIE_SECURE=.*|COOKIE_SECURE=$COOKIE_SECURE|" \
    -e "s|^NODE_ENV=.*|NODE_ENV=production|" \
    "$APP_DIR/.env.example" > "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
fi

passo "Dependências e migrações"
como_app "npm ci --omit=dev --no-audit --no-fund"
como_app "npm run migrate"

ADMINS="$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT count(*) FROM users WHERE role = 'admin' AND active")"
if [ "$ADMINS" = "0" ]; then
  [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_SENHA" ] || falha "informe ADMIN_EMAIL e ADMIN_SENHA para criar o primeiro administrador."
  passo "Primeiro administrador"
  sudo -u "$APP_USER" -H env ADMIN_COMPANY="$ADMIN_EMPRESA" ADMIN_NAME="$ADMIN_NOME" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_SENHA" \
    bash -c "cd '$APP_DIR' && npm run create-admin"
fi

if [ -n "$PLATAFORMA_EMAIL" ] && [ -n "$PLATAFORMA_SENHA" ]; then
  passo "Acesso ao painel da plataforma"
  sudo -u "$APP_USER" -H env PLATFORM_NAME="Dono da plataforma" PLATFORM_EMAIL="$PLATAFORMA_EMAIL" PLATFORM_PASSWORD="$PLATAFORMA_SENHA" \
    bash -c "cd '$APP_DIR' && npm run create-platform-admin"
fi

passo "Serviço do CRM (systemd)"
cat > /etc/systemd/system/crm.service <<EOF
[Unit]
Description=CRM de Atendimento
After=network.target postgresql.service

[Service]
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=3
User=$APP_USER
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable crm
systemctl restart crm

passo "Caddy (proxy reverso)"
SITE="${DOMINIO:-:80}"
cat > /etc/caddy/Caddyfile <<EOF
$SITE {
  encode gzip
  reverse_proxy 127.0.0.1:3000 {
    # Entrega imediata dos eventos em tempo real (fila de atendimento)
    flush_interval -1
  }
}
EOF
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

passo "Backup diário às 02h"
CRON_LINE="0 2 * * * cd $APP_DIR && npm run backup >> backups/backup.log 2>&1"
(crontab -u "$APP_USER" -l 2>/dev/null | grep -v 'npm run backup' || true; echo "$CRON_LINE") | crontab -u "$APP_USER" -

passo "Verificando"
for _ in $(seq 1 20); do
  curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS http://127.0.0.1:3000/api/health >/dev/null || falha "o CRM não respondeu. Veja: journalctl -u crm -n 50"

echo
echo "CRM instalado e em execução."
echo "Acesse: $(grep '^APP_URL=' "$APP_DIR/.env" | cut -d= -f2-)"
echo "Logs: journalctl -u crm -f    |    Atualizar: execute este script novamente."

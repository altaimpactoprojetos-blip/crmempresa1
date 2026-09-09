# Guia de instalação e operação

## 1. Banco de dados PostgreSQL

Crie um usuário e um banco dedicados (troque a senha):

```sql
CREATE USER crm WITH PASSWORD 'senha-forte';
CREATE DATABASE crm OWNER crm;
```

Em Ubuntu/Debian: `sudo -u postgres psql` e execute os comandos acima. Para bancos gerenciados (RDS, Cloud SQL etc.), use a URL fornecida e defina `DATABASE_SSL=true`.

## 2. Configuração (`.env`)

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | `postgres://usuario:senha@host:5432/banco` |
| `DATABASE_SSL` | não | `true` quando o provedor exige SSL |
| `SESSION_SECRET` | sim | Valor aleatório longo. Gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SESSION_HOURS` | não | Duração da sessão (padrão 12h) |
| `APP_URL` | sim | URL pública (usada nos links de recuperação de senha e webhook) |
| `PORT` | não | Porta HTTP (padrão 3000) |
| `COOKIE_SECURE` | produção | `true` quando servido por HTTPS |
| `NODE_ENV` | produção | `production` |
| `SMTP_*`, `MAIL_FROM` | não | Envio do e-mail de recuperação de senha |
| `WHATSAPP_*` | não | Integração com a API oficial do WhatsApp |

O arquivo `.env` **não deve ser versionado** (já está no `.gitignore`). Em produção o servidor se recusa a iniciar com o `SESSION_SECRET` de exemplo.

## 3. Migrações e primeiro administrador

```bash
npm install --omit=dev
npm run migrate
npm run create-admin
```

`create-admin` pergunta nome, e-mail e senha (a digitação da senha fica oculta). Para automação: `ADMIN_NAME="Nome" ADMIN_EMAIL=admin@empresa.com ADMIN_PASSWORD='senha-forte' npm run create-admin`. A senha é armazenada apenas como hash bcrypt.

Depois do login, vá em **Configurações › Empresa** (nome, logotipo, cores, distribuição automática) e **Configurações › Usuários** para cadastrar a equipe.

## 4. Executar em produção

Recomenda-se rodar atrás de um proxy reverso com HTTPS (Nginx/Caddy) e como serviço.

Exemplo `systemd` (`/etc/systemd/system/crm.service`):

```ini
[Unit]
Description=CRM de Atendimento
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/crm
ExecStart=/usr/bin/node src/server.js
Restart=always
User=crm
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now crm
```

Exemplo Nginx:

```nginx
server {
  server_name crm.empresa.com.br;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;   # necessário para as atualizações em tempo real (SSE)
    proxy_read_timeout 1h;
  }
}
```

Defina `COOKIE_SECURE=true` e `APP_URL=https://crm.empresa.com.br`. O app usa `trust proxy`, então o IP registrado na auditoria vem do cabeçalho `X-Forwarded-For`.

O sistema roda em um único processo (as notificações em tempo real são em memória). Para uma equipe de 10 pessoas isso é suficiente; não execute múltiplas instâncias sem um mecanismo compartilhado de eventos.

## 5. Recuperação de senha

- **Com SMTP configurado**: o usuário clica em "Esqueci minha senha" e recebe o link por e-mail (válido por 1 hora).
- **Sem SMTP**: o link é gravado no log do servidor, e o administrador pode gerar um link em **Configurações › Usuários › Senha** e enviá-lo por um canal seguro.

## 6. WhatsApp (API oficial, opcional)

1. Crie um app no Meta for Developers com o produto WhatsApp e obtenha o *Phone Number ID* e um token permanente.
2. Preencha `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` (valor à sua escolha) e `WHATSAPP_APP_SECRET` no `.env` e reinicie.
3. No painel da Meta, configure o webhook para `https://SEU_DOMINIO/api/whatsapp/webhook` com o mesmo *verify token* e assine o campo `messages`.

Mensagens recebidas são associadas ao cliente pelo telefone e ao atendimento aberto mais recente. Sem credenciais, a tela **Configurações › Integrações** mostra "Desconectado" e nada é simulado.

## 7. Backup e restauração

- `npm run backup` gera `backups/crm-AAAAMMDD-HHMMSS.dump` (`pg_dump` formato custom, comprimido) e mantém os 30 mais recentes.
- Agende no cron: `0 2 * * * cd /opt/crm && npm run backup >> backups/backup.log 2>&1`
- Copie a pasta `backups/` para um local externo (outro servidor, storage em nuvem).

**Restauração** (substitui todos os dados do banco em `DATABASE_URL`):

```bash
sudo systemctl stop crm
npm run restore -- backups/crm-20250101-020000.dump   # digite "sim" para confirmar (ou CONFIRM=sim)
sudo systemctl start crm
```

Para restaurar em outro servidor, crie o banco vazio, configure o `.env` e execute o `restore` — as migrações já estão contidas no dump.

## 8. Atualizações

```bash
git pull
npm install --omit=dev
npm run migrate      # aplica apenas as migrações novas
sudo systemctl restart crm
```

## 9. Nova instalação para outro cliente

Repita os passos 1 a 4 em um servidor/banco separado. Toda a identidade (nome, logotipo, cores), canais, origens e etapas do funil são definidos pela interface, em **Configurações**. Não há dados de empresa no código.

## 10. Modo de demonstração

`npm run seed:demo` insere dados fictícios e ativa o banner de demonstração. Use apenas em ambientes de teste/apresentação. Para voltar a um banco limpo: `DROP DATABASE`/`CREATE DATABASE` + `npm run migrate` + `npm run create-admin`, ou restaure um backup.

## 11. Solução de problemas

| Sintoma | Causa provável |
|---|---|
| "Banco sem migrações aplicadas" | Execute `npm run migrate`. |
| "Nenhum administrador ativo" | Execute `npm run create-admin`. |
| Login não persiste / cookie rejeitado | `COOKIE_SECURE=true` sem HTTPS, ou proxy sem `X-Forwarded-Proto`. |
| Fila não atualiza sozinha | Proxy com buffering ativo; use `proxy_buffering off` para `/api/notifications/stream`. |
| "Requisição inválida (cabeçalho de proteção ausente)" | Chamada à API sem o cabeçalho `X-Requested-With: fetch` (proteção CSRF). |

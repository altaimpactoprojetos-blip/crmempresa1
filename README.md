# CRM de Atendimento

CRM de nível intermediário para equipes de atendimento de até ~10 pessoas trabalhando simultaneamente. Interface em português do Brasil, backend próprio em Node.js e banco PostgreSQL.

**Módulos:** Dashboard · Clientes · Atendimentos (fila, protocolo, rodízio) · Funil comercial (Kanban) · Tarefas e retornos · Relatórios · Configurações (identidade visual, usuários, funil, integrações, backup, auditoria).

## Requisitos

- Node.js 18 ou superior (testado com 22)
- PostgreSQL 13 ou superior (testado com 16), com `pg_dump`/`pg_restore` para backups

## Instalação rápida

```bash
git clone <este-repositorio> crm && cd crm
npm install
cp .env.example .env          # edite DATABASE_URL, SESSION_SECRET e APP_URL
npm run migrate               # cria as tabelas
npm run create-admin          # cria o primeiro administrador (interativo)
npm start                     # http://localhost:3000
```

Instruções completas (criação do banco, produção com HTTPS, serviço systemd, SMTP, WhatsApp): **[docs/INSTALACAO.md](docs/INSTALACAO.md)**.

## Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| Administrador | Tudo: configurações da empresa, usuários, funil, integrações, auditoria. |
| Supervisor | Acompanha toda a equipe, relatórios completos, redistribui/transfere atendimentos, importa clientes. |
| Atendente | Clientes e atendimentos sob sua responsabilidade + fila compartilhada (sem responsável). Relatórios apenas dos próprios números. |

As permissões são validadas no servidor em todas as rotas. Usuários podem ser **desativados sem perder histórico**, com transferência obrigatória das pendências para outro responsável.

## Fluxo de atendimento

1. Cadastrar o cliente (aviso de duplicidade por telefone/e-mail).
2. Abrir atendimento → recebe protocolo único (`AAAAMMDD-000001`) e entra na **fila de espera**.
3. Um atendente **assume** o atendimento (operação atômica: duas pessoas não conseguem assumir o mesmo) ou o supervisor **distribui em rodízio** entre atendentes disponíveis. Sem ninguém disponível, o atendimento permanece na fila.
4. Registrar interações (a primeira interação de saída define a **primeira resposta**), anotações internas, agendar retorno (gera tarefa), transferir, devolver à fila.
5. Encerrar como **Resolvido** ou **Cancelado**; pode ser reaberto. O status do atendimento é independente da etapa comercial no funil.

A fila é atualizada em tempo real entre os usuários (Server-Sent Events) e todas as transferências e mudanças de status ficam registradas na linha do tempo com o autor.

## Indicadores (como são calculados)

- **Tempo médio de 1ª resposta**: da abertura até a primeira interação de saída registrada; só entram atendimentos que já têm resposta.
- **Tempo médio de resolução**: da abertura até o encerramento com status Resolvido, para atendimentos encerrados no período.
- **Taxa de conversão**: ganhos ÷ (ganhos + perdidos) entre oportunidades encerradas no período.
- Atendimentos são filtrados pela data de abertura; resolvidos/ganhos/perdidos pela data de encerramento.

## WhatsApp

- O botão **Abrir WhatsApp** apenas abre a conversa no aplicativo (`wa.me`). Ele **não sincroniza mensagens** com o CRM; registre as interações manualmente no atendimento.
- A integração com a **API oficial (Meta Cloud API)** é opcional. Sem `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`, ela aparece como *Desconectada* e nenhum envio é simulado. Com credenciais, envios e recebimentos (via webhook) ficam gravados no histórico do cliente/atendimento.

## Segurança

Senhas com bcrypt (custo 12) · sessões em PostgreSQL com cookie `HttpOnly`/`SameSite` · cabeçalho anti-CSRF obrigatório em requisições mutáveis · limitação de tentativas de login · validação de dados no servidor (zod) · registro de auditoria das ações importantes · controle de versão otimista (evita sobrescrever alterações simultâneas) · credenciais somente em variáveis de ambiente (`.env` não versionado) · cabeçalhos de segurança e CSP (helmet).

## Backup e restauração

```bash
npm run backup                                    # gera backups/crm-AAAAMMDD-HHMMSS.dump
npm run restore -- backups/crm-20250101-020000.dump   # substitui o banco atual (pede confirmação)
```

Agende no cron (ex.: `0 2 * * * cd /caminho/do/crm && npm run backup >> backups/backup.log 2>&1`) e copie os arquivos para armazenamento externo.

## Modo de demonstração

`npm run seed:demo` cria dados **fictícios** (clientes, atendimentos, oportunidades, tarefas e usuários `*@demo.local` com senha `Demo12345`) e ativa um banner "Modo de demonstração" em todas as telas. Não use em produção; para limpar, recrie o banco ou restaure um backup limpo.

## Reutilizar para outro cliente (nova instalação)

Cada instalação é independente: novo banco, novo `.env`, e em **Configurações › Empresa** define-se nome, logotipo e cores. Canais, origens de contato e etapas do funil também são configuráveis pela interface. Não há nada específico de uma empresa no código.

## Testes

```bash
createdb crm_test            # ou: CREATE DATABASE crm_test OWNER crm;
npm test                     # usa DATABASE_URL_TEST (padrão postgres://crm:crm@localhost:5432/crm_test)
```

Os testes de integração cobrem o fluxo completo (cliente → atendimento → assumir → interação → oportunidade → retorno → transferência → encerramento), permissões entre perfis, disputa simultânea pelo mesmo atendimento, rodízio, desativação de usuário, recuperação de senha, importação CSV, controle de versão e relatórios.

## Estrutura

```
src/
  server.js, app.js        # servidor Express, sessões, segurança
  config.js, db.js         # variáveis de ambiente e pool PostgreSQL
  migrations/*.sql         # esquema do banco (aplicado por npm run migrate)
  routes/                  # auth, users, settings, customers, tickets, pipeline, tasks, reports, notifications, whatsapp
  middleware/, lib/        # autenticação/permissões, validação, auditoria, tempo real, e-mail
public/                    # frontend (SPA sem build): index.html, css/, js/
scripts/                   # migrate, create-admin, seed-demo, backup.sh, restore.sh
tests/                     # testes de integração (node:test)
docs/INSTALACAO.md         # guia detalhado de instalação e operação
```

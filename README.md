# CRM de Atendimento

CRM de nível intermediário para equipes de atendimento de até ~10 pessoas trabalhando simultaneamente. Interface em português do Brasil, backend próprio em Node.js e banco PostgreSQL.

**Módulos:** Dashboard · Clientes · Atendimentos (fila, protocolo, rodízio) · Funis comerciais (Kanban, vários por empresa) · Campos personalizados · Automações do funil · Tarefas e retornos · Relatórios · Configurações (identidade visual, usuários, funil, integrações, backup, auditoria).

## Requisitos

- Node.js 20.10 ou superior (testado com 22)
- PostgreSQL 15 ou superior (testado com 16), com `pg_dump`/`pg_restore` para backups

## Instalação rápida

```bash
git clone <este-repositorio> crm && cd crm
npm install
cp .env.example .env          # edite DATABASE_URL, SESSION_SECRET e APP_URL
npm run migrate               # cria as tabelas
npm run create-admin          # cria uma empresa e o seu administrador (interativo)
npm start                     # http://localhost:3000
```

Instruções completas (criação do banco, produção com HTTPS, serviço systemd, SMTP, WhatsApp): **[docs/INSTALACAO.md](docs/INSTALACAO.md)**.

## SaaS: várias empresas no mesmo servidor

Cada empresa-cliente cria a sua conta em **Criar conta grátis** (tela de login), recebe um período de teste (`TRIAL_DAYS`, padrão 14 dias), o seu próprio funil, configurações, identidade visual e equipe. Os dados de cada empresa ficam isolados pelo próprio PostgreSQL (Row Level Security) — detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md#multiempresa-saas).

| Variável | Uso |
|---|---|
| `APP_NAME` | Nome do produto na tela de login e de cadastro |
| `ALLOW_SIGNUP` | `false` desativa o cadastro público (empresas criadas só por `npm run create-admin`) |
| `TRIAL_DAYS` | Dias de teste para novas empresas |

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

## WhatsApp: caixa de entrada (estilo Kommo)

Cada empresa conecta o **próprio número** em **Configurações › WhatsApp**, de dois jeitos:

| | **QR Code** (como o WhatsApp Web) | **API oficial da Meta** (recomendado) |
|---|---|---|
| Como conecta | Lê o QR com o celular (Aparelhos conectados) | Token do Meta Business, passo a passo na tela |
| Risco de bloqueio do número | **Existe** (uso não oficial; aviso exibido na tela) | Não |
| Janela de 24h / modelos | Não se aplica | Sim |
| Fotos e áudios | Ficam no celular/WhatsApp; o CRM só guarda a referência criptografada e busca quando alguém abre | Buscados na Meta quando alguém abre |
| Mensagens enviadas pelo celular | Aparecem no CRM | — |

A conexão por QR usa a biblioteca de código aberto [Baileys](https://github.com/WhiskeySockets/Baileys). A sessão fica no banco, criptografada, e é retomada automaticamente quando o servidor reinicia. Grupos, status e canais são ignorados.

- **Conversas**: lista à esquerda, chat à direita, em tempo real. Filtros Abertas, Minhas, Sem responsável, Não lidas e Encerradas.
- **Contato novo vira cliente e oportunidade** na primeira etapa do funil automaticamente (desativável em Configurações › Empresa). Celulares brasileiros sem o 9 extra são ligados ao cliente já cadastrado.
- **Responsável**: conversas sem responsável ficam numa fila compartilhada; quem responde primeiro assume. Supervisores transferem.
- **Janela de 24 horas** da Meta: depois de 24h sem mensagem do cliente, o CRM oferece os **modelos aprovados** da conta (com variáveis).
- **Respostas rápidas** (`/atalho`, com `{nome}`), **anotações internas** (nunca enviadas ao cliente), mudança de etapa do funil e status de entrega (enviada, entregue, lida, falhou).
- Imagens, áudios, vídeos e documentos recebidos são exibidos no chat, baixados da Meta sob demanda.
- Segurança: tokens e sessões guardados criptografados (`ENCRYPTION_KEY`), URL de webhook secreta por número e verificação da assinatura da Meta (App Secret).

Sem número conectado, nada é enviado nem simulado; o botão do cliente oferece abrir o WhatsApp no aplicativo.

## Funis, campos personalizados e automações

- **Vários funis** por empresa (ex.: vendas, pós-venda, parcerias), cada um com as suas etapas, em **Configurações › Funis**. O funil **principal** recebe os contatos novos do WhatsApp. No quadro, cada funil vira uma aba.
- **Campos personalizados** para clientes e oportunidades (texto, número, valor, data, lista, sim/não, link), em **Configurações › Campos personalizados**. Aparecem nos formulários e nas fichas. Excluir um campo só o tira dos formulários; os valores ficam guardados.
- **Automações**: quando uma oportunidade entra em uma etapa, rodam em ordem as ações configuradas: criar tarefa, enviar WhatsApp, definir responsável (fixo ou por rodízio), adicionar etiqueta ao cliente e avisar um usuário. Os textos aceitam `{nome}`, `{primeiro_nome}`, `{oportunidade}`, `{valor}`, `{etapa}`, `{responsavel}` e `{empresa}`. Cada execução fica no **Histórico**, com o resultado de cada ação.

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

## Desenvolvimento

```bash
npm run dev                  # servidor com recarga automática
npm run lint                 # ESLint (erros de código)
npm run format               # Prettier (formatação padronizada)
npm run check                # lint + formatação + testes — rode antes de cada commit
```

A integração contínua (`.github/workflows/ci.yml`) roda `lint`, `format:check` e os testes com PostgreSQL a cada push e pull request. Convenções de código e organização: **[docs/ARQUITETURA.md](docs/ARQUITETURA.md)**.

## Testes

```bash
createdb crm_test            # ou: CREATE DATABASE crm_test OWNER crm;
npm test                     # usa DATABASE_URL_TEST (padrão postgres://crm:crm@localhost:5432/crm_test)
```

Os testes de integração cobrem o fluxo completo (cliente → atendimento → assumir → interação → oportunidade → retorno → transferência → encerramento), permissões entre perfis, disputa simultânea pelo mesmo atendimento, rodízio, desativação de usuário, recuperação de senha, importação CSV, controle de versão, relatórios e fuso horário.

## Estrutura

```
src/
  server.js                # inicialização: verifica banco e sobe o servidor
  app.js                   # monta o Express: segurança, sessão, API, frontend, erros
  config.js, db.js         # variáveis de ambiente e pool PostgreSQL (query/tx)
  migrations/*.sql         # esquema do banco (aplicado por npm run migrate)
  routes/index.js          # registro central das rotas /api
  routes/<módulo>.js       # auth, users, settings, customers, tickets, pipeline, tasks, reports, notifications,
                           # inbox (conversas), channels (WhatsApp), quickReplies, webhooks,
                           # pipelines (funis), customFields, automations
  middleware/              # security, session, csrf, auth, validate, errorHandler
  lib/                     # errors, audit, notify, realtime, mailer, timezone, util, companies,
                           # inbox (mensagens recebidas), outbox (envio), whatsapp (API da Meta), waweb (QR Code),
                           # crypto, customFields (validação), automations (execução)
public/                    # frontend (SPA sem build): index.html, css/, js/api.js, js/ui.js, js/pages/, js/app.js
scripts/                   # migrate, create-admin, seed-demo, backup.sh, restore.sh
tests/                     # testes de integração (node:test)
docs/                      # INSTALACAO.md (operação) e ARQUITETURA.md (convenções de código)
```

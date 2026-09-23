# Arquitetura e convenções de código

Guia para manter o código do CRM organizado e consistente. Vale para qualquer pessoa (ou assistente de IA) que alterar o projeto.

## Visão geral

```
Navegador (SPA em public/)  ──fetch /api──▶  Express (src/app.js)
                                               ├─ middleware/  segurança, sessão, CSRF, usuário logado
                                               ├─ routes/      um arquivo por módulo de negócio
                                               ├─ lib/         serviços compartilhados (auditoria, notificações, tempo real, e-mail, fuso)
                                               └─ db.js        PostgreSQL (query / tx)
```

- **Backend:** Node.js + Express, CommonJS, sem ORM (SQL parametrizado com `pg`).
- **Banco:** PostgreSQL. O esquema vive em `src/migrations/NNN_descricao.sql` e é aplicado em ordem por `npm run migrate`.
- **Frontend:** SPA sem etapa de build. Scripts clássicos carregados em ordem pelo `index.html`: `api.js` → `ui.js` → `pages/*.js` → `app.js`.

## Onde colocar cada coisa

| Preciso de… | Lugar |
|---|---|
| Nova rota de um módulo existente | `src/routes/<módulo>.js` |
| Novo módulo da API | novo `src/routes/<módulo>.js` **e** registrar em `src/routes/index.js` |
| Regra reutilizada por mais de um módulo | `src/lib/<assunto>.js` |
| Algo que roda antes das rotas (autenticação, cabeçalhos) | `src/middleware/` |
| Mudança no banco | nova migração `src/migrations/NNN_*.sql` — **nunca** editar uma migração já aplicada |
| Nova tela | `public/js/pages/<tela>.js` + `<script>` no `index.html` + rota em `public/js/app.js` |
| Variável de ambiente | `src/config.js` **e** `.env.example` |

## Padrão de uma rota

```js
router.post('/', requireRole('admin', 'supervisor'), validate(schema), async (req, res, next) => {
  try {
    const d = req.data; // corpo já validado pelo zod
    const row = await tx(async (client) => { /* ... */ });
    await audit(req, 'acao', 'entidade', row.id);
    res.status(201).json({ entidade: row });
  } catch (err) {
    next(err);
  }
});
```

- **Validação:** toda entrada passa por um esquema `zod` via `validate(schema)`. Mensagens de erro em português.
- **Permissões:** checadas no servidor (`requireAuth`, `requireRole`, `isManager`) e pelo escopo SQL de cada módulo (`scopeSql`). Nunca confiar no frontend.
- **Erros:** lançar `badRequest`, `notFound`, `forbidden`, `conflict` de `src/lib/errors.js`; o `middleware/errorHandler.js` converte em resposta JSON.
- **SQL:** sempre com parâmetros (`$1`, `$2`…), nunca concatenar valores do usuário. Operações com mais de uma escrita usam `tx()`.
- **Concorrência:** registros editáveis têm coluna `version`; atualizações conferem a versão e respondem 409 se estiver desatualizada.
- **Auditoria:** ações importantes chamam `audit(req, ...)`.
- **Tempo real:** mudanças que outras telas precisam ver chamam `broadcast(evento, dados)`.

## Multiempresa (SaaS)

Um único servidor atende várias empresas. O isolamento é garantido **pelo banco**, não só pelo código:

- Toda tabela de dados tem `company_id`, preenchido automaticamente (`DEFAULT app_company_id()`).
- Políticas de **Row Level Security forçadas** (migração `003_multiempresa.sql`) só deixam ler e gravar linhas da empresa do contexto — mesmo que uma consulta esqueça o filtro.
- Chaves estrangeiras são compostas `(company_id, id)`: um registro nunca aponta para dados de outra empresa.
- O servidor se recusa a iniciar se o usuário do banco for superusuário ou tiver `BYPASSRLS` (eles ignorariam as políticas).

Como isso aparece no código (`src/db.js`):

- Requisições autenticadas já rodam no contexto da empresa do usuário (`middleware/auth.js`). `query()` e `tx()` funcionam normalmente.
- Sem contexto, `query()` **lança erro** (falha fechada). Rotas sem login (login, cadastro, recuperação de senha, webhooks) e scripts usam `runAsSystem(() => ...)` explicitamente, só para o necessário, e voltam para `runAsCompany(id, ...)` assim que sabem a empresa.
- Eventos em tempo real (`broadcast`) só chegam a usuários da empresa do contexto.

Ao criar uma **tabela nova** de dados: inclua `company_id INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE`, ative e force RLS com a política `tenant_isolation` (copie o padrão da migração 003), use FKs compostas para tabelas da empresa e escreva um teste em `tests/multiempresa.test.js`.

## Caixa de entrada (WhatsApp)

- `channels`: números conectados por empresa (tokens criptografados com `lib/crypto.js`). Cada canal tem uma URL de webhook própria e secreta (`/api/webhooks/whatsapp/<chave>`), que identifica a empresa antes de qualquer acesso aos dados.
- `routes/webhooks.js` responde 200 à Meta imediatamente e processa em segundo plano, no contexto da empresa do canal (`lib/inbox.js`). Eventos repetidos são ignorados pelo `wa_message_id`.
- `lib/whatsapp.js` é o único ponto que fala com a Graph API. Nos testes, `config.whatsapp.graphUrl` aponta para um servidor falso (`tests/inbox.test.js`).
- Mídias nunca são salvas: são buscadas na Meta quando alguém abre. Só formatos seguros abrem no navegador; o resto é baixado como arquivo.
- **QR Code** (`lib/waweb.js`): uma conexão do WhatsApp Web por canal, no mesmo processo do servidor. Credenciais e chaves ficam em `channel_session_keys` (criptografadas); as conexões ativas são retomadas em `server.js`. Mensagens entram por `inbox.ingestMessage`, o mesmo caminho da API oficial. Nos testes, `waweb.setDriver()` troca a biblioteca por um WhatsApp falso (`tests/qrcode.test.js`).

- **Instagram e Messenger** (`lib/meta.js`): canais `instagram`/`messenger` com `page_id` (e `ig_account_id`). Webhook em `/api/webhooks/meta/<chave>`, processado por `inbox.processMetaWebhook`. O contato é guardado em `contact_phone` como `ig:<id>`/`fb:<id>` (não há telefone). Anexos guardam só a URL da Meta; `meta.fetchMedia` só baixa de domínios da Meta. Nos testes, `tests/metaMock.js` simula a Graph API.
- **Robô** (`lib/chatbot.js`): `inbox.announce` chama `chatbot.onInbound` para cada mensagem recebida. O estado fica em `conversations.bot_state` (`NULL` → `menu` → `done`) e é decidido dentro de uma transação com `FOR UPDATE` (duas mensagens seguidas não geram duas respostas); o envio acontece depois. Resposta de uma pessoa (`outbox.record` com `senderId`) ou mensagem enviada pelo celular marca `done`; conversa encerrada que recebe mensagem volta para `NULL`.

## Funis, campos personalizados e automações

- `pipelines` agrupa `pipeline_stages`. Há exatamente um funil `is_default` por empresa (índice único parcial); é nele que `inbox.createLead` cria a oportunidade. Empresas novas ganham o funil padrão em `lib/companies.js`.
- Valores de campos personalizados ficam em `customers.custom` e `opportunities.custom` (JSONB); as definições em `custom_fields`. Toda gravação passa por `customFields.clean()`, que converte os tipos e devolve erros como `custom.<chave>` (o formulário destaca o campo). Na edição os valores são mesclados (`custom || $novo`).
- `lib/automations.js`: `onStageEntered()` é chamado depois que a transação que moveu/criou a oportunidade termina, e roda fora da requisição, no contexto da empresa. Cada ação recarrega a oportunidade e registra o resultado em `automation_runs`; uma falha não impede as seguintes. Para uma nova ação: some-a em `ACTIONS`, no esquema de `routes/automations.js` e em `actionFields()` de `public/js/pages/settings.js`.
- Envio de mensagens (chat e automações) passa por `lib/outbox.js`.

## Planos e cobrança

- `plans` e as tabelas da plataforma (`platform_admins`, `platform_audit`, `billing_events`) não pertencem a uma empresa: a RLS só as libera sem contexto de empresa (`runAsSystem`); `plans` pode ser lido por todos.
- `lib/subscription.js`: `blockReason()` (teste encerrado, atraso além da tolerância, período pago vencido) é calculado em `loadUser`; `billingGate` (montado em `routes/index.js`) responde 402 com `billing_blocked` para tudo fora da tela de assinatura. `checkLimit('users' | 'channels')` e `requireFeature('automations' | 'chatbot')` protegem as rotas de criação; automações e robô também conferem o plano ao rodar.
- `lib/billing.js`: cliente do Asaas e `handleEvent()` do webhook (idempotente por `billing_events`). Nos testes, `config.billing.asaasUrl` aponta para um servidor falso (`tests/planos.test.js`).
- `routes/platform.js`: painel do dono, com sessão própria (`req.session.platformAdminId`) e sempre em `runAsSystem`.

## Datas e fuso horário

O servidor e o banco trabalham em UTC (`timestamptz`). Tudo que depende de "dia" — tarefas de hoje, filtros "de/até", relatórios — usa o **fuso configurado pela empresa** (`company_settings.timezone`) por meio de `src/lib/timezone.js`:

- `localDate(col)` — data local de um timestamp
- `todaySql()` — hoje no fuso da empresa
- `startOfDaySql($n)` / `endOfDaySql($n)` — limites de um filtro `AAAA-MM-DD` (use `>=` e `<`)

Não use `coluna::date` nem fusos fixos no código.

## Estilo de código

- Formatação automática com **Prettier** (`npm run format`) — não formate à mão.
- **ESLint** (`npm run lint`) sem erros.
- Nomes de variáveis/funções em inglês; textos exibidos ao usuário, comentários e mensagens de commit em português.
- Comentários explicam o **porquê**, não o óbvio.

## Antes de cada commit

```bash
npm run check   # lint + formatação + testes
```

A mesma verificação roda no CI (`.github/workflows/ci.yml`). Toda correção de bug ou funcionalidade nova deve vir com teste em `tests/`.

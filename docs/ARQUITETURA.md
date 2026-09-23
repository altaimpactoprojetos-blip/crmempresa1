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

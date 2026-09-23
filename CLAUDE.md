# CRM de Atendimento

CRM em português do Brasil: Node.js + Express + PostgreSQL no backend, SPA sem build em `public/`.

- Leia e siga **docs/ARQUITETURA.md** (onde colocar cada coisa, padrão de rotas, fuso horário, estilo).
- Antes de commitar: `npm run check` (lint + Prettier + testes). Os testes precisam de um PostgreSQL com o banco `crm_test` (usuário/senha `crm`/`crm`, ou `DATABASE_URL_TEST`).
- Mudanças no banco: nova migração em `src/migrations/`, nunca editar as existentes.
- Textos da interface, mensagens de erro, comentários e commits em português.

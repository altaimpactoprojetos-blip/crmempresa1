# CRM como Supabase Edge Function

1. `npm run edge:build` gera `bundle.js` (servidor Express + frontend embutidos, sem dependências locais).
   No bundle, `process.env` é substituído por um objeto próprio: o runtime das Edge Functions não permite alterar o ambiente.
2. `deps.ts` importa as dependências npm pelo Deno e as injeta no bundle.
3. Deploy: `supabase functions deploy crm --no-verify-jwt` (a função tem autenticação própria por sessão).
   Alternativa sem CLI: publicar apenas `index.ts` + `deps.ts`, com o `index.ts` importando o bundle do repositório fixado por commit:
   `import 'https://cdn.jsdelivr.net/gh/<owner>/<repo>@<commit>/supabase/functions/crm/bundle.js';`
   Variáveis opcionais (Edge Function Secrets): `WHATSAPP_*`, `SMTP_*`, `SESSION_SECRET`, `APP_URL`.
   O banco é o do próprio projeto (`SUPABASE_DB_URL`); as migrações pendentes são aplicadas no primeiro acesso.
4. Teste local: `deno run --allow-all --node-modules-dir=none index.ts` (com `DATABASE_URL`, `DATABASE_SSL=false`, `COOKIE_SECURE=false`).

URL pública: `https://<ref>.supabase.co/functions/v1/crm/`

Limites do ambiente: cada requisição dura no máximo 150 s (o stream de notificações reconecta sozinho), o realtime só alcança
usuários atendidos pela mesma instância e o primeiro acesso após inatividade demora alguns segundos.

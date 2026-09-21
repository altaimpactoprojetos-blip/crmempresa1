# CRM como Supabase Edge Function

1. `npm run edge:build` gera `bundle.js` (servidor Express + frontend embutidos, sem dependências locais).
2. `deps.ts` importa as dependências npm pelo Deno e as injeta no bundle.
3. Deploy: `supabase functions deploy crm --no-verify-jwt` (a função tem autenticação própria por sessão).
   Variáveis opcionais (Edge Function Secrets): `WHATSAPP_*`, `SMTP_*`, `SESSION_SECRET`, `APP_URL`.
   O banco é o do próprio projeto (`SUPABASE_DB_URL`); as migrações pendentes são aplicadas no primeiro acesso.

URL pública: `https://<ref>.supabase.co/functions/v1/crm/`

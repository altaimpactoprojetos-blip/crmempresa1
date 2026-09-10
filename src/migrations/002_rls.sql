-- Habilita Row Level Security em todas as tabelas, sem políticas.
-- O servidor do CRM conecta como dono do banco (ignora RLS). Em provedores que expõem
-- o banco por API (ex.: Supabase/PostgREST), isso impede acesso direto às tabelas.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

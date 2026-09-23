-- Multiempresa (SaaS): várias empresas no mesmo banco, com isolamento garantido pelo PostgreSQL.
--
-- Cada tabela de dados ganha company_id, preenchido automaticamente a partir do contexto da
-- transação (app.company_id, definido pelo servidor em src/db.js). Políticas de Row Level
-- Security, forçadas inclusive para o dono das tabelas, só deixam ver e gravar linhas da
-- empresa do contexto. Chaves estrangeiras compostas (company_id, id) impedem que um registro
-- aponte para dados de outra empresa. Instalações existentes viram a empresa 1.

CREATE OR REPLACE FUNCTION app_company_id() RETURNS integer LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('app.company_id', true), '')::integer $$;

CREATE OR REPLACE FUNCTION app_rls_bypass() RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT coalesce(current_setting('app.bypass_rls', true), '') = 'on' $$;

CREATE TABLE companies (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','suspended','cancelled')),
  plan          TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  ticket_seq    INTEGER NOT NULL DEFAULT 0,   -- numeração de protocolos por empresa
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instalação existente (já com usuários): vira a empresa 1, com todos os dados atuais.
-- Instalação nova: remove a configuração e as etapas padrão globais; cada empresa recebe as
-- suas ao ser criada (src/lib/companies.js).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users) THEN
    INSERT INTO companies (id, name, status, plan, ticket_seq)
    SELECT 1, name, 'active', 'legacy',
           (SELECT CASE WHEN is_called THEN last_value ELSE 0 END FROM ticket_protocol_seq)
    FROM company_settings WHERE id = 1;
    PERFORM setval('companies_id_seq', 1);
  ELSE
    DELETE FROM company_settings;
    DELETE FROM pipeline_stages;
  END IF;
END $$;

DROP SEQUENCE ticket_protocol_seq;

-- Configurações: uma linha por empresa
ALTER TABLE company_settings DROP CONSTRAINT company_settings_pkey;
ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS company_settings_id_check;
ALTER TABLE company_settings ADD COLUMN company_id INTEGER;
UPDATE company_settings SET company_id = 1;
ALTER TABLE company_settings DROP COLUMN id;
ALTER TABLE company_settings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE company_settings ALTER COLUMN company_id SET DEFAULT app_company_id();
ALTER TABLE company_settings ADD PRIMARY KEY (company_id);
ALTER TABLE company_settings ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE company_settings ALTER COLUMN name DROP DEFAULT;

-- company_id nas demais tabelas de dados
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','customers','customer_notes','tickets','ticket_events','pipeline_stages',
                           'opportunities','opportunity_events','tasks','notifications','audit_log','whatsapp_messages']
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1 REFERENCES companies(id) ON DELETE CASCADE', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN company_id SET DEFAULT app_company_id()', t);
  END LOOP;
END $$;

-- Chaves compostas: tabelas referenciadas passam a ser únicas por (company_id, id)...
ALTER TABLE users           ADD CONSTRAINT users_company_id_id_key           UNIQUE (company_id, id);
ALTER TABLE customers       ADD CONSTRAINT customers_company_id_id_key       UNIQUE (company_id, id);
ALTER TABLE tickets         ADD CONSTRAINT tickets_company_id_id_key         UNIQUE (company_id, id);
ALTER TABLE pipeline_stages ADD CONSTRAINT pipeline_stages_company_id_id_key UNIQUE (company_id, id);
ALTER TABLE opportunities   ADD CONSTRAINT opportunities_company_id_id_key   UNIQUE (company_id, id);

-- ...e toda chave estrangeira para elas passa a incluir company_id (mesma empresa obrigatória).
DO $$
DECLARE r RECORD; on_delete TEXT;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid::regclass AS tbl, c.confrelid::regclass AS ref, a.attname AS col, c.confdeltype
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND array_length(c.conkey, 1) = 1
      AND c.confrelid::regclass::text IN ('users','customers','tickets','pipeline_stages','opportunities')
      AND c.conrelid::regclass::text <> 'password_resets'
  LOOP
    on_delete := CASE r.confdeltype
      WHEN 'c' THEN 'ON DELETE CASCADE'
      WHEN 'n' THEN format('ON DELETE SET NULL (%I)', r.col)
      ELSE '' END;
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (company_id, %I) REFERENCES %s (company_id, id) %s',
                   r.tbl, r.conname, r.col, r.ref, on_delete);
  END LOOP;
END $$;

-- Protocolo único por empresa
ALTER TABLE tickets DROP CONSTRAINT tickets_protocol_key;
ALTER TABLE tickets ADD CONSTRAINT tickets_company_protocol_key UNIQUE (company_id, protocol);

-- Índices para consultas por empresa
CREATE INDEX customer_notes_company_idx     ON customer_notes (company_id);
CREATE INDEX ticket_events_company_idx      ON ticket_events (company_id);
CREATE INDEX opportunity_events_company_idx ON opportunity_events (company_id);
CREATE INDEX tasks_company_idx              ON tasks (company_id);
CREATE INDEX notifications_company_idx      ON notifications (company_id);
CREATE INDEX audit_log_company_idx          ON audit_log (company_id, created_at);
CREATE INDEX whatsapp_messages_company_idx  ON whatsapp_messages (company_id);

-- Row Level Security forçada (vale também para o dono das tabelas, que é o usuário do CRM)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['company_settings','users','customers','customer_notes','tickets','ticket_events',
                           'pipeline_stages','opportunities','opportunity_events','tasks','notifications',
                           'audit_log','whatsapp_messages']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (app_rls_bypass() OR company_id = app_company_id()) '
      'WITH CHECK (app_rls_bypass() OR company_id = app_company_id())', t);
  END LOOP;
END $$;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON companies
  USING (app_rls_bypass() OR id = app_company_id())
  WITH CHECK (app_rls_bypass() OR id = app_company_id());

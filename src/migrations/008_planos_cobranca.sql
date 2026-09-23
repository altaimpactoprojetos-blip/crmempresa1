-- Fase 4: planos com limites, cobrança recorrente (Asaas) e painel do dono da plataforma.

-- ---------- Planos (dados da plataforma, iguais para todas as empresas) ----------
CREATE TABLE plans (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  price_cents   INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),   -- mensal
  max_users     INTEGER,            -- NULL = sem limite
  max_channels  INTEGER,            -- números de WhatsApp, Instagram e Messenger conectados
  features      JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { automations, chatbot }
  public        BOOLEAN NOT NULL DEFAULT TRUE,        -- aparece para as empresas escolherem
  position      INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO plans (id, name, price_cents, max_users, max_channels, features, public, position) VALUES
  ('trial',        'Período de teste', 0,     5,    2,    '{"automations": true, "chatbot": true}',  FALSE, 0),
  ('basico',       'Básico',           9700,  3,    1,    '{"automations": false, "chatbot": false}', TRUE, 1),
  ('profissional', 'Profissional',     19700, 10,   3,    '{"automations": true, "chatbot": true}',  TRUE, 2),
  ('empresarial',  'Empresarial',      39700, 30,   10,   '{"automations": true, "chatbot": true}',  TRUE, 3),
  ('interno',      'Uso interno',      0,     NULL, NULL, '{"automations": true, "chatbot": true}',  FALSE, 9);

-- Empresas criadas antes dos planos: teste continua teste; as demais ficam sem limites
UPDATE companies SET plan = 'interno' WHERE plan NOT IN (SELECT id FROM plans);
ALTER TABLE companies ADD CONSTRAINT companies_plan_fkey FOREIGN KEY (plan) REFERENCES plans (id);

-- ---------- Assinatura ----------
ALTER TABLE companies DROP CONSTRAINT companies_status_check;
ALTER TABLE companies ADD CONSTRAINT companies_status_check
  CHECK (status IN ('trial', 'active', 'past_due', 'suspended', 'cancelled'));
ALTER TABLE companies ADD COLUMN billing_customer_id TEXT UNIQUE;       -- cliente no Asaas
ALTER TABLE companies ADD COLUMN billing_subscription_id TEXT UNIQUE;   -- assinatura no Asaas
ALTER TABLE companies ADD COLUMN billing_email TEXT;
ALTER TABLE companies ADD COLUMN billing_document TEXT;                 -- CPF/CNPJ (só dígitos)
ALTER TABLE companies ADD COLUMN current_period_end TIMESTAMPTZ;        -- pago até (NULL = sem cobrança)
ALTER TABLE companies ADD COLUMN past_due_since TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN notes TEXT;                            -- anotações do dono da plataforma

CREATE TABLE payments (
  id            SERIAL PRIMARY KEY,
  company_id    INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  provider_id   TEXT NOT NULL UNIQUE,     -- id da cobrança no Asaas
  status        TEXT NOT NULL,            -- PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED...
  value_cents   INTEGER NOT NULL,
  due_date      DATE,
  paid_at       TIMESTAMPTZ,
  invoice_url   TEXT,
  billing_type  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_company_idx ON payments (company_id, due_date DESC);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON payments
  USING (app_rls_bypass() OR company_id = app_company_id())
  WITH CHECK (app_rls_bypass() OR company_id = app_company_id());

-- Eventos do webhook de cobrança já processados (o Asaas pode reenviar)
CREATE TABLE billing_events (
  id           TEXT PRIMARY KEY,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Dono da plataforma ----------
CREATE TABLE platform_admins (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_audit (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    INTEGER REFERENCES platform_admins(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  company_id  INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabelas da plataforma não pertencem a uma empresa: só são acessadas sem contexto de empresa
-- (runAsSystem). A RLS garante que uma requisição de empresa nunca as leia ou altere por engano,
-- exceto os planos, que todas podem consultar.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['billing_events','platform_admins','platform_audit'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY platform_only ON %I USING (app_rls_bypass()) WITH CHECK (app_rls_bypass())', t);
  END LOOP;
END $$;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans FORCE ROW LEVEL SECURITY;
CREATE POLICY plans_read ON plans FOR SELECT USING (TRUE);
CREATE POLICY plans_write ON plans FOR ALL USING (app_rls_bypass()) WITH CHECK (app_rls_bypass());

-- Fase 2: vários funis por empresa, campos personalizados e automações por etapa.
-- Mesmo padrão de isolamento da migração 003 (company_id automático, RLS forçada, FKs compostas).

-- ---------- Funis ----------
CREATE TABLE pipelines (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 1,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,   -- recebe os contatos novos do WhatsApp
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, id)
);
CREATE UNIQUE INDEX pipelines_one_default ON pipelines (company_id) WHERE is_default;

-- Cada empresa existente ganha o funil padrão com as etapas que já tinha
INSERT INTO pipelines (company_id, name, position, is_default) SELECT id, 'Funil de vendas', 1, TRUE FROM companies;
ALTER TABLE pipeline_stages ADD COLUMN pipeline_id INTEGER;
UPDATE pipeline_stages s SET pipeline_id = p.id FROM pipelines p WHERE p.company_id = s.company_id;
ALTER TABLE pipeline_stages ALTER COLUMN pipeline_id SET NOT NULL;
ALTER TABLE pipeline_stages ADD CONSTRAINT pipeline_stages_pipeline_fkey
  FOREIGN KEY (company_id, pipeline_id) REFERENCES pipelines (company_id, id) ON DELETE CASCADE;
CREATE INDEX pipeline_stages_pipeline_idx ON pipeline_stages (pipeline_id, position);

-- ---------- Campos personalizados ----------
CREATE TABLE custom_fields (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  entity      TEXT NOT NULL CHECK (entity IN ('customer', 'opportunity')),
  key         TEXT NOT NULL,
  label       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'number', 'money', 'date', 'select', 'checkbox', 'url')),
  options     TEXT[] NOT NULL DEFAULT '{}',
  required    BOOLEAN NOT NULL DEFAULT FALSE,
  position    INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, entity, key)
);
ALTER TABLE customers ADD COLUMN custom JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE opportunities ADD COLUMN custom JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ---------- Automações (ao entrar em uma etapa) ----------
CREATE TABLE automations (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  trigger     TEXT NOT NULL DEFAULT 'stage_entered' CHECK (trigger IN ('stage_entered')),
  stage_id    INTEGER NOT NULL,
  actions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  FOREIGN KEY (company_id, stage_id) REFERENCES pipeline_stages (company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, created_by) REFERENCES users (company_id, id) ON DELETE SET NULL (created_by)
);
CREATE INDEX automations_stage_idx ON automations (company_id, stage_id) WHERE active;

CREATE TABLE automation_runs (
  id              BIGSERIAL PRIMARY KEY,
  company_id      INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  automation_id   INTEGER NOT NULL,
  opportunity_id  INTEGER,
  status          TEXT NOT NULL CHECK (status IN ('ok', 'partial', 'error')),
  detail          JSONB NOT NULL DEFAULT '[]'::jsonb,   -- resultado de cada ação
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id, automation_id) REFERENCES automations (company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, opportunity_id) REFERENCES opportunities (company_id, id) ON DELETE CASCADE
);
CREATE INDEX automation_runs_idx ON automation_runs (automation_id, created_at DESC);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['pipelines','custom_fields','automations','automation_runs'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (app_rls_bypass() OR company_id = app_company_id()) '
      'WITH CHECK (app_rls_bypass() OR company_id = app_company_id())', t);
  END LOOP;
END $$;

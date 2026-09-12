-- Evolução: central de conversas, múltiplos funis, filtros salvos, respostas rápidas,
-- automações e integração WhatsApp verificável. Todas as alterações preservam os dados.

-- ===== Configurações =====
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS response_sla_minutes INTEGER NOT NULL DEFAULT 30;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS idle_opportunity_days INTEGER NOT NULL DEFAULT 7;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS whatsapp_last_event_at TIMESTAMPTZ;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS whatsapp_last_error TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS whatsapp_last_error_at TIMESTAMPTZ;
ALTER TABLE company_settings ALTER COLUMN primary_color SET DEFAULT '#2563eb';
ALTER TABLE company_settings ALTER COLUMN accent_color SET DEFAULT '#1e3a5f';

-- ===== Usuários: equipe (para automações e distribuição) =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT;

-- ===== Atendimentos: campos da central de conversas (denormalizados a partir da linha do tempo) =====
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_message_direction TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_agent_message_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;

UPDATE tickets t SET
  last_message_at = s.last_at,
  last_message_preview = s.preview,
  last_message_direction = s.direction,
  last_customer_message_at = s.last_in,
  last_agent_message_at = s.last_out
FROM (
  SELECT e.ticket_id,
    max(e.created_at) AS last_at,
    (array_agg(left(e.body, 160) ORDER BY e.created_at DESC, e.id DESC))[1] AS preview,
    (array_agg(e.direction ORDER BY e.created_at DESC, e.id DESC))[1] AS direction,
    max(e.created_at) FILTER (WHERE e.direction = 'entrada') AS last_in,
    max(e.created_at) FILTER (WHERE e.direction = 'saida') AS last_out
  FROM ticket_events e WHERE e.kind = 'interaction' GROUP BY e.ticket_id
) s WHERE s.ticket_id = t.id AND t.last_message_at IS NULL;

UPDATE tickets SET unread_count = (
  SELECT count(*) FROM ticket_events e WHERE e.ticket_id = tickets.id AND e.kind = 'interaction' AND e.direction = 'entrada'
    AND (tickets.last_agent_message_at IS NULL OR e.created_at > tickets.last_agent_message_at)
) WHERE status IN ('aguardando','em_atendimento','aguardando_cliente');

CREATE INDEX IF NOT EXISTS tickets_last_message_idx ON tickets (last_message_at DESC NULLS LAST);

-- Anexos de atendimento (arquivos pequenos armazenados no banco)
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id         SERIAL PRIMARY KEY,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_id   INTEGER REFERENCES ticket_events(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  mime       TEXT NOT NULL,
  size       INTEGER NOT NULL,
  data       BYTEA,
  wa_media_id TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_attachments_ticket_idx ON ticket_attachments (ticket_id);

-- Respostas rápidas
CREATE TABLE IF NOT EXISTS quick_replies (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  shortcut   TEXT,
  body       TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Filtros salvos (por usuário; opcionalmente compartilhados)
CREATE TABLE IF NOT EXISTS saved_filters (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope      TEXT NOT NULL,
  name       TEXT NOT NULL,
  params     JSONB NOT NULL DEFAULT '{}'::jsonb,
  shared     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_filters_scope_idx ON saved_filters (scope, user_id);

-- ===== Funis múltiplos =====
CREATE TABLE IF NOT EXISTS pipelines (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 1,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO pipelines (name, position, is_default) SELECT 'Funil comercial', 1, TRUE WHERE NOT EXISTS (SELECT 1 FROM pipelines);
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS pipeline_id INTEGER REFERENCES pipelines(id);
UPDATE pipeline_stages SET pipeline_id = (SELECT id FROM pipelines WHERE is_default ORDER BY id LIMIT 1) WHERE pipeline_id IS NULL;
ALTER TABLE pipeline_stages ALTER COLUMN pipeline_id SET NOT NULL;
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS color TEXT;
CREATE INDEX IF NOT EXISTS pipeline_stages_pipeline_idx ON pipeline_stages (pipeline_id, position);

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ;
UPDATE opportunities SET stage_entered_at = COALESCE(stage_entered_at, updated_at, created_at);
ALTER TABLE opportunities ALTER COLUMN stage_entered_at SET DEFAULT now();

-- ===== Tarefas: origem em automação e motivo de encerramento =====
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_rule_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS closed_reason TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'tarefa';

-- ===== Automações =====
CREATE TABLE IF NOT EXISTS automation_rules (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  trigger     TEXT NOT NULL,
  conditions  JSONB NOT NULL DEFAULT '{}'::jsonb,
  action      TEXT NOT NULL,
  action_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  team        TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  runs_count  INTEGER NOT NULL DEFAULT 0,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS automation_runs (
  id         BIGSERIAL PRIMARY KEY,
  rule_id    INTEGER NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  entity     TEXT NOT NULL,
  entity_id  INTEGER NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('executada','ignorada','falhou')),
  details    TEXT,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS automation_runs_rule_idx ON automation_runs (rule_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS automation_runs_dedupe_idx ON automation_runs (rule_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_automation_rule_fk;
ALTER TABLE tasks ADD CONSTRAINT tasks_automation_rule_fk FOREIGN KEY (automation_rule_id) REFERENCES automation_rules(id) ON DELETE SET NULL;

-- ===== WhatsApp =====
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS ticket_event_id INTEGER REFERENCES ticket_events(id) ON DELETE SET NULL;
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS status_at TIMESTAMPTZ;
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';

-- RLS nas tabelas novas (mesma política da migração 002: sem políticas; o servidor é dono do banco)
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['ticket_attachments','quick_replies','saved_filters','pipelines','automation_rules','automation_runs']) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

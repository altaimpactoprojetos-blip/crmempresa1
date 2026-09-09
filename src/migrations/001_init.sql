-- Esquema inicial do CRM

CREATE TABLE IF NOT EXISTS company_settings (
  id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name          TEXT NOT NULL DEFAULT 'Minha Empresa',
  logo_data     TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1d4ed8',
  accent_color  TEXT NOT NULL DEFAULT '#0f766e',
  timezone      TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  auto_distribution BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode     BOOLEAN NOT NULL DEFAULT FALSE,
  contact_sources TEXT[] NOT NULL DEFAULT ARRAY['Site','Indicação','WhatsApp','Instagram','Telefone','E-mail','Outro'],
  channels      TEXT[] NOT NULL DEFAULT ARRAY['WhatsApp','Telefone','E-mail','Chat','Presencial','Outro'],
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO company_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','supervisor','atendente')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  available     BOOLEAN NOT NULL DEFAULT TRUE,
  last_assigned_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessões (connect-pg-simple)
CREATE TABLE IF NOT EXISTS user_sessions (
  sid    VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
  sess   JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS user_sessions_expire_idx ON user_sessions (expire);

CREATE TABLE IF NOT EXISTS customers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  phone_digits TEXT,                 -- somente dígitos, para busca e duplicidade
  email       TEXT,
  company     TEXT,
  city        TEXT,
  document    TEXT,                  -- CPF ou CNPJ (opcional)
  source      TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  notes       TEXT,
  owner_id    INTEGER REFERENCES users(id),
  created_by  INTEGER REFERENCES users(id),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customers_phone_digits_idx ON customers (phone_digits);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers (lower(email));
CREATE INDEX IF NOT EXISTS customers_owner_idx ON customers (owner_id);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (lower(name));

CREATE TABLE IF NOT EXISTS customer_notes (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS ticket_protocol_seq;

CREATE TABLE IF NOT EXISTS tickets (
  id          SERIAL PRIMARY KEY,
  protocol    TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  subject     TEXT NOT NULL,
  description TEXT,
  channel     TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta','urgente')),
  status      TEXT NOT NULL DEFAULT 'aguardando'
              CHECK (status IN ('aguardando','em_atendimento','aguardando_cliente','resolvido','cancelado')),
  assignee_id INTEGER REFERENCES users(id),
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  closed_at   TIMESTAMPTZ,
  follow_up_at TIMESTAMPTZ,          -- retorno agendado
  created_by  INTEGER REFERENCES users(id),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets (status);
CREATE INDEX IF NOT EXISTS tickets_assignee_idx ON tickets (assignee_id);
CREATE INDEX IF NOT EXISTS tickets_customer_idx ON tickets (customer_id);
CREATE INDEX IF NOT EXISTS tickets_opened_idx ON tickets (opened_at);

-- Linha do tempo do atendimento: anotações internas, interações e eventos do sistema
CREATE TABLE IF NOT EXISTS ticket_events (
  id         SERIAL PRIMARY KEY,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id),
  kind       TEXT NOT NULL CHECK (kind IN ('note','interaction','system')),
  direction  TEXT CHECK (direction IN ('entrada','saida')),
  channel    TEXT,
  body       TEXT,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_events_ticket_idx ON ticket_events (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  position INTEGER NOT NULL,
  kind     TEXT NOT NULL DEFAULT 'open' CHECK (kind IN ('open','won','lost')),
  active   BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO pipeline_stages (name, position, kind)
SELECT * FROM (VALUES
  ('Novo contato', 1, 'open'),
  ('Em atendimento', 2, 'open'),
  ('Proposta enviada', 3, 'open'),
  ('Negociação', 4, 'open'),
  ('Ganho', 5, 'won'),
  ('Perdido', 6, 'lost')
) AS v(name, position, kind)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages);

CREATE TABLE IF NOT EXISTS opportunities (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  customer_id  INTEGER NOT NULL REFERENCES customers(id),
  owner_id     INTEGER REFERENCES users(id),
  stage_id     INTEGER NOT NULL REFERENCES pipeline_stages(id),
  value        NUMERIC(14,2) NOT NULL DEFAULT 0,
  next_action  TEXT,
  next_action_at TIMESTAMPTZ,
  expected_close_date DATE,
  lost_reason  TEXT,
  ticket_id    INTEGER REFERENCES tickets(id),
  closed_at    TIMESTAMPTZ,
  version      INTEGER NOT NULL DEFAULT 1,
  created_by   INTEGER REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities (stage_id);
CREATE INDEX IF NOT EXISTS opportunities_customer_idx ON opportunities (customer_id);
CREATE INDEX IF NOT EXISTS opportunities_owner_idx ON opportunities (owner_id);

CREATE TABLE IF NOT EXISTS opportunity_events (
  id             SERIAL PRIMARY KEY,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id        INTEGER REFERENCES users(id),
  body           TEXT NOT NULL,
  payload        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  customer_id    INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
  ticket_id      INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  assignee_id    INTEGER REFERENCES users(id),
  due_at         TIMESTAMPTZ,
  priority       TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta')),
  done_at        TIMESTAMPTZ,
  created_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks (assignee_id, done_at);
CREATE INDEX IF NOT EXISTS tasks_due_idx ON tasks (due_at);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  details    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip         TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at);

-- Mensagens da integração oficial do WhatsApp (somente quando conectada)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER REFERENCES customers(id),
  ticket_id     INTEGER REFERENCES tickets(id),
  user_id       INTEGER REFERENCES users(id),
  direction     TEXT NOT NULL CHECK (direction IN ('entrada','saida')),
  wa_message_id TEXT UNIQUE,
  phone_digits  TEXT NOT NULL,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'enviado',
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_idx ON whatsapp_messages (phone_digits, created_at);

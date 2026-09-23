-- Caixa de entrada (estilo Kommo): conversas de WhatsApp dentro do CRM, por empresa.
-- Mesmo padrão de isolamento da migração 003: company_id automático, RLS forçada e FKs compostas.

-- Canais conectados (hoje: WhatsApp Business pela API oficial da Meta). Cada empresa conecta o
-- próprio número; tokens ficam criptografados (src/lib/crypto.js).
CREATE TABLE channels (
  id                  SERIAL PRIMARY KEY,
  company_id          INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  type                TEXT NOT NULL DEFAULT 'whatsapp' CHECK (type IN ('whatsapp')),
  name                TEXT NOT NULL,
  phone_number_id     TEXT NOT NULL,
  waba_id             TEXT,
  display_phone       TEXT,
  verified_name       TEXT,
  access_token_enc    TEXT NOT NULL,
  app_secret_enc      TEXT,
  webhook_key         TEXT NOT NULL UNIQUE,     -- parte secreta da URL do webhook deste canal
  verify_token        TEXT NOT NULL,            -- token de verificação do webhook (Meta)
  status              TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','disconnected','error')),
  last_error          TEXT,
  created_by          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (phone_number_id),
  FOREIGN KEY (company_id, created_by) REFERENCES users (company_id, id) ON DELETE SET NULL (created_by)
);

CREATE TABLE conversations (
  id                   SERIAL PRIMARY KEY,
  company_id           INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  channel_id           INTEGER NOT NULL,
  customer_id          INTEGER,
  opportunity_id       INTEGER,
  contact_phone        TEXT NOT NULL,           -- somente dígitos, com DDI
  contact_name         TEXT,
  status               TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  assignee_id          INTEGER,
  unread_count         INTEGER NOT NULL DEFAULT 0,
  last_message_at      TIMESTAMPTZ,
  last_message_preview TEXT,
  last_inbound_at      TIMESTAMPTZ,             -- janela de 24h da Meta para mensagens livres
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, channel_id, contact_phone),
  FOREIGN KEY (company_id, channel_id) REFERENCES channels (company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, customer_id) REFERENCES customers (company_id, id) ON DELETE SET NULL (customer_id),
  FOREIGN KEY (company_id, opportunity_id) REFERENCES opportunities (company_id, id) ON DELETE SET NULL (opportunity_id),
  FOREIGN KEY (company_id, assignee_id) REFERENCES users (company_id, id) ON DELETE SET NULL (assignee_id)
);
CREATE INDEX conversations_list_idx ON conversations (company_id, status, last_message_at DESC);
CREATE INDEX conversations_customer_idx ON conversations (company_id, customer_id);

CREATE TABLE messages (
  id               BIGSERIAL PRIMARY KEY,
  company_id       INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id  INTEGER NOT NULL,
  direction        TEXT NOT NULL CHECK (direction IN ('in','out','note')),   -- note = anotação interna
  type             TEXT NOT NULL DEFAULT 'text',                          -- text, image, audio, video, document, sticker, location, template...
  body             TEXT,
  media            JSONB,                                                 -- { id, mime_type, filename } da Meta
  wa_message_id    TEXT UNIQUE,
  status           TEXT NOT NULL DEFAULT 'received'
                   CHECK (status IN ('received','pending','sent','delivered','read','failed','note')),
  error            TEXT,
  sender_id        INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id, conversation_id) REFERENCES conversations (company_id, id) ON DELETE CASCADE,
  FOREIGN KEY (company_id, sender_id) REFERENCES users (company_id, id) ON DELETE SET NULL (sender_id)
);
CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);

CREATE TABLE quick_replies (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  shortcut    TEXT NOT NULL,                  -- digitado após "/" no chat
  body        TEXT NOT NULL,
  created_by  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, shortcut),
  FOREIGN KEY (company_id, created_by) REFERENCES users (company_id, id) ON DELETE SET NULL (created_by)
);

-- Integração antiga (uma empresa, credenciais no .env), substituída pelos canais por empresa
DROP TABLE whatsapp_messages;

-- Nova conversa vira oportunidade no funil automaticamente (padrão: sim)
ALTER TABLE company_settings ADD COLUMN inbox_auto_lead BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['channels','conversations','messages','quick_replies'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (app_rls_bypass() OR company_id = app_company_id()) '
      'WITH CHECK (app_rls_bypass() OR company_id = app_company_id())', t);
  END LOOP;
END $$;

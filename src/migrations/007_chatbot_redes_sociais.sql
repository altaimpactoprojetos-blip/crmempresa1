-- Fase 3: robô de atendimento (boas-vindas, menu, horário de atendimento) e canais Instagram Direct e
-- Facebook Messenger na mesma caixa de entrada. Mesmo padrão de isolamento da migração 003.

-- ---------- Instagram e Messenger ----------
ALTER TABLE channels DROP CONSTRAINT channels_type_check;
ALTER TABLE channels ADD CONSTRAINT channels_type_check
  CHECK (type IN ('whatsapp', 'whatsapp_web', 'messenger', 'instagram'));
ALTER TABLE channels ADD COLUMN page_id TEXT;          -- página do Facebook (Messenger e Instagram)
ALTER TABLE channels ADD COLUMN ig_account_id TEXT;    -- conta profissional do Instagram ligada à página
ALTER TABLE channels ADD CONSTRAINT channels_social_fields_check
  CHECK (type NOT IN ('messenger', 'instagram') OR (page_id IS NOT NULL AND access_token_enc IS NOT NULL
                                                     AND webhook_key IS NOT NULL AND verify_token IS NOT NULL));
ALTER TABLE channels ADD CONSTRAINT channels_instagram_check CHECK (type <> 'instagram' OR ig_account_id IS NOT NULL);
-- A mesma página não pode ser conectada duas vezes ao mesmo tipo de canal (em nenhuma empresa)
CREATE UNIQUE INDEX channels_page_unique ON channels (type, page_id) WHERE page_id IS NOT NULL;

-- ---------- Robô de atendimento ----------
CREATE TABLE chatbot_settings (
  company_id  INTEGER PRIMARY KEY DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,   -- mensagens, opções do menu, horário (ver lib/chatbot.js)
  updated_by  INTEGER,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id, updated_by) REFERENCES users (company_id, id) ON DELETE SET NULL (updated_by)
);

-- Estado do robô em cada conversa: NULL = ainda não falou; 'menu' = aguardando a opção; 'done' = com a equipe
ALTER TABLE conversations ADD COLUMN bot_state TEXT CHECK (bot_state IN ('menu', 'done'));
ALTER TABLE conversations ADD COLUMN bot_tries INTEGER NOT NULL DEFAULT 0;
ALTER TABLE conversations ADD COLUMN away_sent_at TIMESTAMPTZ;   -- último aviso de "fora do horário"
-- Conversas que já existiam ficam com a equipe (o robô só atende contatos novos ou conversas reabertas)
UPDATE conversations SET bot_state = 'done';

ALTER TABLE messages ADD COLUMN is_bot BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON chatbot_settings
  USING (app_rls_bypass() OR company_id = app_company_id())
  WITH CHECK (app_rls_bypass() OR company_id = app_company_id());

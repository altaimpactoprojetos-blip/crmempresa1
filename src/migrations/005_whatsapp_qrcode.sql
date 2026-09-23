-- WhatsApp por QR Code (conexão pelo WhatsApp Web, sem a API oficial da Meta).
-- A sessão do aparelho fica no banco, criptografada (src/lib/crypto.js). Fotos, áudios e
-- documentos NÃO são guardados: só a referência para baixá-los do WhatsApp quando alguém abre.

ALTER TABLE channels DROP CONSTRAINT channels_type_check;
ALTER TABLE channels ADD CONSTRAINT channels_type_check CHECK (type IN ('whatsapp', 'whatsapp_web'));
ALTER TABLE channels ALTER COLUMN phone_number_id DROP NOT NULL;
ALTER TABLE channels ALTER COLUMN access_token_enc DROP NOT NULL;
ALTER TABLE channels ALTER COLUMN webhook_key DROP NOT NULL;
ALTER TABLE channels ALTER COLUMN verify_token DROP NOT NULL;
ALTER TABLE channels DROP CONSTRAINT channels_status_check;
ALTER TABLE channels ADD CONSTRAINT channels_status_check
  CHECK (status IN ('pending', 'connected', 'disconnected', 'error'));
ALTER TABLE channels ADD CONSTRAINT channels_api_fields_check
  CHECK (type <> 'whatsapp' OR (phone_number_id IS NOT NULL AND access_token_enc IS NOT NULL
                                AND webhook_key IS NOT NULL AND verify_token IS NOT NULL));

-- Credenciais e chaves de criptografia da sessão (equivalente à pasta de sessão do WhatsApp Web)
CREATE TABLE channel_session_keys (
  company_id  INTEGER NOT NULL DEFAULT app_company_id() REFERENCES companies(id) ON DELETE CASCADE,
  channel_id  INTEGER NOT NULL,
  key_type    TEXT NOT NULL,            -- 'creds' ou o tipo de chave do protocolo (pre-key, session...)
  key_id      TEXT NOT NULL,
  value_enc   TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, key_type, key_id),
  FOREIGN KEY (company_id, channel_id) REFERENCES channels (company_id, id) ON DELETE CASCADE
);

-- Endereço do contato no WhatsApp (número ou identificador privado "@lid"), usado para responder.
ALTER TABLE conversations ADD COLUMN contact_jid TEXT;

ALTER TABLE channel_session_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_session_keys FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON channel_session_keys
  USING (app_rls_bypass() OR company_id = app_company_id())
  WITH CHECK (app_rls_bypass() OR company_id = app_company_id());

-- Canal de integração com o n8n: registro de todas as trocas (entrada e saída).
-- Serve como log de teste/depuração; os payloads recebidos ficam aqui até serem
-- transformados em registros do CRM por uma etapa futura (fornecedores/cotações).

CREATE TABLE IF NOT EXISTS n8n_events (
  id          BIGSERIAL PRIMARY KEY,
  direction   TEXT NOT NULL CHECK (direction IN ('entrada','saida')),
  event       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','ok','erro')),
  http_status INTEGER,
  items       INTEGER,                       -- quantidade de itens quando o payload é uma lista
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  response    JSONB,
  error       TEXT,
  user_id     INTEGER REFERENCES users(id),  -- quem disparou o teste (nulo quando vem do n8n)
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS n8n_events_created_idx ON n8n_events (created_at DESC);
CREATE INDEX IF NOT EXISTS n8n_events_event_idx ON n8n_events (event, created_at DESC);

-- Mesma política do 002: RLS habilitado, sem políticas (o servidor conecta como dono).
ALTER TABLE n8n_events ENABLE ROW LEVEL SECURITY;

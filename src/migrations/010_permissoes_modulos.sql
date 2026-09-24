-- Permissões por módulo para os perfis Gestor (supervisor) e Atendente.
-- Formato: { "supervisor": { "reports": false }, "atendente": { "pipeline": false } }.
-- Módulo ausente = liberado (mantém o comportamento de antes). O Administrador sempre vê tudo.
ALTER TABLE company_settings ADD COLUMN permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

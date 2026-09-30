-- Oferta comercial: plano Profissional por R$ 49,90/mês como plano principal.
-- Só altera valores que ainda estão no padrão da migração 008 (o que o dono já editou no painel é mantido).
UPDATE plans SET price_cents = 4990, updated_at = now() WHERE id = 'profissional' AND price_cents = 19700;
UPDATE plans SET public = FALSE, updated_at = now() WHERE id = 'basico' AND price_cents = 9700 AND public;
UPDATE plans SET public = FALSE, updated_at = now() WHERE id = 'empresarial' AND price_cents = 39700 AND public;

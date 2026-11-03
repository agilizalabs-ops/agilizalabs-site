-- Um horário só pode ser reservado uma vez: a inserção falha se outra pessoa chegou antes.
-- whatsapp_digitos limita a uma conversa futura por número.
ALTER TABLE agendamentos ADD COLUMN whatsapp_digitos TEXT;
CREATE UNIQUE INDEX agendamentos_inicio_unico ON agendamentos (inicio);
CREATE INDEX agendamentos_whatsapp ON agendamentos (whatsapp_digitos, inicio);

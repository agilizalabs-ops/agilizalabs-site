-- Conversas sobre o plano marcadas pelo site. Seguem o prazo dos contatos (12 meses).
CREATE TABLE agendamentos (
  id TEXT PRIMARY KEY,
  criado_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  inicio TEXT NOT NULL,
  formato TEXT NOT NULL,
  plano TEXT,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  evento_id TEXT
);
CREATE INDEX agendamentos_criado_em ON agendamentos (criado_em);
CREATE INDEX agendamentos_expira_em ON agendamentos (expira_em);

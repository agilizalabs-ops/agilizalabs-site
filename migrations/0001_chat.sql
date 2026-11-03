-- Conversas do assistente: guardadas por 90 dias para melhorar as respostas.
CREATE TABLE conversas (
  id TEXT PRIMARY KEY,
  criada_em TEXT NOT NULL,
  atualizada_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  mensagens TEXT NOT NULL DEFAULT '[]',
  respostas INTEGER NOT NULL DEFAULT 0,
  tempo_resposta_ms INTEGER NOT NULL DEFAULT 0,
  motivo TEXT,
  nao_soube INTEGER NOT NULL DEFAULT 0,
  virou_contato INTEGER NOT NULL DEFAULT 0,
  csat INTEGER
);
CREATE INDEX conversas_criada_em ON conversas (criada_em);
CREATE INDEX conversas_expira_em ON conversas (expira_em);

-- Contatos deixados no chat: guardados por 12 meses ou até a pessoa pedir para apagar.
CREATE TABLE contatos (
  id TEXT PRIMARY KEY,
  criado_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  conversa_id TEXT,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo_negocio TEXT NOT NULL,
  aceite_texto TEXT NOT NULL,
  aceite_em TEXT NOT NULL,
  resumo TEXT
);
CREATE INDEX contatos_criado_em ON contatos (criado_em);
CREATE INDEX contatos_expira_em ON contatos (expira_em);

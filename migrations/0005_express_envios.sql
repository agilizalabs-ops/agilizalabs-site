-- Área de envio do Express: link secreto por pedido, o que o cliente preencheu e os sites gerados.
ALTER TABLE express_pedidos ADD COLUMN codigo TEXT;
CREATE UNIQUE INDEX express_pedidos_codigo ON express_pedidos (codigo);

-- O que o cliente preenche em /express/enviar/<codigo>, salvo a cada passo. enviado_em marca o "pronto, pode fazer".
CREATE TABLE express_envios (
  pedido_id TEXT PRIMARY KEY,
  dados TEXT NOT NULL,
  etapa INTEGER NOT NULL DEFAULT 1,
  atualizado_em TEXT NOT NULL,
  enviado_em TEXT
);

-- Sites Express gerados pela skill /criar-sites-97 e servidos pelo Worker express-sites.
-- status: previa (em previa.agilizalabs.com.br/<chave>), aprovado (cliente aprovou), no-ar (no domínio dele).
-- chave: <slug>-<10 letras aleatórias>, o endereço secreto da prévia; sem ela ninguém vê nem aprova.
CREATE TABLE express_sites (
  slug TEXT PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  pedido_id TEXT NOT NULL UNIQUE,
  dominio TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'previa',
  dados TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  aprovado_em TEXT,
  aprovado_ip TEXT,
  ajuste_texto TEXT,
  ajuste_em TEXT,
  publicado_em TEXT
);

-- Pedidos do Agiliza Express. Guardados enquanto houver contrato (fidelidade de 12 meses) e pelo prazo fiscal depois.
-- O aceite dos termos fica registrado com data (criado_em), IP e o texto aceito.
CREATE TABLE express_pedidos (
  id TEXT PRIMARY KEY,
  criado_em TEXT NOT NULL,
  negocio TEXT NOT NULL,
  cidade TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  maps INTEGER NOT NULL,
  valor_centavos INTEGER NOT NULL,
  ip TEXT NOT NULL,
  aceite_texto TEXT NOT NULL,
  pago_em TEXT,
  transacao TEXT
);
CREATE INDEX express_pedidos_pago_em ON express_pedidos (pago_em);

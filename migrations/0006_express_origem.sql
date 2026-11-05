-- De onde veio a venda do Express (utm_source e utm_campaign do link do anúncio ou da prospecção).
-- O placar do Hermes separa o custo por venda de cada canal. Vazio = chegou direto.
ALTER TABLE express_pedidos ADD COLUMN origem TEXT;
ALTER TABLE express_pedidos ADD COLUMN campanha TEXT;

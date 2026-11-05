// Pedidos do Agiliza Express: vagas da semana, registro do aceite e confirmação do pagamento.
// O valor sai sempre daqui (src/data/tiers.ts), nunca do navegador.
import { express, brlCentavos } from '../data/tiers';

export const textoAceiteExpress =
  `Li e aceito os termos do Agiliza Express (agilizalabs.com.br/express/termos): setup de ${brlCentavos(express.setup)}, ` +
  `mensalidade de ${brlCentavos(express.mensal)} com fidelidade de ${express.fidelidadeMeses} meses, ` +
  `primeira mensalidade 1 mês depois do site no ar.`;

export interface NovoPedidoExpress {
  negocio: string;
  cidade: string;
  whatsapp: string;
  email: string;
  maps: boolean;
  ip: string;
}

export interface PedidoExpress extends NovoPedidoExpress {
  id: string;
  valorCentavos: number;
}

export const valorDoPedido = (maps: boolean) => (express.setup + (maps ? express.maps : 0)) * 100;

/** Segunda-feira 00:00 no horário de Brasília (UTC-3), em ISO UTC. */
export function inicioDaSemana(agora = new Date()) {
  const brasilia = new Date(agora.getTime() - 3 * 3600_000);
  const diasDesdeSegunda = (brasilia.getUTCDay() + 6) % 7;
  const segunda = Date.UTC(brasilia.getUTCFullYear(), brasilia.getUTCMonth(), brasilia.getUTCDate() - diasDesdeSegunda);
  return new Date(segunda + 3 * 3600_000).toISOString();
}

/** Vagas que ainda restam nesta semana: só pedidos pagos ocupam vaga. */
export async function vagasRestantes(db: D1Database, agora = new Date()) {
  const linha = await db
    .prepare('SELECT COUNT(*) AS n FROM express_pedidos WHERE pago_em >= ?')
    .bind(inicioDaSemana(agora))
    .first<{ n: number }>();
  return Math.max(0, express.vagasPorSemana - Number(linha?.n ?? 0));
}

export async function criarPedido(db: D1Database, p: NovoPedidoExpress): Promise<PedidoExpress> {
  const pedido = { ...p, id: `express-${crypto.randomUUID().slice(0, 13)}`, valorCentavos: valorDoPedido(p.maps) };
  await db
    .prepare(
      `INSERT INTO express_pedidos (id, criado_em, negocio, cidade, whatsapp, email, maps, valor_centavos, ip, aceite_texto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(pedido.id, new Date().toISOString(), p.negocio, p.cidade, p.whatsapp, p.email, p.maps ? 1 : 0, pedido.valorCentavos, p.ip, textoAceiteExpress)
    .run();
  return pedido;
}

export async function lerPedido(db: D1Database, id: string) {
  return db
    .prepare('SELECT id, negocio, cidade, whatsapp, email, maps, valor_centavos AS valorCentavos, pago_em AS pagoEm FROM express_pedidos WHERE id = ?')
    .bind(id)
    .first<{ id: string; negocio: string; cidade: string; whatsapp: string; email: string; maps: number; valorCentavos: number; pagoEm: string | null }>();
}

/** Marca como pago. Devolve true só na primeira vez, para o aviso ao Carlos sair uma vez só. */
export async function marcarPago(db: D1Database, id: string, transacao: string) {
  const r = await db
    .prepare('UPDATE express_pedidos SET pago_em = ?, transacao = ? WHERE id = ? AND pago_em IS NULL')
    .bind(new Date().toISOString(), transacao, id)
    .run();
  return r.meta.changes === 1;
}

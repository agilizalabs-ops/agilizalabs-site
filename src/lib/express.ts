// Pedidos do Agiliza Express: vagas da semana, registro do aceite e confirmação do pagamento.
// O valor sai sempre daqui (src/data/tiers.ts), nunca do navegador.
import { express, brlCentavos } from '../data/tiers';
import { InfinitePay } from './infinitepay';
import { avisarExpress } from './chat/avisos';

export const textoAceiteExpress =
  `Li e aceito os termos do Agiliza Express (agilizalabs.com.br/express/termos): setup de ${brlCentavos(express.setup)}, ` +
  `mensalidade de ${brlCentavos(express.mensal)} com fidelidade de ${express.fidelidadeMeses} meses, ` +
  `primeira mensalidade 1 mês depois do site no ar.`;

/** Mensagem pronta do WhatsApp para quem pagou e precisa falar com a gente (retorno sem o link de envio). */
export const mensagemExpress = (p: { id: string; negocio: string } | null) =>
  p
    ? `Oi! Paguei o Agiliza Express (pedido ${p.id}) para o ${p.negocio} e preciso do link para montar o site.`
    : 'Oi! Fiz o pagamento do Agiliza Express e quero confirmar.';

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
  codigo: string;
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

/** Código secreto do link de envio (/express/enviar/<codigo>): 128 bits aleatórios, ninguém adivinha. */
const novoCodigo = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

// O link de envio dá acesso a CPF e endereço do cliente. Ele só é mostrado ao navegador que fez a compra:
// o checkout grava o código num cookie HttpOnly, e status e retorno só entregam o link se o cookie bater.
// Em outro navegador, o link chega pelo Carlos (vai no e-mail de aviso).
const COOKIE = 'express_pedido';
export const cookieDoPedido = (codigo: string) => `${COOKIE}=${codigo}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`;
export function mesmoNavegador(request: Request, pedido: { codigo: string | null }) {
  const valor = (request.headers.get('Cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return Boolean(pedido.codigo && valor && valor === pedido.codigo);
}

/** Link da área onde o cliente manda fotos, serviços e preços depois de pagar. */
export const linkEnvio = (codigo: string) => `/express/enviar/${codigo}`;

export async function criarPedido(db: D1Database, p: NovoPedidoExpress): Promise<PedidoExpress> {
  // id com o UUID inteiro (122 bits): ele aparece em URLs de retorno e não pode ser adivinhável.
  const pedido = { ...p, id: `express-${crypto.randomUUID()}`, valorCentavos: valorDoPedido(p.maps), codigo: novoCodigo() };
  await db
    .prepare(
      `INSERT INTO express_pedidos (id, criado_em, negocio, cidade, whatsapp, email, maps, valor_centavos, ip, aceite_texto, codigo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(pedido.id, new Date().toISOString(), p.negocio, p.cidade, p.whatsapp, p.email, p.maps ? 1 : 0, pedido.valorCentavos, p.ip, textoAceiteExpress, pedido.codigo)
    .run();
  return pedido;
}

export async function lerPedido(db: D1Database, id: string) {
  return db
    .prepare('SELECT id, negocio, cidade, whatsapp, email, maps, valor_centavos AS valorCentavos, pago_em AS pagoEm, codigo FROM express_pedidos WHERE id = ?')
    .bind(id)
    .first<PedidoSalvo>();
}

export interface PedidoSalvo {
  id: string;
  negocio: string;
  cidade: string;
  whatsapp: string;
  email: string;
  maps: number;
  valorCentavos: number;
  pagoEm: string | null;
  codigo: string | null;
}

export async function lerPedidoPorCodigo(db: D1Database, codigo: string) {
  if (!/^[0-9a-f]{32}$/.test(codigo)) return null;
  return db
    .prepare('SELECT id, negocio, cidade, whatsapp, email, maps, valor_centavos AS valorCentavos, pago_em AS pagoEm, codigo FROM express_pedidos WHERE codigo = ?')
    .bind(codigo)
    .first<PedidoSalvo>();
}


/**
 * Confirma o pagamento na InfinitePay e marca o pedido como pago. Usado pela página de retorno e pelo webhook,
 * que não tem assinatura: só a consulta no servidor da InfinitePay vale como prova. O aviso ao Carlos sai uma vez só.
 */
export async function confirmarPagamento(env: Env, id: string, transacao: string | null, slug: string | null) {
  const pedido = id.startsWith('express-') ? await lerPedido(env.DB, id) : null;
  if (!pedido) return { pedido: null, pago: false };
  if (pedido.pagoEm) return { pedido, pago: true };
  if (!transacao || !slug) return { pedido, pago: false };

  const pagamento = await new InfinitePay(env.INFINITEPAY_HANDLE).consultarPagamento({ pedido: id, transacao, slug });
  const pago = pagamento.pago && pagamento.valorCentavos >= pedido.valorCentavos;
  if (pago && (await marcarPago(env.DB, id, transacao))) {
    try {
      await avisarExpress(env, pedido);
    } catch (erro) {
      console.error('Aviso do Express falhou; o pedido ficou marcado como pago.', erro);
    }
  }
  return { pedido, pago };
}

/** Marca como pago. Devolve true só na primeira vez, para o aviso ao Carlos sair uma vez só. */
export async function marcarPago(db: D1Database, id: string, transacao: string) {
  const r = await db
    .prepare('UPDATE express_pedidos SET pago_em = ?, transacao = ? WHERE id = ? AND pago_em IS NULL')
    .bind(new Date().toISOString(), transacao, id)
    .run();
  return r.meta.changes === 1;
}

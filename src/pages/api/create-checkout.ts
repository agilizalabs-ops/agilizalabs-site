import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { InfinitePay } from '../../lib/infinitepay';
import { lerCobranca } from '../../lib/cobranca';

export const prerender = false;

// Recebe só o link assinado. Valor e cliente vêm da assinatura, nunca do navegador.
export const POST: APIRoute = async ({ request }) => {
  const { token } = (await request.json().catch(() => ({}))) as { token?: string };
  const cobranca = token && (await lerCobranca(token, env.COBRANCA_SECRET));
  if (!cobranca) return Response.json({ erro: 'Link de pagamento inválido ou vencido.' }, { status: 400 });

  try {
    const url = await new InfinitePay(env.INFINITEPAY_HANDLE).criarCheckout({
      pedido: cobranca.id,
      itens: [{ descricao: cobranca.descricao, valorCentavos: cobranca.valorCentavos }],
      cliente: cobranca.cliente,
      urlRetorno: new URL('/pagar/retorno', request.url).href,
    });
    return Response.json({ url });
  } catch (erro) {
    console.error(erro);
    return Response.json({ erro: 'Não conseguimos abrir o pagamento agora. Tente de novo em instantes.' }, { status: 502 });
  }
};

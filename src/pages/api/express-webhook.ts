import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { confirmarPagamento } from '../../lib/express';

export const prerender = false;

// Aviso de pagamento da InfinitePay. Não tem assinatura, então o corpo só diz QUAL pedido conferir;
// quem decide se está pago é a consulta ao /payment_check feita em confirmarPagamento.
export const POST: APIRoute = async ({ request }) => {
  const corpo = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof corpo.order_nsu === 'string' ? corpo.order_nsu : '';
  const transacao = typeof corpo.transaction_nsu === 'string' ? corpo.transaction_nsu : null;
  const slug = typeof corpo.invoice_slug === 'string' ? corpo.invoice_slug : null;
  if (!id.startsWith('express-')) return new Response(null, { status: 200 });

  try {
    await confirmarPagamento(env, id, transacao, slug);
    return new Response(null, { status: 200 });
  } catch (erro) {
    console.error('Webhook do Express falhou.', erro);
    return new Response(null, { status: 500 }); // fora de 2xx: a InfinitePay reenvia
  }
};

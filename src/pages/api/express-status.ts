import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { lerPedido, linkEnvio, mesmoNavegador } from '../../lib/express';

export const prerender = false;

// A página do Express pergunta aqui, a cada poucos segundos, se o pedido já foi pago (pelo webhook ou pelo retorno).
// O link de envio só sai para o navegador que fez a compra (cookie gravado no checkout); para os outros, só "pago: sim/não".
export const GET: APIRoute = async ({ url, request }) => {
  const id = url.searchParams.get('pedido') ?? '';
  if (!(await env.LIMITE_EXPRESS.limit({ key: `status:${id.slice(0, 50)}` })).success) return Response.json({ pago: false, espere: true }, { status: 429 });
  const pedido = id.startsWith('express-') ? await lerPedido(env.DB, id) : null;
  const pago = Boolean(pedido?.pagoEm);
  const corpo = !pago || !pedido ? { pago: false } : mesmoNavegador(request, pedido) ? { pago, negocio: pedido.negocio, linkEnvio: linkEnvio(pedido.codigo!) } : { pago };
  return Response.json(corpo, { headers: { 'Cache-Control': 'no-store' } });
};

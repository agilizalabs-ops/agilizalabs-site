import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { lerPedidoPorCodigo } from '../../lib/express';

export const prerender = false;

// Fotos e logo do cliente do Express. O navegador já manda a imagem reduzida (até 1600 px).
// Guardadas no KV EXPRESS_FOTOS com a chave express/<pedido>/<id>; o Worker express-sites serve as mesmas.
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const LIMITE_BYTES = 4 * 1024 * 1024;

async function pedidoPago(url: URL) {
  const pedido = await lerPedidoPorCodigo(env.DB, url.searchParams.get('codigo') ?? '');
  return pedido?.pagoEm ? pedido : null;
}

export const POST: APIRoute = async ({ request, url }) => {
  if (!(await env.LIMITE_EXPRESS.limit({ key: `foto:${(url.searchParams.get('codigo') ?? '').slice(0, 32)}` })).success) return Response.json({ erro: 'Muitas fotos seguidas. Espere um minuto.' }, { status: 429 });

  const pedido = await pedidoPago(url);
  if (!pedido) return Response.json({ erro: 'Link inválido.' }, { status: 404 });

  const tipo = request.headers.get('Content-Type') ?? '';
  if (!TIPOS.includes(tipo)) return Response.json({ erro: 'Mande uma foto em JPG, PNG ou WebP.' }, { status: 415 });
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > LIMITE_BYTES) return Response.json({ erro: 'Essa foto é grande demais. Tente outra.' }, { status: 413 });

  const chave = `express/${pedido.id}/${crypto.randomUUID()}`;
  await env.EXPRESS_FOTOS.put(chave, bytes, { metadata: { tipo } });
  return Response.json({ chave });
};

export const GET: APIRoute = async ({ url }) => {
  const pedido = await pedidoPago(url);
  const chave = url.searchParams.get('chave') ?? '';
  if (!pedido || !chave.startsWith(`express/${pedido.id}/`)) return new Response(null, { status: 404 });
  const { value, metadata } = await env.EXPRESS_FOTOS.getWithMetadata<{ tipo: string }>(chave, 'arrayBuffer');
  if (!value) return new Response(null, { status: 404 });
  return new Response(value, { headers: { 'Content-Type': metadata?.tipo ?? 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } });
};

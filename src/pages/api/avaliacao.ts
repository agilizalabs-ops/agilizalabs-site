import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { salvarAvaliacao } from '../../lib/chat/banco';

export const prerender = false;

// 👍 ou 👎 no fim da conversa: a satisfação (CSAT) do resumo semanal.
export const POST: APIRoute = async ({ request }) => {
  const { conversaId, nota } = (await request.json().catch(() => ({}))) as { conversaId?: string; nota?: number };
  if (typeof conversaId !== 'string' || (nota !== 1 && nota !== -1)) return Response.json({ erro: 'Avaliação inválida.' }, { status: 400 });
  await salvarAvaliacao(env.DB, conversaId, nota);
  return Response.json({ ok: true });
};

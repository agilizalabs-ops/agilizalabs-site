import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { lerPedidoPorCodigo } from '../../lib/express';
import { envioInicial, faltando, lerEnvio, limparEnvio, salvarEnvio, concluirEnvio } from '../../lib/express-envio';
import { avisarEnvioExpress } from '../../lib/chat/avisos';

export const prerender = false;

// Salvamento automático da área de envio e o "pronto, pode fazer" do cliente.
export const POST: APIRoute = async ({ request }) => {
  const corpo = (await request.json().catch(() => ({}))) as { codigo?: string; dados?: unknown; etapa?: number; concluir?: boolean };
  if (!(await env.LIMITE_EXPRESS.limit({ key: `envio:${String(corpo.codigo ?? '').slice(0, 32)}` })).success) return Response.json({ erro: 'Muitas alterações seguidas. Espere um minuto.' }, { status: 429 });
  const pedido = await lerPedidoPorCodigo(env.DB, String(corpo.codigo ?? ''));
  if (!pedido?.pagoEm) return Response.json({ erro: 'Link inválido ou pagamento ainda não confirmado.' }, { status: 404 });

  const salvo = await lerEnvio(env.DB, pedido.id);
  if (salvo?.enviadoEm) return Response.json({ erro: 'Você já mandou tudo para a equipe. Para mudar algo, fale com a gente.' }, { status: 409 });

  const dados = limparEnvio(corpo.dados, salvo?.dados ?? envioInicial(pedido), pedido.id);
  const etapa = Math.min(5, Math.max(1, Math.trunc(Number(corpo.etapa) || 1)));
  await salvarEnvio(env.DB, pedido.id, dados, etapa);

  if (!corpo.concluir) return Response.json({ ok: true });

  const falta = faltando(dados);
  if (falta.length) return Response.json({ erro: `Falta: ${falta.join(', ')}.` }, { status: 400 });
  if (await concluirEnvio(env.DB, pedido.id)) {
    try {
      await avisarEnvioExpress(env, pedido, dados);
    } catch (erro) {
      console.error('Aviso do envio falhou; o envio ficou salvo.', erro);
    }
  }
  return Response.json({ ok: true, enviado: true });
};

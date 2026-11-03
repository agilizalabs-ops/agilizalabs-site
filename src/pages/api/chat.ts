import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { responder } from '../../lib/chat/assistente';
import { abrirConversa, salvarResposta, LIMITE_MENSAGENS } from '../../lib/chat/banco';

export const prerender = false;

const FALHA = 'Não consegui responder agora. O Carlos responde rapidinho no WhatsApp, pelo botão "Falar com o Carlos".';

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  if (!(await env.LIMITE_CHAT.limit({ key: ip })).success) {
    return Response.json({ erro: 'Muitas mensagens seguidas. Espere um minuto e tente de novo.' }, { status: 429 });
  }

  const { conversaId, mensagem } = (await request.json().catch(() => ({}))) as { conversaId?: string; mensagem?: string };
  const texto = typeof mensagem === 'string' ? mensagem.trim() : '';
  if (!texto || texto.length > 800) return Response.json({ erro: 'Escreva uma mensagem de até 800 caracteres.' }, { status: 400 });

  const conversa = await abrirConversa(env.DB, typeof conversaId === 'string' ? conversaId : undefined);
  if (conversa.mensagens.filter((m) => m.role === 'user').length >= LIMITE_MENSAGENS) {
    return Response.json({
      conversaId: conversa.id,
      resposta: 'Essa conversa já está longa. Para seguir, o melhor é falar direto com o Carlos ou deixar o seu contato.',
      oferecerContato: true,
    });
  }

  const historico = [...conversa.mensagens, { role: 'user' as const, content: texto }];
  const inicio = Date.now();
  try {
    const r = await responder(historico, { chave: env.ANTHROPIC_API_KEY, modelo: env.IA_MODELO, esforco: env.IA_ESFORCO });
    conversa.mensagens = [...historico, { role: 'assistant', content: r.resposta }];
    await salvarResposta(env.DB, conversa, r, Date.now() - inicio);
    return Response.json({ conversaId: conversa.id, resposta: r.resposta, oferecerContato: r.oferecer_contato, tier: r.tier_sugerido });
  } catch (erro) {
    console.error(erro);
    return Response.json({ conversaId: conversa.id, resposta: FALHA, oferecerContato: true, falhou: true });
  }
};

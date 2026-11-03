import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { mensagensDaConversa, salvarContato } from '../../lib/chat/banco';
import { avisarContato } from '../../lib/chat/avisos';
import { textoAceite } from '../../data/conteudo';

export const prerender = false;

const texto = (v: unknown, min: number, max: number) => (typeof v === 'string' && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  if (!(await env.LIMITE_CHAT.limit({ key: ip })).success) return Response.json({ erro: 'Espere um minuto e tente de novo.' }, { status: 429 });

  const dados = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nome = texto(dados.nome, 2, 80);
  const whatsapp = texto(dados.whatsapp, 10, 20);
  const digitos = whatsapp?.replace(/\D/g, '') ?? '';
  const email = texto(dados.email, 5, 120);
  const tipoNegocio = texto(dados.tipoNegocio, 2, 80);
  const conversaId = typeof dados.conversaId === 'string' ? dados.conversaId : undefined;

  const erros: string[] = [];
  if (!nome) erros.push('nome');
  if (digitos.length < 10 || digitos.length > 13) erros.push('WhatsApp com DDD');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('e-mail válido');
  if (!tipoNegocio) erros.push('tipo de negócio');
  if (dados.aceite !== true) erros.push('o aceite para o Carlos te chamar');
  if (erros.length) return Response.json({ erro: `Falta preencher: ${erros.join(', ')}.` }, { status: 400 });

  const resumo = (await mensagensDaConversa(env.DB, conversaId))
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Visitante' : 'IA'}: ${m.content}`)
    .join('\n');
  const contato = { conversaId, nome: nome!, whatsapp: whatsapp!, email: email!, tipoNegocio: tipoNegocio!, aceiteTexto: textoAceite, resumo };

  await salvarContato(env.DB, contato);
  try {
    await avisarContato(env, contato);
  } catch (erro) {
    console.error('Aviso por e-mail falhou; o contato ficou salvo.', erro);
  }
  return Response.json({ ok: true });
};

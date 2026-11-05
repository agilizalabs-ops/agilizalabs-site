import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { InfinitePay } from '../../lib/infinitepay';
import { criarPedido, vagasRestantes, cookieDoPedido } from '../../lib/express';
import { express } from '../../data/tiers';

export const prerender = false;

const texto = (v: unknown, min: number, max: number) => (typeof v === 'string' && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);

// Cria o pedido do Express e devolve a URL do checkout da InfinitePay.
// O valor é calculado aqui: R$ 97, mais R$ 67 se marcou o Google Maps.
export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  if (!(await env.LIMITE_AGENDA.limit({ key: `express:${ip}` })).success) return Response.json({ erro: 'Espere um minuto e tente de novo.' }, { status: 429 });

  const dados = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const negocio = texto(dados.negocio, 2, 80);
  const cidade = typeof dados.cidade === 'string' && express.cidades.includes(dados.cidade) ? dados.cidade : null;
  const digitos = (texto(dados.whatsapp, 10, 20) ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  const email = texto(dados.email, 5, 120);

  const erros: string[] = [];
  if (!negocio) erros.push('nome do negócio');
  if (!cidade) erros.push('cidade');
  if (digitos.length < 10 || digitos.length > 11) erros.push('WhatsApp com DDD');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('e-mail válido');
  if (dados.aceite !== true) erros.push('o aceite dos termos');
  if (erros.length) return Response.json({ erro: `Falta preencher: ${erros.join(', ')}.` }, { status: 400 });

  if ((await vagasRestantes(env.DB)) === 0) {
    return Response.json({ erro: 'As vagas desta semana acabaram. Novas vagas abrem na segunda-feira.' }, { status: 409 });
  }

  const pedido = await criarPedido(env.DB, { negocio: negocio!, cidade: cidade!, whatsapp: digitos, email: email!, maps: dados.maps === true, ip });

  try {
    const url = await new InfinitePay(env.INFINITEPAY_HANDLE).criarCheckout({
      pedido: pedido.id,
      itens: [
        { descricao: 'Agiliza Express: site no ar em 48 h (setup)', valorCentavos: express.setup * 100 },
        ...(pedido.maps ? [{ descricao: 'Google Maps: Perfil da Empresa criado ou ajustado', valorCentavos: express.maps * 100 }] : []),
      ],
      cliente: { nome: negocio!, email: email!, telefone: `+55${digitos}` },
      urlRetorno: new URL('/express/retorno', request.url).href,
      urlWebhook: new URL('/api/express-webhook', request.url).href,
    });
    return Response.json({ url, pedido: pedido.id }, { headers: { 'Set-Cookie': cookieDoPedido(pedido.codigo) } });
  } catch (erro) {
    console.error(erro);
    return Response.json({ erro: 'Não conseguimos abrir o pagamento agora. Tente de novo em instantes.' }, { status: 502 });
  }
};

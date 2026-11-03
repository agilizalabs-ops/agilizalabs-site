import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { agenda } from '../../../data/agenda';
import { textoAceite } from '../../../data/conteudo';
import { contaConfigurada, criarEvento, ocupados } from '../../../lib/agenda/google';
import { rotuloDoHorario, vagaValida } from '../../../lib/agenda/horarios';
import { mensagensDaConversa, salvarAgendamento, salvarContato } from '../../../lib/chat/banco';
import { avisarAgendamento } from '../../../lib/chat/avisos';

export const prerender = false;

const texto = (v: unknown, min: number, max: number) => (typeof v === 'string' && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  if (!(await env.LIMITE_CHAT.limit({ key: ip })).success) return Response.json({ erro: 'Espere um minuto e tente de novo.' }, { status: 429 });
  const conta = contaConfigurada(env);
  if (!conta) return Response.json({ erro: 'Agenda ainda não configurada.' }, { status: 503 });

  const dados = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nome = texto(dados.nome, 2, 80);
  const whatsapp = texto(dados.whatsapp, 10, 20);
  const digitos = whatsapp?.replace(/\D/g, '') ?? '';
  const email = texto(dados.email, 5, 120);
  const tipoNegocio = texto(dados.tipoNegocio, 2, 80);
  const formato = typeof dados.formato === 'string' && agenda.formatos.includes(dados.formato) ? dados.formato : null;
  const plano = texto(dados.plano, 0, 400) ?? '';
  const conversaId = typeof dados.conversaId === 'string' ? dados.conversaId : undefined;
  const inicio = typeof dados.inicio === 'string' ? Date.parse(dados.inicio) : NaN;

  const erros: string[] = [];
  if (Number.isNaN(inicio)) erros.push('horário');
  if (!formato) erros.push('formato da conversa');
  if (!nome) erros.push('nome');
  if (digitos.length < 10 || digitos.length > 13) erros.push('WhatsApp com DDD');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('e-mail válido');
  if (!tipoNegocio) erros.push('tipo de negócio');
  if (dados.aceite !== true) erros.push('o aceite para o Carlos te chamar');
  if (erros.length) return Response.json({ erro: `Falta preencher: ${erros.join(', ')}.` }, { status: 400 });

  const fim = inicio + agenda.duracaoMinutos * 60_000;
  try {
    // Confere de novo na hora de marcar: outra pessoa pode ter pegado o horário.
    const folga = agenda.folgaMinutos * 60_000;
    if (!vagaValida(inicio, Date.now(), await ocupados(conta, inicio - folga, fim + folga))) {
      return Response.json({ erro: 'Esse horário acabou de ser ocupado. Escolha outro.', ocupado: true }, { status: 409 });
    }

    const quando = rotuloDoHorario(new Date(inicio).toISOString());
    const conversa = (await mensagensDaConversa(env.DB, conversaId)).slice(-8).map((m) => `${m.role === 'user' ? 'Visitante' : 'IA'}: ${m.content}`);
    const eventoId = await criarEvento(conta, {
      titulo: `Conversa sobre o plano: ${nome} (${tipoNegocio})`,
      descricao: [`Formato: ${formato}`, `Plano: ${plano || '(não montou)'}`, `WhatsApp: ${whatsapp}`, `E-mail: ${email}`, '', ...conversa].join('\n'),
      inicio,
      fim,
    });

    const contato = {
      conversaId,
      nome: nome!,
      whatsapp: whatsapp!,
      email: email!,
      tipoNegocio: tipoNegocio!,
      aceiteTexto: textoAceite,
      resumo: [`Agendou conversa para ${quando} (${formato}).`, `Plano: ${plano || '(não montou)'}`, ...conversa].join('\n'),
    };
    await salvarContato(env.DB, contato);
    await salvarAgendamento(env.DB, { inicio: new Date(inicio).toISOString(), formato: formato!, plano, nome: nome!, whatsapp: whatsapp!, eventoId });
    try {
      await avisarAgendamento(env, { quando, formato: formato!, plano, nome: nome!, whatsapp: whatsapp!, email: email!, tipoNegocio: tipoNegocio! });
    } catch (erro) {
      console.error('Aviso por e-mail falhou; o agendamento ficou salvo.', erro);
    }
    return Response.json({ ok: true, inicio: new Date(inicio).toISOString(), fim: new Date(fim).toISOString(), quando, formato });
  } catch (erro) {
    console.error(erro);
    return Response.json({ erro: 'Não consegui marcar agora. Fale com o Carlos no WhatsApp.' }, { status: 502 });
  }
};

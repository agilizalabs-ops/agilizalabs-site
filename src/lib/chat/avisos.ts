// E-mails para o Carlos: aviso de contato novo e resumo semanal do assistente.
// Saem pelo Email Routing do Cloudflare para o Gmail que já recebe o contato@.
import { EmailMessage } from 'cloudflare:email';
import type { NovoContato, resumoDaSemana } from './banco';

function base64Utf8(texto: string) {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}

async function enviar(env: Env, assunto: string, corpo: string) {
  const mime = [
    `From: Assistente da Agiliza <${env.AVISOS_DE}>`,
    `To: ${env.AVISOS_PARA}`,
    `Subject: =?UTF-8?B?${base64Utf8(assunto)}?=`,
    `Message-ID: <${crypto.randomUUID()}@agilizalabs.com.br>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Utf8(corpo).replace(/.{76}/g, '$&\r\n'),
  ].join('\r\n');
  await env.AVISOS.send(new EmailMessage(env.AVISOS_DE, env.AVISOS_PARA, mime));
}

export function avisarContato(env: Env, c: NovoContato) {
  const whatsapp = c.whatsapp.replace(/\D/g, '');
  return enviar(
    env,
    `Contato novo no site: ${c.nome} (${c.tipoNegocio})`,
    [
      `Nome: ${c.nome}`,
      `WhatsApp: ${c.whatsapp}  ->  https://wa.me/${whatsapp.startsWith('55') ? whatsapp : `55${whatsapp}`}`,
      `E-mail: ${c.email}`,
      `Tipo de negócio: ${c.tipoNegocio}`,
      '',
      'Aceite:',
      c.aceiteTexto,
      '',
      'Resumo da conversa com o assistente:',
      c.resumo || '(sem conversa)',
    ].join('\n'),
  );
}

const MOTIVO_LEGIVEL: Record<string, string> = {
  preco: 'Preço',
  qual_tier: 'Qual tipo de site',
  prazo: 'Prazo',
  pagamento: 'Pagamento',
  seo: 'SEO e Google',
  agenda_pix: 'Agenda com Pix',
  ia: 'Atendente com IA',
  portfolio: 'Projetos',
  outro: 'Outro',
};

export function enviarResumo(env: Env, r: Awaited<ReturnType<typeof resumoDaSemana>>) {
  const n = (v: unknown) => Number(v ?? 0);
  const conversas = n(r.totais.conversas);
  const contatos = n(r.totais.contatos);
  const positivas = n(r.totais.positivas);
  const negativas = n(r.totais.negativas);
  const respostas = n(r.totais.respostas);
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '-');

  const perguntas = r.naoSoube
    .map((linha) => {
      const msgs = JSON.parse(String((linha as { mensagens: string }).mensagens)) as { role: string; content: string }[];
      return msgs.filter((m) => m.role === 'user').pop()?.content;
    })
    .filter(Boolean)
    .map((p) => `- ${p}`);

  const lembrar = r.lembrar.map((l) => {
    const c = l as { nome: string; whatsapp: string; tipo_negocio: string; criado_em: string };
    return `- ${c.nome} (${c.tipo_negocio}), ${c.whatsapp}, contato desde ${c.criado_em.slice(0, 10)}`;
  });

  return enviar(
    env,
    `Assistente da Agiliza: ${conversas} conversas e ${contatos} contatos na semana`,
    [
      'Resumo dos últimos 7 dias',
      '',
      `Conversas: ${conversas}`,
      `Viraram contato (conversão): ${contatos} (${pct(contatos, conversas)})`,
      `Resolvidas sem você (deflexão): ${n(r.totais.sem_ajuda)} (${pct(n(r.totais.sem_ajuda), conversas)})`,
      `Satisfação: ${positivas} positivas, ${negativas} negativas (${pct(positivas, positivas + negativas)} positivas)`,
      `Tempo médio de resposta da IA: ${respostas ? (n(r.totais.ms) / respostas / 1000).toFixed(1) : '-'} s`,
      '',
      'Motivos mais comuns:',
      ...(r.motivos.length
        ? (r.motivos as { motivo: string; n: number }[]).map((m) => `- ${MOTIVO_LEGIVEL[m.motivo] ?? m.motivo}: ${m.n}`)
        : ['- nenhum']),
      '',
      'Perguntas que a IA não soube responder (melhore o catálogo ou o site):',
      ...(perguntas.length ? perguntas : ['- nenhuma']),
      '',
      'Contatos para relembrar esta semana (3, 6 ou 9 meses):',
      ...(lembrar.length ? lembrar : ['- nenhum']),
    ].join('\n'),
  );
}

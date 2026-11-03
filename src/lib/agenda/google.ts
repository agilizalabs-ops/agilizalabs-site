// Google Agenda por conta de serviço: o Carlos compartilha a agenda com o e-mail da conta,
// e o site lê os horários ocupados e cria os eventos. Sem login que expira.
import type { Intervalo } from './horarios';

const API = 'https://www.googleapis.com/calendar/v3';

export interface ContaGoogle {
  email: string;
  /** Chave privada PEM da conta de serviço (o campo private_key do JSON). */
  chave: string;
  agendaId: string;
}

export function contaConfigurada(env: Env): ContaGoogle | null {
  if (!env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_KEY || !env.AGENDA_ID) return null;
  return { email: env.GOOGLE_SA_EMAIL, chave: env.GOOGLE_SA_KEY.replace(/\\n/g, '\n'), agendaId: env.AGENDA_ID };
}

const base64url = (dados: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof dados === 'string' ? new TextEncoder().encode(dados) : new Uint8Array(dados);
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function token(conta: ContaGoogle) {
  const agora = Math.floor(Date.now() / 1000);
  const cabecalho = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const corpo = base64url(
    JSON.stringify({ iss: conta.email, scope: 'https://www.googleapis.com/auth/calendar', aud: 'https://oauth2.googleapis.com/token', iat: agora, exp: agora + 3600 }),
  );
  const der = Uint8Array.from(atob(conta.chave.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) => c.charCodeAt(0));
  const chave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(`${cabecalho}.${corpo}`));

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cabecalho}.${corpo}.${base64url(assinatura)}` }),
  });
  if (!resposta.ok) throw new Error(`Google token ${resposta.status}: ${await resposta.text()}`);
  return ((await resposta.json()) as { access_token: string }).access_token;
}

async function chamar(conta: ContaGoogle, caminho: string, corpo: unknown) {
  const resposta = await fetch(API + caminho, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await token(conta)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) throw new Error(`Google Agenda ${caminho} ${resposta.status}: ${await resposta.text()}`);
  return resposta.json() as Promise<any>;
}

export async function ocupados(conta: ContaGoogle, de: number, ate: number): Promise<Intervalo[]> {
  const dados = await chamar(conta, '/freeBusy', {
    timeMin: new Date(de).toISOString(),
    timeMax: new Date(ate).toISOString(),
    items: [{ id: conta.agendaId }],
  });
  const agendaDados = dados.calendars?.[conta.agendaId];
  if (agendaDados?.errors?.length) throw new Error(`Agenda sem acesso: ${JSON.stringify(agendaDados.errors)}`);
  return (agendaDados?.busy ?? []).map((b: { start: string; end: string }) => ({ inicio: Date.parse(b.start), fim: Date.parse(b.end) }));
}

export async function criarEvento(conta: ContaGoogle, evento: { titulo: string; descricao: string; inicio: number; fim: number }) {
  const dados = await chamar(conta, `/calendars/${encodeURIComponent(conta.agendaId)}/events`, {
    summary: evento.titulo,
    description: evento.descricao,
    start: { dateTime: new Date(evento.inicio).toISOString(), timeZone: 'America/Sao_Paulo' },
    end: { dateTime: new Date(evento.fim).toISOString(), timeZone: 'America/Sao_Paulo' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
  });
  return dados.id as string;
}

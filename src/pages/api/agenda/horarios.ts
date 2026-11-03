import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { agenda } from '../../../data/agenda';
import { contaConfigurada, ocupados } from '../../../lib/agenda/google';
import { horariosLivres } from '../../../lib/agenda/horarios';

export const prerender = false;

// Horários livres dos próximos dias, já descontado o que está ocupado no Google Agenda.
export const GET: APIRoute = async () => {
  const conta = contaConfigurada(env);
  if (!conta) return Response.json({ erro: 'Agenda ainda não configurada.' }, { status: 503 });
  try {
    const agora = Date.now();
    const dias = horariosLivres(agora, await ocupados(conta, agora, agora + (agenda.diasAFrente + 1) * 86_400_000));
    return Response.json(
      { dias, proximos: dias.flatMap((d) => d.horarios.map((h) => ({ ...h, rotulo: `${d.rotulo}, ${h.hora}` }))).slice(0, 3), formatos: agenda.formatos },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (erro) {
    console.error(erro);
    return Response.json({ erro: 'Não consegui ler a agenda agora.' }, { status: 502 });
  }
};

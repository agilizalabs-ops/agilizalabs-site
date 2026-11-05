import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { limparDominio } from '../../lib/express-envio';

export const prerender = false;

// Confere na consulta pública do Registro.br (RDAP) se o .com.br está livre: 404 = livre, 200 = já tem dono.
export const GET: APIRoute = async ({ url, request }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  if (!(await env.LIMITE_EXPRESS.limit({ key: `dominio:${ip}` })).success) return Response.json({ nome: '', disponivel: null }, { status: 429 });
  const nome = limparDominio(url.searchParams.get('nome'));
  if (nome.length < 2) return Response.json({ nome, disponivel: null });
  try {
    const r = await fetch(`https://rdap.registro.br/domain/${nome}.com.br`, { headers: { Accept: 'application/rdap+json' } });
    const disponivel = r.status === 404 ? true : r.ok ? false : null;
    return Response.json({ nome, disponivel }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch {
    return Response.json({ nome, disponivel: null });
  }
};

// Conversas e contatos no D1. Conversas expiram em 90 dias; contatos em 12 meses.
import type { Mensagem, RespostaAssistente } from './assistente';

const DIA = 86_400_000;
const agora = () => new Date();
const daquiA = (dias: number) => new Date(Date.now() + dias * DIA).toISOString();

export const LIMITE_MENSAGENS = 20;

export interface Conversa {
  id: string;
  mensagens: Mensagem[];
}

export async function abrirConversa(db: D1Database, id: string | undefined): Promise<Conversa> {
  if (id) {
    const linha = await db.prepare('SELECT id, mensagens FROM conversas WHERE id = ?').bind(id).first<{ id: string; mensagens: string }>();
    if (linha) return { id: linha.id, mensagens: JSON.parse(linha.mensagens) };
  }
  const nova = { id: crypto.randomUUID(), mensagens: [] };
  const hoje = agora().toISOString();
  await db
    .prepare('INSERT INTO conversas (id, criada_em, atualizada_em, expira_em) VALUES (?, ?, ?, ?)')
    .bind(nova.id, hoje, hoje, daquiA(90))
    .run();
  return nova;
}

export async function salvarResposta(db: D1Database, conversa: Conversa, resposta: RespostaAssistente, ms: number) {
  await db
    .prepare(
      `UPDATE conversas SET mensagens = ?, atualizada_em = ?, respostas = respostas + 1, tempo_resposta_ms = tempo_resposta_ms + ?,
       motivo = COALESCE(motivo, ?), nao_soube = MAX(nao_soube, ?) WHERE id = ?`,
    )
    .bind(JSON.stringify(conversa.mensagens), agora().toISOString(), ms, resposta.motivo, resposta.sabe_responder ? 0 : 1, conversa.id)
    .run();
}

export interface NovoContato {
  conversaId?: string;
  nome: string;
  whatsapp: string;
  email: string;
  tipoNegocio: string;
  aceiteTexto: string;
  resumo: string;
}

export async function salvarContato(db: D1Database, c: NovoContato) {
  const hoje = agora().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO contatos (id, criado_em, expira_em, conversa_id, nome, whatsapp, email, tipo_negocio, aceite_texto, aceite_em, resumo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), hoje, daquiA(365), c.conversaId ?? null, c.nome, c.whatsapp, c.email, c.tipoNegocio, c.aceiteTexto, hoje, c.resumo),
    db.prepare('UPDATE conversas SET virou_contato = 1 WHERE id = ?').bind(c.conversaId ?? ''),
  ]);
}

export interface NovoAgendamento {
  inicio: string;
  formato: string;
  plano: string;
  nome: string;
  whatsapp: string;
  eventoId: string;
}

export async function salvarAgendamento(db: D1Database, a: NovoAgendamento) {
  const hoje = agora().toISOString();
  await db
    .prepare(`INSERT INTO agendamentos (id, criado_em, expira_em, inicio, formato, plano, nome, whatsapp, evento_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), hoje, daquiA(365), a.inicio, a.formato, a.plano, a.nome, a.whatsapp, a.eventoId)
    .run();
}

export async function salvarAvaliacao(db: D1Database, conversaId: string, nota: 1 | -1) {
  await db.prepare('UPDATE conversas SET csat = ? WHERE id = ?').bind(nota, conversaId).run();
}

export async function mensagensDaConversa(db: D1Database, id: string | undefined): Promise<Mensagem[]> {
  if (!id) return [];
  const linha = await db.prepare('SELECT mensagens FROM conversas WHERE id = ?').bind(id).first<{ mensagens: string }>();
  return linha ? JSON.parse(linha.mensagens) : [];
}

export async function apagarExpirados(db: D1Database) {
  const hoje = agora().toISOString();
  await db.batch([
    db.prepare('DELETE FROM conversas WHERE expira_em < ?').bind(hoje),
    db.prepare('DELETE FROM contatos WHERE expira_em < ?').bind(hoje),
    db.prepare('DELETE FROM agendamentos WHERE expira_em < ?').bind(hoje),
  ]);
}

export async function resumoDaSemana(db: D1Database) {
  const desde = new Date(Date.now() - 7 * DIA).toISOString();
  const [totais, motivos, naoSoube, lembrar, agendados] = await db.batch([
    db
      .prepare(
        `SELECT COUNT(*) AS conversas, SUM(virou_contato) AS contatos, SUM(nao_soube = 0 AND virou_contato = 0) AS sem_ajuda,
         SUM(csat = 1) AS positivas, SUM(csat = -1) AS negativas, SUM(tempo_resposta_ms) AS ms, SUM(respostas) AS respostas
         FROM conversas WHERE criada_em >= ? AND respostas > 0`,
      )
      .bind(desde),
    db.prepare('SELECT motivo, COUNT(*) AS n FROM conversas WHERE criada_em >= ? AND motivo IS NOT NULL GROUP BY motivo ORDER BY n DESC').bind(desde),
    db.prepare('SELECT mensagens FROM conversas WHERE criada_em >= ? AND nao_soube = 1 ORDER BY criada_em DESC LIMIT 10').bind(desde),
    // Contatos que completam 3, 6 ou 9 meses nesta semana: hora de relembrar.
    db.prepare(
      `SELECT nome, whatsapp, tipo_negocio, criado_em FROM contatos
       WHERE CAST(julianday('now') - julianday(criado_em) AS INTEGER) % 90 BETWEEN 83 AND 89
       AND julianday('now') - julianday(criado_em) > 30 ORDER BY criado_em`,
    ),
    db.prepare('SELECT COUNT(*) AS n FROM agendamentos WHERE criado_em >= ?').bind(desde),
  ]);
  return { totais: totais.results[0] as Record<string, number | null>, motivos: motivos.results, naoSoube: naoSoube.results, lembrar: lembrar.results, agendamentos: Number((agendados.results[0] as { n: number }).n) };
}

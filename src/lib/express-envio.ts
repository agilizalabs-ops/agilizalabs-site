// O que o cliente do Express preenche em /express/enviar/<codigo>.
// Tudo que vem do navegador passa por limparEnvio: formato fixo, textos e listas com limite.

export const ramos = {
  beleza: 'Beleza e saúde',
  servicos: 'Serviços e casa',
  comida: 'Comida e bebida',
  loja: 'Loja e vitrine',
} as const;
export type Ramo = keyof typeof ramos;

export const diasDaSemana = [
  ['seg', 'Segunda'],
  ['ter', 'Terça'],
  ['qua', 'Quarta'],
  ['qui', 'Quinta'],
  ['sex', 'Sexta'],
  ['sab', 'Sábado'],
  ['dom', 'Domingo'],
] as const;

export interface Servico {
  nome: string;
  preco: string;
  detalhe: string;
}
export interface Horario {
  dia: (typeof diasDaSemana)[number][0];
  aberto: boolean;
  abre: string;
  fecha: string;
}
export interface DadosEnvio {
  nome: string;
  frase: string;
  ramo: Ramo | '';
  cor: string;
  servicos: Servico[];
  fotos: string[];
  logo: string;
  whatsapp: string;
  instagram: string;
  horario: Horario[];
  atendimento: 'local' | 'domicilio' | 'ambos';
  endereco: string;
  bairros: string;
  documento: string;
  dominios: [string, string];
  observacoes: string;
}

export const MAX_FOTOS = 8;

export function envioInicial(p: { negocio: string; whatsapp: string }): DadosEnvio {
  return {
    nome: p.negocio,
    frase: '',
    ramo: '',
    cor: '',
    servicos: [{ nome: '', preco: '', detalhe: '' }],
    fotos: [],
    logo: '',
    whatsapp: p.whatsapp,
    instagram: '',
    horario: diasDaSemana.map(([dia]) => ({ dia, aberto: dia !== 'dom', abre: '08:00', fecha: dia === 'sab' ? '12:00' : '18:00' })),
    atendimento: 'local',
    endereco: '',
    bairros: '',
    documento: '',
    dominios: ['', ''],
    observacoes: '',
  };
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const hora = (v: unknown, padrao: string) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : padrao);
/** Só chaves de foto deste pedido (express/<pedido>/<id>): ninguém aponta para a foto de outro cliente. */
const chaveFoto = (v: unknown, pedidoId: string) =>
  typeof v === 'string' && v.startsWith(`express/${pedidoId}/`) && /^express\/express-[\w-]+\/[\w-]+$/.test(v) ? v : '';

/** Só domínio .com.br, só letras, números e hífen. Devolve sem o .com.br. */
export function limparDominio(v: unknown) {
  const nome = texto(v, 80)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.com\.br\/?$/, '')
    .replace(/[^a-z0-9-]/g, '');
  return nome.replace(/^-+|-+$/g, '').slice(0, 26);
}

export function limparEnvio(bruto: unknown, base: DadosEnvio, pedidoId: string): DadosEnvio {
  const d = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>;
  const lista = (v: unknown) => (Array.isArray(v) ? v : []);
  const ramo = typeof d.ramo === 'string' && d.ramo in ramos ? (d.ramo as Ramo) : '';
  const horarioRecebido = lista(d.horario) as Partial<Horario>[];
  const dominios = lista(d.dominios);
  return {
    nome: texto(d.nome, 80) || base.nome,
    frase: texto(d.frase, 140),
    ramo,
    cor: typeof d.cor === 'string' && /^#[0-9a-f]{6}$/i.test(d.cor) ? d.cor.toLowerCase() : '',
    servicos: (lista(d.servicos) as Partial<Servico>[])
      .slice(0, 30)
      .map((s) => ({ nome: texto(s?.nome, 80), preco: texto(s?.preco, 30), detalhe: texto(s?.detalhe, 160) })),
    fotos: lista(d.fotos).map((f) => chaveFoto(f, pedidoId)).filter(Boolean).slice(0, MAX_FOTOS),
    logo: chaveFoto(d.logo, pedidoId),
    whatsapp: texto(d.whatsapp, 20).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11),
    instagram: texto(d.instagram, 40).replace(/^@/, '').replace(/[^\w.]/g, ''),
    horario: diasDaSemana.map(([dia], i) => {
      const h = horarioRecebido.find((x) => x?.dia === dia) ?? base.horario[i];
      return { dia, aberto: h?.aberto === true, abre: hora(h?.abre, '08:00'), fecha: hora(h?.fecha, '18:00') };
    }),
    atendimento: d.atendimento === 'domicilio' || d.atendimento === 'ambos' ? d.atendimento : 'local',
    endereco: texto(d.endereco, 160),
    bairros: texto(d.bairros, 240),
    documento: texto(d.documento, 20).replace(/\D/g, '').slice(0, 14),
    dominios: [limparDominio(dominios[0]), limparDominio(dominios[1])],
    observacoes: texto(d.observacoes, 1000),
  };
}

/** O que ainda falta para mandar à equipe. Vazio = pode enviar. */
export function faltando(d: DadosEnvio) {
  const f: string[] = [];
  if (!d.nome) f.push('o nome do negócio');
  if (!d.ramo) f.push('o ramo');
  if (!d.servicos.some((s) => s.nome)) f.push(d.ramo === 'loja' ? 'pelo menos 1 produto' : 'pelo menos 1 serviço');
  if (d.fotos.length < 1) f.push('pelo menos 1 foto');
  if (d.whatsapp.length < 10) f.push('o WhatsApp de atendimento');
  if (d.atendimento !== 'domicilio' && !d.endereco) f.push('o endereço');
  if (d.atendimento !== 'local' && !d.bairros) f.push('os bairros que você atende');
  if (d.documento.length !== 11 && d.documento.length !== 14) f.push('o CPF ou CNPJ para o domínio');
  if (!d.dominios[0]) f.push('o domínio que você quer');
  return f;
}

export async function lerEnvio(db: D1Database, pedidoId: string) {
  const linha = await db
    .prepare('SELECT dados, etapa, enviado_em AS enviadoEm FROM express_envios WHERE pedido_id = ?')
    .bind(pedidoId)
    .first<{ dados: string; etapa: number; enviadoEm: string | null }>();
  return linha ? { dados: JSON.parse(linha.dados) as DadosEnvio, etapa: linha.etapa, enviadoEm: linha.enviadoEm } : null;
}

export async function salvarEnvio(db: D1Database, pedidoId: string, dados: DadosEnvio, etapa: number) {
  await db
    .prepare(
      `INSERT INTO express_envios (pedido_id, dados, etapa, atualizado_em) VALUES (?, ?, ?, ?)
       ON CONFLICT (pedido_id) DO UPDATE SET dados = excluded.dados, etapa = excluded.etapa, atualizado_em = excluded.atualizado_em`,
    )
    .bind(pedidoId, JSON.stringify(dados), etapa, new Date().toISOString())
    .run();
}

/** Marca como enviado. Devolve true só na primeira vez, para o aviso ao Carlos sair uma vez. */
export async function concluirEnvio(db: D1Database, pedidoId: string) {
  const r = await db
    .prepare('UPDATE express_envios SET enviado_em = ? WHERE pedido_id = ? AND enviado_em IS NULL')
    .bind(new Date().toISOString(), pedidoId)
    .run();
  return r.meta.changes === 1;
}

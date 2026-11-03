// Catálogo dos Tiers: a única fonte de nome, preço e escopo de cada tipo de site.
// Página, dúvidas, dados para o Google e links de cobrança leem daqui.
// Valores em reais. Rascunho: os preços ainda são a proposta de 01 Empresa/tipos-de-projeto.md.

export interface FormaDePagamento {
  nome: 'Pago uma vez' | 'Com Cuidado' | 'Projeto';
  setup: number;
  /** Até onde vai o setup, quando é uma faixa (ex.: e-commerce). */
  setupAte?: number;
  mensal?: number;
  aPartirDe?: boolean;
  nota: string;
}

export interface Tier {
  id: 'presenca' | 'institucional' | 'conteudo' | 'loja';
  nome: string;
  para: string;
  exemplos: string;
  prazo: string;
  entra: string[];
  /** O que só vem no plano com Cuidado. */
  noCuidado?: string[];
  opcionais?: { nome: string; texto: string }[];
  formas: FormaDePagamento[];
}

export const tiers: Tier[] = [
  {
    id: 'presenca',
    nome: 'Presença',
    para: 'Para quem trabalha sozinho',
    exemplos: 'Manicure, personal, fotógrafo, diarista, professor particular',
    prazo: 'No ar em 7 dias úteis',
    entra: [
      'SEO profissional para aparecer com clareza no Google e nas respostas de IA',
      'Site de 1 página com seus serviços, preços e fotos',
      'Google Perfil criado ou ajustado',
      'Botão de WhatsApp com mensagem pronta e um QR code para o balcão',
    ],
    noCuidado: ['Atendente com IA treinado com os dados do seu negócio, até 300 conversas por mês', 'Site sempre no ar e 1 alteração por mês'],
    opcionais: [
      {
        nome: 'Agenda com sinal por Pix',
        texto: 'Sua cliente escolhe o horário no site e paga o sinal pelo Pix. Você liga o sinal nas épocas de agenda cheia. Valor combinado na conversa.',
      },
    ],
    formas: [
      { nome: 'Pago uma vez', setup: 1000, nota: '30% para começar e 70% quando aprovar o layout. Alterações depois são cobradas à parte.' },
      { nome: 'Com Cuidado', setup: 500, mensal: 97, nota: 'A mensalidade cobre hospedagem, o atendente com IA e o meu cuidado com o site.' },
    ],
  },
  {
    id: 'institucional',
    nome: 'Institucional',
    para: 'Para empresa com endereço e equipe',
    exemplos: 'Oficina, clínica, loja de bairro, restaurante, prestador de serviço',
    prazo: 'No ar em 15 dias úteis',
    entra: [
      'SEO profissional, com uma página por serviço e o nome da cidade',
      'Até 5 páginas: início, serviços, sobre, contato e mais uma',
      'Formulário de orçamento, WhatsApp e mapa',
      'Textos revisados com você',
    ],
    noCuidado: ['Atendente com IA treinado com os dados da sua empresa', 'Site sempre no ar e 3 alterações por mês'],
    formas: [
      { nome: 'Pago uma vez', setup: 2400, nota: '30% para começar e 70% quando aprovar o layout. Alterações depois são cobradas à parte.' },
      { nome: 'Com Cuidado', setup: 1400, mensal: 149, nota: 'A mensalidade cobre hospedagem, o atendente com IA e o meu cuidado com o site.' },
    ],
  },
  {
    id: 'conteudo',
    nome: 'Conteúdo e News',
    para: 'Para quem publica toda semana',
    exemplos: 'Portal de notícias, rádio, blog, associação',
    prazo: 'Prazo combinado na proposta',
    entra: [
      'SEO profissional em cada matéria, pronta para o Google',
      'Painel para a sua equipe publicar sem depender de ninguém',
      'Editorias, busca e notícias relacionadas',
      'Espaços para anunciantes',
    ],
    opcionais: [
      {
        nome: 'Robô de notícias com IA',
        texto: 'Busca as notícias oficiais da região, escreve a matéria e entrega para a redação aprovar. Valor combinado na conversa.',
      },
    ],
    formas: [{ nome: 'Projeto', setup: 3500, aPartirDe: true, nota: 'Valor fechado depois de uma conversa sobre a sua redação.' }],
  },
  {
    id: 'loja',
    nome: 'E‑commerce',
    para: 'Para quem vende produto',
    exemplos: 'Loja de roupa, artesanato, alimentos, peças',
    prazo: 'No ar em 15 dias úteis',
    entra: [
      'SEO profissional para os seus produtos aparecerem na busca',
      'Loja na Nuvemshop, Shopify ou Loja Integrada, com Pix e cartão',
      'Visual com a sua marca e até 30 produtos cadastrados',
      '1 hora de treinamento para você cadastrar sozinho',
    ],
    noCuidado: ['Atendente com IA que responde dúvidas sobre os produtos'],
    formas: [{ nome: 'Com Cuidado', setup: 2500, setupAte: 4000, mensal: 197, nota: 'Conforme o número de produtos. A plataforma você paga direto.' }],
  },
];

export const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

/** Preço exibido no letreiro: sempre o pago uma vez, para não esconder a mensalidade. */
export function precoDeVitrine(tier: Tier) {
  const unico = tier.formas.find((f) => f.nome !== 'Com Cuidado') ?? tier.formas[0];
  return brl(unico.setup);
}

export function precoDaForma(f: FormaDePagamento) {
  const setup = f.setupAte ? `${brl(f.setup)} a ${brl(f.setupAte)}` : brl(f.setup);
  const base = f.aPartirDe ? `a partir de ${setup}` : setup;
  return f.mensal ? `${base} + ${brl(f.mensal)}/mês` : base;
}

/** Programa Fundadores: 10% no setup e 3 meses de Cuidado grátis. */
export const fundadores = { descontoSetup: 0.1, mesesDeCuidadoGratis: 3 };

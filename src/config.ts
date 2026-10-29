// Dados do negócio usados no site inteiro. Preencha antes de publicar.
export const site = {
  nome: 'Agiliza Labs',
  slogan: 'Agilize o que trava.',
  url: 'https://agilizalabs.com.br',
  // DDI + DDD + número, só dígitos. Ex.: 5511912345678
  whatsapp: '5547984182023',
  cidade: 'São Bento do Sul',
  uf: 'SC',
  regiao: 'São Bento do Sul, Rio Negrinho, Campo Alegre e região',
  instagram: 'agilizalabs',
  // Com o e-mail vazio, os links de e-mail somem do site.
  email: 'contato@agilizalabs.com.br',
  cnpj: '59.816.068/0001-96',
  horario: 'Segunda a sexta, das 8h às 18h',
  fundadores: { total: 6, preenchidas: 0, prazo: '15/12/2026' },
};

if (site.whatsapp.startsWith('5500')) {
  console.warn('[config] Número de WhatsApp ainda é o de exemplo. Edite src/config.ts antes de publicar.');
}

export function linkWhatsApp(mensagem = 'Oi! Vi o site da Agiliza Labs e quero um diagnóstico grátis.') {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

// Cases e projetos. A seção "Projetos" só aparece quando houver pelo menos um.
// status: 'no ar' (padrão), 'em desenvolvimento' ou 'demonstrativo' (feito para mostrar, sem cliente real).
export const projetos: {
  nome: string;
  tipo: string;
  resumo: string;
  resultado?: string;
  link?: string;
  status?: 'no ar' | 'em desenvolvimento' | 'demonstrativo';
}[] = [
  {
    nome: 'Nova FM 87,5',
    tipo: 'Site e app Android',
    resumo: 'Site da rádio de São Bento do Sul com player ao vivo, programação, equipe, promoções com inscrição pelo WhatsApp, página para anunciantes e aplicativo próprio para Android.',
    link: 'https://novafmsbs.com.br',
  },
  {
    nome: 'Portal de notícias da Nova FM',
    tipo: 'Portal de notícias',
    resumo: 'Portal de notícias de São Bento do Sul e região, com editorias, busca, player da rádio integrado, espaços para anunciantes e um canal para a comunidade mandar perguntas.',
    link: 'https://portalnovafmsbs.com.br',
  },
  {
    nome: 'Jornal Liberdade',
    tipo: 'Automação com IA',
    resumo: 'Automação com inteligência artificial para a redação do portal de notícias do jornal.',
  },
  {
    nome: 'LC Pinturas e Reformas',
    tipo: 'Site',
    resumo: 'Site bilíngue, em português e espanhol, para empresa de pintura de alto padrão do litoral norte de Santa Catarina, com portfólio de obras e pedido de orçamento guiado.',
    link: 'https://lcpinturas.com.br',
    status: 'em desenvolvimento',
  },
  {
    nome: 'ASP São Bento do Sul',
    tipo: 'Site',
    resumo: 'Site da Associação dos Servidores Públicos Municipais, com notícias, convênios, eventos e área para se associar.',
    link: 'https://aspsbs.com.br',
    status: 'em desenvolvimento',
  },
];

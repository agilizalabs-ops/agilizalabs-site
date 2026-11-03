// Conteúdo da página que também é a base de conhecimento do assistente com IA.
// Mudou aqui, muda no site e no que a IA responde.

export const passos = [
  { titulo: 'Conversa de 15 minutos', texto: 'Pessoalmente ou no WhatsApp. Eu anoto o que você faz, quem é o seu cliente e o que te preocupa.' },
  { titulo: 'Entrada de 30% e prazo por escrito', texto: 'Pelo Pix. A produção começa no mesmo dia.' },
  { titulo: 'Você aprova no próprio layout', texto: 'O layout chega num link com dois botões: aprovar ou pedir uma correção.' },
  { titulo: 'Paga o restante e vai ao ar', texto: 'Pix ou cartão, ali mesmo. O site entra no ar em até 1 dia útil.' },
];

export const seo = [
  'Google Perfil completo, que é o que mais pesa no "perto de mim"',
  'Nome, endereço e telefone iguais no site, no Google e nas redes',
  'Dados estruturados que o Google e as IAs leem para saber o que você faz e onde',
  'Títulos e páginas com o serviço e a cidade',
  'Perguntas frequentes escritas do jeito que as pessoas pesquisam',
  'Cadastro no Google e no Bing, que alimenta a busca do ChatGPT',
  'Nota mínima de 90 no teste de velocidade do Google, no celular',
];

export const robo = [
  { etapa: 'Fonte oficial', texto: 'A prefeitura publica: "Inscrições abertas para o curso de panificação até sexta."' },
  { etapa: 'IA escreve', texto: 'Título, linha fina, texto próprio, categoria e tags no padrão do jornal.' },
  { etapa: 'Auditoria', texto: 'Todo número, nome e citação precisa existir no original. Se não bater, a matéria não segue.' },
  { etapa: 'Redação aprova', texto: 'Chega no painel como "aguardando aprovação". Nada vai ao ar sozinho.' },
];

export const duvidas = [
  { p: 'E se eu não gostar do layout?', r: 'Você pede uma correção antes de aprovar, e os 70% só são cobrados depois que você clica em "Aprovar layout".' },
  { p: 'Qual a diferença entre pagar uma vez e ter o Cuidado?', r: 'Pago uma vez, você recebe o site aprovado e fica com ele. Cada alteração depois é cobrada à parte. Com Cuidado, você paga menos no começo, e a mensalidade cobre a hospedagem, o atendente com IA e o meu acompanhamento para o site converter mais. No longo prazo o Cuidado custa mais, e em troca você não precisa pensar no site.' },
  { p: 'O que faz o atendente com IA?', r: 'Ele aprende os seus serviços, preços e horários e responde as dúvidas dos seus clientes a qualquer hora. Vem no plano com Cuidado e custa bem menos do que uma assinatura de IA por conta própria.' },
  { p: 'Vocês garantem primeiro lugar no Google?', r: 'Não. Ninguém controla a posição, e quem promete está chutando. O que eu garanto é o SEO feito do jeito que o Google e as IAs usam para escolher quem mostrar.' },
  { p: 'O domínio fica no meu nome?', r: 'Sim, o endereço .com.br é registrado no seu nome. Se um dia quiser sair, leva tudo.' },
  { p: 'Meu sobrinho faz site. Por que eu pagaria você?', r: 'Ele pode fazer um ótimo site. Comigo vêm junto o SEO, o Google Perfil, o prazo por escrito e alguém que responde quando precisar mudar um preço.' },
];

/** Depoimentos reais de clientes. A IA só cita o que estiver aqui; vazio, ela não cita nenhum. */
export const depoimentos: { nome: string; negocio: string; texto: string }[] = [];

/** Texto da caixa de aceite do formulário do assistente. É gravado junto com o contato, como prova do que a pessoa aceitou. */
export const textoAceite =
  'Aceito que o Carlos me chame no WhatsApp sobre o meu pedido e me lembre dele a cada 3 meses, por até 1 ano. Posso pedir para parar quando quiser.';

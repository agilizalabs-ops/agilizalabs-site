// Cliente mínimo do Checkout Integrado da InfinitePay.
// Docs: https://www.infinitepay.io/checkout-documentacao
// Só roda no servidor: a InfiniteTag (handle) nunca vai para o navegador.

const API = 'https://api.checkout.infinitepay.io';

export interface ItemCheckout {
  descricao: string;
  /** Valor unitário em centavos (R$ 700,00 = 70000). */
  valorCentavos: number;
  quantidade?: number;
}

export interface ClienteCheckout {
  nome?: string;
  email?: string;
  /** Formato internacional: +5547999999999 */
  telefone?: string;
}

export interface NovoCheckout {
  /** Identificador nosso do pedido; volta no redirect como order_nsu. */
  pedido: string;
  itens: ItemCheckout[];
  cliente?: ClienteCheckout;
  urlRetorno: string;
}

export interface ConsultaPagamento {
  pedido: string;
  transacao: string;
  slug: string;
}

export interface Pagamento {
  pago: boolean;
  valorCentavos: number;
  valorPagoCentavos: number;
  metodo?: 'pix' | 'credit_card';
  parcelas?: number;
}

export class InfinitePay {
  constructor(private readonly handle: string) {
    if (!handle) throw new Error('INFINITEPAY_HANDLE não configurado.');
  }

  /** Cria o link de pagamento e devolve a URL do checkout. */
  async criarCheckout({ pedido, itens, cliente, urlRetorno }: NovoCheckout): Promise<string> {
    if (itens.length === 0) throw new Error('O checkout precisa de pelo menos 1 item.');
    for (const item of itens) {
      if (!Number.isInteger(item.valorCentavos) || item.valorCentavos <= 0) {
        throw new Error(`Valor inválido em "${item.descricao}": use centavos inteiros e positivos.`);
      }
    }

    const dados = await this.post('/links', {
      handle: this.handle,
      order_nsu: pedido,
      redirect_url: urlRetorno,
      items: itens.map((item) => ({
        description: item.descricao,
        price: item.valorCentavos,
        quantity: item.quantidade ?? 1,
      })),
      ...(cliente && { customer: semVazios({ name: cliente.nome, email: cliente.email, phone_number: cliente.telefone }) }),
    });

    if (typeof dados.url !== 'string') throw new Error(`Resposta sem URL de checkout: ${JSON.stringify(dados)}`);
    return dados.url;
  }

  /** Confirma no servidor da InfinitePay. Os parâmetros do redirect sozinhos não provam pagamento. */
  async consultarPagamento({ pedido, transacao, slug }: ConsultaPagamento): Promise<Pagamento> {
    const dados = await this.post('/payment_check', {
      handle: this.handle,
      order_nsu: pedido,
      transaction_nsu: transacao,
      slug,
    });
    return {
      pago: dados.success === true && dados.paid === true,
      valorCentavos: Number(dados.amount ?? 0),
      valorPagoCentavos: Number(dados.paid_amount ?? 0),
      metodo: dados.capture_method,
      parcelas: dados.installments,
    };
  }

  private async post(caminho: string, corpo: unknown): Promise<Record<string, any>> {
    const resposta = await fetch(API + caminho, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corpo),
    });
    if (!resposta.ok) throw new Error(`InfinitePay ${caminho} respondeu ${resposta.status}: ${await resposta.text()}`);
    return resposta.json();
  }
}

function semVazios<T extends Record<string, string | undefined>>(objeto: T) {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor)) as Partial<T>;
}

// Uma chamada ao Claude por mensagem, com resposta estruturada (texto + classificação).
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { instrucoes, MOTIVOS } from './conhecimento';

export type Mensagem = { role: 'user' | 'assistant'; content: string };

const Resposta = z.object({
  resposta: z.string(),
  motivo: z.enum(MOTIVOS),
  sabe_responder: z.boolean(),
  oferecer_contato: z.boolean(),
  tier_sugerido: z.enum(['presenca', 'institucional', 'conteudo', 'loja', 'nenhum']),
});
export type RespostaAssistente = z.infer<typeof Resposta>;

const ESFORCOS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
type Esforco = (typeof ESFORCOS)[number];

export interface Config {
  chave: string;
  modelo: string;
  esforco: string;
}

export async function responder(historico: Mensagem[], config: Config): Promise<RespostaAssistente> {
  if (!config.chave) throw new Error('ANTHROPIC_API_KEY não configurada.');
  const esforco: Esforco = (ESFORCOS as readonly string[]).includes(config.esforco) ? (config.esforco as Esforco) : 'low';
  const client = new Anthropic({ apiKey: config.chave, maxRetries: 1, timeout: 25_000 });

  const resposta = await client.messages.parse({
    model: config.modelo,
    max_tokens: 1500,
    system: [{ type: 'text', text: instrucoes(), cache_control: { type: 'ephemeral' } }],
    messages: historico,
    output_config: { effort: esforco, format: zodOutputFormat(Resposta) },
  });

  if (resposta.stop_reason === 'refusal' || !resposta.parsed_output) {
    throw new Error(`Sem resposta utilizável (stop_reason: ${resposta.stop_reason}).`);
  }
  return resposta.parsed_output;
}

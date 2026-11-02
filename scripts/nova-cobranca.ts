// Gera o link de pagamento do restante de um projeto.
// Uso:
//   node scripts/nova-cobranca.ts --id juliana-roscamp-restante --descricao "Site Agenda Cheia · 70% restante" \
//     --valor 700 --nome "Juliana Roscamp" --email juliana@exemplo.com --telefone +5547999999999 [--dias 15]
// O segredo vem de COBRANCA_SECRET (variável de ambiente ou .dev.vars) e precisa ser o mesmo do servidor.
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { assinarCobranca } from '../src/lib/cobranca.ts';

const { values } = parseArgs({
  options: {
    id: { type: 'string' },
    descricao: { type: 'string' },
    valor: { type: 'string' },
    nome: { type: 'string' },
    email: { type: 'string' },
    telefone: { type: 'string' },
    dias: { type: 'string', default: '15' },
    site: { type: 'string', default: 'https://agilizalabs.com.br' },
  },
});

const { id, descricao, valor, nome } = values;
if (!id || !descricao || !valor || !nome) {
  console.error('Faltou --id, --descricao, --valor (em reais) ou --nome.');
  process.exit(1);
}

const segredo = process.env.COBRANCA_SECRET ?? lerDevVars().COBRANCA_SECRET;
if (!segredo) {
  console.error('Defina COBRANCA_SECRET (o mesmo configurado no Cloudflare).');
  process.exit(1);
}

const valorCentavos = Math.round(Number(valor.replace(',', '.')) * 100);
if (!Number.isInteger(valorCentavos) || valorCentavos <= 0) {
  console.error(`Valor inválido: ${valor}`);
  process.exit(1);
}

const expira = new Date(Date.now() + Number(values.dias) * 86_400_000).toISOString();
const token = await assinarCobranca(
  { id, descricao, valorCentavos, cliente: { nome, email: values.email, telefone: values.telefone }, expira },
  segredo,
);

console.log(new URL(`/pagar/${token}`, values.site).href);

function lerDevVars(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8')
        .split('\n')
        .map((linha) => linha.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => [m[1], m[2]]),
    );
  } catch {
    return {};
  }
}

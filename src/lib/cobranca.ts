// Link de cobrança assinado: o valor e os dados do cliente viajam no próprio link,
// com assinatura HMAC. Ninguém consegue mudar o valor sem o segredo, e não precisamos de banco.
// Gere links com: node scripts/nova-cobranca.ts

export interface Cobranca {
  /** Identificador do pedido, ex.: "juliana-roscamp-restante". */
  id: string;
  descricao: string;
  valorCentavos: number;
  cliente: { nome: string; email?: string; telefone?: string };
  /** Data limite do link, ISO 8601. */
  expira: string;
}

const codificador = new TextEncoder();

export async function assinarCobranca(cobranca: Cobranca, segredo: string): Promise<string> {
  const dados = base64url(codificador.encode(JSON.stringify(cobranca)));
  const assinatura = await crypto.subtle.sign('HMAC', await chave(segredo), codificador.encode(dados));
  return `${dados}.${base64url(new Uint8Array(assinatura))}`;
}

/** Devolve a cobrança se a assinatura bater e o link não tiver expirado; senão, null. */
export async function lerCobranca(token: string, segredo: string, agora = new Date()): Promise<Cobranca | null> {
  const [dados, assinatura] = token.split('.');
  if (!dados || !assinatura) return null;
  try {
    const valida = await crypto.subtle.verify('HMAC', await chave(segredo), deBase64url(assinatura), codificador.encode(dados));
    if (!valida) return null;
    const cobranca: Cobranca = JSON.parse(new TextDecoder().decode(deBase64url(dados)));
    return new Date(cobranca.expira) > agora ? cobranca : null;
  } catch {
    return null;
  }
}

async function chave(segredo: string) {
  if (!segredo) throw new Error('COBRANCA_SECRET não configurado.');
  return crypto.subtle.importKey('raw', codificador.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(texto: string) {
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

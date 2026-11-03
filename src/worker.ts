// Entrada do Worker: o Astro atende as páginas; as rotinas agendadas cuidam do assistente.
import { handle } from '@astrojs/cloudflare/handler';
import { apagarExpirados, resumoDaSemana } from './lib/chat/banco';
import { enviarResumo } from './lib/chat/avisos';

export default {
  fetch: handle,
  async scheduled(controller, env) {
    await apagarExpirados(env.DB);
    // Segunda-feira, 08:00 em Brasília (o cron "0 11 * * 1" de wrangler.jsonc).
    if (controller.cron === '0 11 * * 1') await enviarResumo(env, await resumoDaSemana(env.DB));
  },
} satisfies ExportedHandler<Env>;

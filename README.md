# Site da Agiliza Labs

Landing page em Astro + Tailwind, sem JavaScript no navegador. Cores e fonte seguem `../01 Empresa/brand-book.md`.

## Antes de publicar

Edite `src/config.ts`:

- `whatsapp`: DDI + DDD + número, só dígitos (ex.: `5511912345678`). Enquanto for o número de exemplo, o build avisa no terminal.
- `cidade`, `uf`, `cnpj`, `email`, `instagram`.
- `fundadores.preenchidas`: atualize a cada cliente fundador fechado.
- `projetos`: adicione cases reais (a seção só aparece quando houver pelo menos um). Projetos feitos só para mostrar levam `demonstrativo: true`.

## Comandos

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:4321
npm run build    # gera a pasta dist/
npm run preview  # serve a dist/ localmente
```

## Publicar no Cloudflare Pages (grátis)

1. Suba esta pasta para um repositório no GitHub.
2. No Cloudflare, crie um projeto Pages conectado ao repositório: comando de build `npm run build`, pasta de saída `dist`.
3. Em Custom domains, adicione `agilizalabs.com.br` e siga as instruções de DNS no Registro.br.

## Estrutura

- `src/pages/index.astro`: página principal (textos, planos, dúvidas e comparação ficam no topo do arquivo).
- `src/pages/privacidade.astro`: política de privacidade (LGPD).
- `src/components/ChatDemo.astro`: demonstração de atendimento automático do hero.
- `src/layouts/Layout.astro`: cabeçalho, rodapé, SEO, dados estruturados e botão flutuante de WhatsApp.
- `src/styles/global.css`: tokens da marca.

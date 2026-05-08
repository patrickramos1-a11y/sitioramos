## Problema

Quando você abre o app pelo ícone fixado na tela inicial do iPhone (ou pelo link salvo), aparece uma versão antiga. Isso acontece porque:

1. Em deploys anteriores ficou registrado um **service worker** que cacheou a versão antiga no aparelho. Ele continua servindo o HTML/JS antigo mesmo depois de novos deploys.
2. O `start_url` do manifesto e o cache do iOS em modo "standalone" (PWA na tela inicial) também travam o app numa versão.
3. Hoje não temos nenhum mecanismo de "checar se há versão nova e recarregar".

O preview do navegador mostra a versão atual porque ele não tem SW antigo registrado.

## Objetivo

Sempre que o app abrir **com internet**, ele deve detectar que existe uma versão nova e atualizar automaticamente — tanto no link quanto no ícone da tela inicial.

## Plano

### 1. Service worker "kill-switch" em `/sw.js`

Criar `public/sw.js` que:
- Faz `skipWaiting` e `clients.claim` na ativação.
- Apaga **todos** os caches (`caches.keys()` → `caches.delete`).
- Navega cada client aberto adicionando `?sw-cleanup=<timestamp>` para forçar busca fresca.
- Em seguida chama `self.registration.unregister()`.

Resultado: aparelhos que já tinham SW antigo recebem este novo na próxima abertura, ele limpa o cache, recarrega a página, e se desregistra. Próximas aberturas passam a ir direto na rede.

### 2. Registro condicional no `main.tsx`

Manter o registro de `/sw.js` apenas em produção e fora do iframe/preview Lovable (já está assim). Garantir que ele seja registrado para que o kill-switch acima rode nos aparelhos atuais.

### 3. Detector de versão nova

- Gerar um `public/version.json` em build time com um id (`{ "build": "<timestamp>" }`) — usar um pequeno script no `vite.config.ts` (plugin `closeBundle`) ou um arquivo emitido com `define`.
- Embutir o mesmo id no bundle via `import.meta.env.VITE_BUILD_ID` (definido em `vite.config.ts` com `Date.now()` no momento do build).
- No app, criar `src/lib/versionCheck.ts` que:
  - Busca `/version.json` (com `cache: "no-store"`) na inicialização e ao voltar para a aba (`visibilitychange` / `focus`).
  - Se o `build` retornado for diferente do embutido **e** estiver online → mostra um toast "Nova versão disponível" com botão "Atualizar" que faz `location.reload()`.
  - Opcional: após 5s sem interação, recarrega automaticamente (configurável).

### 4. Botão manual "Atualizar app"

No componente `OfflineIndicator` (ou num menu adjacente), adicionar um item "Atualizar app" que:
- Chama `caches.keys()` + `caches.delete` para limpar tudo.
- Desregistra qualquer service worker remanescente.
- Faz `location.reload()`.

Assim, mesmo num cenário extremo, você consegue forçar a atualização com um toque.

### 5. Headers de cache (apenas observação)

A hospedagem da Lovable já serve `index.html`, `/sw.js` e `/manifest.webmanifest` com `Cache-Control: no-cache`, então não precisa mexer em config de hosting.

## Detalhes técnicos

- `public/sw.js` é estático e fica versionado no repo.
- `vite.config.ts` ganha `define: { "import.meta.env.VITE_BUILD_ID": JSON.stringify(Date.now().toString()) }` e um plugin que escreve `dist/version.json` no `closeBundle`.
- `versionCheck.ts` é chamado uma vez em `App.tsx` dentro de um `useEffect`.
- O toast usa o `sonner` já instalado.
- Nada muda no fluxo offline existente: o React Query persistido continua funcionando para leitura sem internet; a checagem de versão só roda quando online.

## Fora de escopo

- Não vamos transformar o app em PWA "completo" com cache de assets via Workbox (mantemos a abordagem atual de cache só do React Query).
- Não vamos mexer em `start_url`/`scope` do manifesto — mudar esses campos não atualiza ícones já instalados.

## O que você verá no fim

- Na próxima vez que abrir o ícone do iPhone com internet: o SW antigo é morto, o app recarrega sozinho na versão nova.
- Em deploys futuros: aparece um toast "Nova versão disponível — Atualizar" e/ou recarrega sozinho.
- Se algo travar: botão "Atualizar app" no indicador de status no topo.

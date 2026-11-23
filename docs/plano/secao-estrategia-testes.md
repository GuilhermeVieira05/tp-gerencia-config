# Seção do Plano de GC — Estratégia de Testes (Carlos)

> Insumo para o Plano de GC (modelo RUP): alimenta **3.2 Controle de Configuração e Mudanças** (testes como critério para uma mudança entrar na baseline) e a parte de garantia de qualidade da etapa de Commit do pipeline.

## 1. Objetivo

Garantir que cada commit na `main` tenha o comportamento verificado automaticamente, com resultado rápido, repetível e igual em qualquer máquina. A estratégia segue a pirâmide de testes: muitos testes baratos na base e poucos, mais lentos e mais realistas, no topo.

```
        ▲  Aceitação   (22 cenários, contêiner real, via rede)        → Mateus
       ╱ ╲
      ╱   ╲ Integração (55 casos, rotas + domínio, em processo)       → Carlos
     ╱     ╲
    ╱───────╲ Unidade  (116 casos, uma peça por vez, sem rede)        → Marcos e Carlos
```

## 2. Níveis de teste

| Nível | Pasta | O que exercita | O que fica de fora | Ferramentas | Casos |
|---|---|---|---|---|---|
| Unidade | `tests/unit/` | Uma função ou classe isolada. Dependências são substituídas por dublês | Rede, Express, outras camadas | Jest + ts-jest | 116 |
| Integração | `tests/integration/` | Rotas HTTP ligadas ao domínio e ao repositório em memória, no mesmo processo | Contêiner, `Dockerfile`, porta real | Jest + `supertest` | 55 |
| Aceitação | `tests/acceptance/` | A aplicação empacotada, como cliente externo | Código interno (caixa-preta) | Jest + `fetch` | 22 |

Cada nível pega uma classe de defeito que os outros deixam passar:

- **Unidade** localiza o defeito: se `validateTitle` quebra, só o teste dela falha.
- **Integração** pega erros de ligação entre as camadas: rota registrada na ordem errada, erro do domínio mapeado para o código HTTP errado, corpo da requisição lido de forma incorreta.
- **Aceitação** pega o que só aparece no artefato final: arquivo que não entrou na imagem, variável de ambiente errada. É descrita na seção de Qualidade e Aceitação (Mateus).

## 3. Ferramentas e configuração

| Item | Escolha |
|---|---|
| Executor | Jest 29 (`jest.config.js`, `roots: tests/`) |
| TypeScript | `ts-jest`, com `strict: true`: um teste com tipo errado falha na compilação |
| Cliente HTTP em processo | `supertest`, que chama o app Express sem abrir porta |
| Dublês | `jest.fn()` e objetos simples; sem biblioteca de mock adicional |
| Auxiliares | `tests/helpers/` (`make-app.ts`, `http-mocks.ts`). Não são executados como suíte |

Scripts em `package.json`:

| Comando | Roda |
|---|---|
| `npm run test:unit` | `tests/unit` |
| `npm run test:integration` | `tests/integration` |
| `npm test` | Unidade e integração (a aceitação roda à parte, pois exige a API no ar) |
| `npm run test:acceptance` | `tests/acceptance`, contra `BASE_URL` |

## 4. Testes de unidade

Marcos cobre o domínio (`validation`, `task-repository`, `task-service`). Carlos cobre a camada HTTP, e cada arquivo de código tem um arquivo de teste correspondente:

| Código (`src/http/`) | Teste (`tests/unit/`) | Casos | Como é isolado |
|---|---|---|---|
| `request-parsing.ts` | `request-parsing.test.ts` | 35 | Funções puras. Entrada `unknown`, saída tipada ou `ValidationError` |
| `task-controller.ts` | `task-controller.test.ts` | 17 | `TaskService` substituído por `jest.fn()`. `req` e `res` são dublês. Verifica o que foi chamado e o que foi respondido |
| `error-handler.ts` | `error-handler.test.ts` | 19 | Erros construídos à mão (domínio e `body-parser`). `console.error` silenciado e verificado |
| `task-routes.ts`, `health-routes.ts` | `routes.test.ts` | 11 | Lê a tabela de rotas do `Router` e chama cada handler com um controlador dublê |

O que cada arquivo verifica de importante:

- **`request-parsing`**: só os campos conhecidos passam adiante (um cliente não consegue forjar `id`, `status` ou `createdAt`); corpo que não é objeto, `description` que não é texto e filtros inválidos viram `ValidationError`; `dueDate: null` é preservado para permitir limpar a data.
- **`task-controller`**: cada método chama o serviço com os argumentos certos, responde com o status esperado (201 na criação, 204 sem corpo na remoção) e **não** chama o serviço quando a entrada é inválida. Os erros do domínio sobem sem tratamento.
- **`error-handler`**: `ValidationError` → 400, `NotFoundError` → 404, erro de cliente do `body-parser` → seu status, qualquer outra coisa → 500 genérico, sem vazar a mensagem interna, e com registro no log. Se a resposta já começou, delega ao Express.
- **`routes`**: a lista exata de rotas, `/summary` antes de `/:id` e cada rota ligada ao método certo do controlador.

## 5. Testes de integração

Sobem o app completo (`createApp`) com repositório em memória e chamam as rotas por `supertest`.

| Arquivo | Casos | Foco |
|---|---|---|
| `tasks.test.ts` | 20 | Caminho feliz de cada rota (criar, listar com filtros, resumo, consultar, editar, mudar status, remover) |
| `errors.test.ts` | 31 | 400 (corpo, filtros, status), 404 (id, rota, método), JSON malformado, corpo grande (413) e falha inesperada (500) |
| `task-flow.test.ts` | 3 | Jornada que atravessa várias rotas e confere o estado a cada passo, inclusive tarefa que vence o prazo |
| `health.test.ts` | 1 | `GET /health` |

Como os testes ficam determinísticos:

- `createApp(service)` aceita o `TaskService` por parâmetro. `makeApp()` injeta um **relógio controlável** e **ids previsíveis** (`id-1`, `id-2`...). Assim, `createdAt`, `updatedAt` e o cálculo de atrasadas podem ser verificados com valores exatos, sem depender da data real nem de UUID.
- **Cada teste cria um app novo**, com repositório vazio. Nenhum teste depende da ordem de execução nem enxerga dados de outro.
- Os testes de erro conferem também o **efeito colateral**: uma requisição recusada não cria nem altera nada.

## 6. Contrato HTTP e rastreabilidade

A tabela de rotas é a da seção de Qualidade e Aceitação (Mateus). Cada rota é coberta nos dois níveis:

| Rota | Sucesso | Erros | Integração | Aceitação |
|---|---|---|---|---|
| `GET /health` | 200 | — | `health.test.ts` | CA01 |
| `POST /tasks` | 201 | 400 | `tasks.test.ts`, `errors.test.ts` | CA02 |
| `GET /tasks` | 200 | 400 (filtro inválido) | `tasks.test.ts`, `errors.test.ts` | CA03 |
| `GET /tasks/summary` | 200 | — | `tasks.test.ts`, `task-flow.test.ts` | CA06 |
| `GET /tasks/:id` | 200 | 404 | `tasks.test.ts`, `errors.test.ts` | CA03 |
| `PATCH /tasks/:id` | 200 | 400, 404 | `tasks.test.ts`, `errors.test.ts` | CA04 |
| `PATCH /tasks/:id/status` | 200 | 400, 404 | `tasks.test.ts`, `errors.test.ts` | CA05 |
| `DELETE /tasks/:id` | 204 | 404 | `tasks.test.ts`, `errors.test.ts` | CA07 |

Toda resposta de erro tem o formato `{ "error": "mensagem" }`. Rota ou método desconhecido responde 404; erro inesperado responde 500 com mensagem genérica.

Além da tabela original, a camada HTTP **recusa com 400 um filtro inválido** em `GET /tasks` (por exemplo `?status=arquivada`), em vez de devolver lista vazia. Os testes de aceitação continuam passando, pois não testam esse caso.

Qualquer mudança nesse contrato altera a camada HTTP, os testes de integração e os de aceitação **no mesmo pull request**.

## 7. Convenções

- **Localização e nome:** `tests/<nível>/<assunto>.test.ts`, com um arquivo de teste por arquivo de código. Nomes dos casos em português, descrevendo o comportamento (`'recusa titulo em branco'`), e não o método.
- **Estrutura:** preparar, agir, verificar. Um comportamento por caso.
- **Caso de erro obrigatório:** toda rota e todo método que valida entrada tem testes do caminho de erro, não só do caminho feliz.
- **Determinismo:** nada de data real, UUID ou ordem entre testes. Relógio e gerador de ids são injetados.
- **Casos parametrizados** (`it.each`) para listas de entradas inválidas, para que cada entrada falhe com o próprio nome.
- **Sem estado compartilhado:** dublês e apps são criados em `beforeEach` ou dentro do caso.
- **Teste novo acompanha o código novo:** um pull request que altera `src/` sem teste não passa na revisão.

## 8. Onde rodam e critério de aprovação

| Quando | O que roda | Onde |
|---|---|---|
| Antes do pull request | `npm test` | Máquina do autor |
| Push na `main` | Etapa de Commit: `npm run build`, `test:unit`, `test:integration` | GitHub Actions (`commit-stage`) |
| Depois da Commit | Etapa de Aceitação | GitHub Actions (`acceptance-stage`) |
| Tag `vX.Y.Z` | Todas as etapas e o Lançamento | GitHub Actions |

Critério: **qualquer teste vermelho derruba a etapa**, e as etapas seguintes não rodam (`needs`). Não há tolerância a teste instável: um teste que falha de forma intermitente é corrigido ou removido, e não repetido até passar. Uma tag nunca gera release sobre um commit com teste vermelho.

## 9. Evidências

Medidas em 18/11/2026 na branch `carlos/camada-http-testes`:

| Evidência | Resultado |
|---|---|
| Testes (unidade + integração) | 171 passando, 11 suítes |
| Cobertura (`npx jest --coverage --collectCoverageFrom='src/**/*.ts'`) | 99,5% dos comandos, 100% dos ramos, 98,1% das funções, 100% das linhas |
| Cobertura de `src/http/` | 100% em todos os critérios |
| Testes de aceitação do Mateus contra esta camada HTTP | 22 de 22 passando |
| Mutação manual: `/summary` registrada depois de `/:id` | Falha em `routes.test.ts` e `tasks.test.ts` |
| Mutação manual: corpo repassado ao serviço sem filtrar campos | Falha em `request-parsing.test.ts` |

A cobertura não inclui `src/server.ts`, que só chama `listen` e não é importado por nenhum teste. Ele é exercitado pela etapa de Aceitação e pelo smoke test do Lançamento. A cobertura não mede a qualidade das verificações, e por isso foram feitas as mutações manuais acima para conferir que os testes realmente falham quando o código quebra.

## 10. Estrutura e tamanho do código HTTP (REQ-002 e REQ-003)

| Arquivo | Funções e métodos |
|---|---|
| `src/http/request-parsing.ts` | `parseTaskFilter`, `parseNewTask`, `parseTaskUpdate`, `parseStatusChange` |
| `src/http/task-controller.ts` | `create`, `list`, `summary`, `get`, `update`, `changeStatus`, `remove` |
| `src/http/task-routes.ts` | `createTaskRouter` |
| `src/http/health-routes.ts` | `createHealthRouter` |
| `src/http/error-handler.ts` | `statusFromError`, `notFoundHandler`, `errorHandler` |

Total: **5 arquivos** e **16 funções e métodos**, contados pelo mesmo critério da seção do Marcos (sem construtores). Não entram na conta 3 funções auxiliares não exportadas (`asObject`, `ensureOptionalString`, `isClientHttpError`). `src/app.ts` foi alterado para ligar as peças, mas já existia.

Com o domínio (5 arquivos, 16 funções), o código de produção somado tem **10 arquivos e 32 funções e métodos**, fora `app.ts` e `server.ts`.

## 11. Limitações conhecidas

- O workflow dispara em push na `main`, em tags `vX.Y.Z` e em pull requests para a `main` (Commit e Aceitação). O Lançamento só roda em tag.
- Não há limite mínimo de cobertura imposto pelo pipeline. A cobertura é medida sob demanda e registrada nesta seção.
- Os dados ficam em memória, então não há teste de persistência. Desempenho, carga e segurança também não são testados.

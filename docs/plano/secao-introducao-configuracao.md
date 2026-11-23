# Seção do Plano de GC — Introdução, Itens de Configuração, Nomenclatura e Versionamento (Gabriela)

> Primeira parte do Plano de GC (modelo RUP): alimenta **1. Introdução** (1.1 a 1.5) e **3.1 Identificação de Configuração** (3.1.1 Métodos de Identificação e 3.1.2 Baselines do Projeto). A segunda parte (controle de mudanças, auditoria, papéis e gestão de releases) é do Rafael.

## 1. Introdução

### 1.1 Propósito

Este plano define como o grupo identifica, controla, versiona e libera os itens que compõem o sistema `tp-gerencia-config`. Ele diz o que fica sob controle de configuração, como cada item é nomeado, como as versões são numeradas e quais registros comprovam o estado de cada release.

Público: os sete integrantes do grupo, que seguem as regras no dia a dia, e o professor, que avalia o processo.

### 1.2 Escopo

O plano cobre:

- o código-fonte da API (`src/`) e seus testes (`tests/`);
- os arquivos de build, dependências e empacotamento (`package.json`, `package-lock.json`, `tsconfig.json`, configurações do Jest, `Dockerfile`, `.dockerignore`);
- o pipeline de CI/CD (`.github/workflows/pipeline.yml`) e a configuração dele no GitHub (environment `production`, secrets e variáveis);
- os artefatos gerados a partir desses itens: imagens Docker no GHCR, GitHub Releases e a aplicação implantada no Render;
- a documentação do projeto (`README.md`, `docs/`) e os slides de apresentação.

Fica fora do escopo: o ambiente local de cada integrante (editor, sistema operacional), os dados criados na API (guardados só em memória) e a infraestrutura interna do GitHub e do Render.

O sistema em si é descrito na seção de Projeto e Arquitetura (Marcos).

### 1.3 Definições, acrônimos e abreviações

| Termo | Significado |
|---|---|
| **GC** | Gerência de Configuração |
| **IC** | Item de Configuração: artefato sob controle de versão, com identificador único e histórico de mudanças |
| **Baseline** | Estado aprovado de um conjunto de ICs, identificado e imutável, usado como referência para mudanças futuras. Neste projeto, cada tag `vX.Y.Z` é uma baseline |
| **Branch** | Linha de desenvolvimento no Git |
| **Tag** | Rótulo fixo que aponta para um commit. Usada para marcar releases |
| **PR** | Pull request: pedido de integração de uma branch na `main`, com revisão |
| **CI** | Integração Contínua: build e testes automáticos a cada integração |
| **CD** | Entrega/Implantação Contínua: publicação e implantação automáticas da release |
| **SemVer** | Versionamento Semântico (`MAJOR.MINOR.PATCH`) |
| **GHCR** | GitHub Container Registry, onde ficam as imagens Docker |
| **Render** | Plataforma de hospedagem usada como ambiente de produção |
| **RUP** | Rational Unified Process, modelo usado como base para a estrutura deste plano |

### 1.4 Referências

| Referência | Uso |
|---|---|
| Modelo de Plano de Gerência de Configuração do RUP | Estrutura deste documento |
| [Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/) | Regras de numeração de versões |
| [Conventional Commits 1.0.0](https://www.conventionalcommits.org/pt-br/v1.0.0/) | Padrão de mensagens de commit |
| Documentação do GitHub Actions e do GHCR | Pipeline e registro de artefatos |
| Repositório: `github.com/GuilhermeVieira05/tp-gerencia-config` | Fonte única de todos os ICs versionados |
| Demais seções deste plano (`docs/plano/`) | Arquitetura, testes, aceitação, release e implantação |

### 1.5 Visão geral do documento

| Parte | Conteúdo | Responsável |
|---|---|---|
| 1. Introdução | Propósito, escopo, definições, referências | Gabriela |
| 2. Gerência de Configuração | Organização, papéis e responsabilidades | Rafael |
| 3.1 Identificação de Configuração | Itens de configuração, nomenclatura, versionamento e baselines | Gabriela |
| 3.2 Controle de Configuração e Mudanças | Fluxo de PR, revisão, critérios de aceite (com insumos de testes e aceitação) | Rafael |
| 3.3 Contabilização de Status | Registros e relatórios do estado dos ICs | Rafael |
| 3.4 Auditoria e Gestão de Releases | Auditoria das baselines e processo de release | Rafael |
| Seções técnicas | Projeto e arquitetura, CI/pipeline, estratégia de testes, qualidade e aceitação, release e implantação | Marcos, Guilherme, Carlos, Mateus, Bernardo |

## 2. Itens de configuração

### 2.1 Critério de seleção

Um artefato vira IC quando atende a pelo menos um destes critérios:

1. é necessário para construir, testar ou implantar o sistema;
2. uma mudança nele pode alterar o comportamento da aplicação em produção;
3. é preciso saber, depois, qual versão dele estava em uma release.

O que pode ser gerado de novo a partir dos ICs (`node_modules/`, `dist/`, `coverage/`) **não** é IC e fica no `.gitignore`. Credenciais também não são ICs versionados: ficam no GitHub Environment `production` (ver seção 2.4).

### 2.2 Itens de configuração versionados no Git

| ID | Item | Localização | Tipo | Responsável |
|---|---|---|---|---|
| IC-01 | Código de domínio | `src/domain/` | Código-fonte | Marcos |
| IC-02 | Código HTTP | `src/http/` | Código-fonte | Carlos |
| IC-03 | Montagem e entrada da aplicação | `src/app.ts`, `src/server.ts` | Código-fonte | Guilherme |
| IC-04 | Testes de unidade | `tests/unit/` | Teste | Marcos, Carlos |
| IC-05 | Testes de integração e auxiliares | `tests/integration/`, `tests/helpers/` | Teste | Carlos |
| IC-06 | Testes de aceitação | `tests/acceptance/`, `jest.acceptance.config.js` | Teste | Mateus |
| IC-07 | Manifesto do projeto | `package.json` | Build / dependências | Guilherme |
| IC-08 | Travamento de dependências | `package-lock.json` | Build / dependências | Todos (atualizado junto com o IC-07) |
| IC-09 | Configuração do compilador e dos testes | `tsconfig.json`, `jest.config.js` | Build | Guilherme |
| IC-10 | Empacotamento | `Dockerfile`, `.dockerignore` | Build / implantação | Bernardo |
| IC-11 | Pipeline de CI/CD | `.github/workflows/pipeline.yml` | Automação | Guilherme (Commit), Mateus (Aceitação), Bernardo (Lançamento) |
| IC-12 | Regras de exclusão | `.gitignore` | Configuração | Guilherme |
| IC-13 | README e guia de execução | `README.md`, `docs/como-rodar.md` | Documentação | Gabriela |
| IC-14 | Plano de GC | `docs/plano/` | Documentação | Todos (unificado por Rafael) |

### 2.3 Itens derivados (gerados pelo pipeline)

São produzidos automaticamente a partir de uma baseline e nunca editados à mão.

| ID | Item | Onde fica | Identificação | Gerado por |
|---|---|---|---|---|
| ID-01 | Imagem Docker | `ghcr.io/guilhermevieira05/tp-gerencia-config` | Tags `X.Y.Z`, `X.Y`, `sha-<commit>`, `latest` | Etapa de Lançamento |
| ID-02 | GitHub Release | Aba *Releases* do repositório | Nome igual à tag `vX.Y.Z`, notas geradas a partir dos PRs | Etapa de Lançamento |
| ID-03 | Aplicação implantada | Render (environment `production`) | Imagem `X.Y.Z` implantada | Etapa de Lançamento |
| ID-04 | Registros de execução | Aba *Actions* do repositório | Número da execução, commit e tag | Todas as etapas |

### 2.4 Itens de configuração fora do Git

| ID | Item | Onde fica | Responsável |
|---|---|---|---|
| IC-15 | Proteção da `main` | GitHub → *Settings* → *Branches* | Guilherme |
| IC-16 | Environment `production` (secret `RENDER_DEPLOY_HOOK_URL`, variável `RENDER_APP_URL`) | GitHub → *Settings* → *Environments* | Bernardo |
| IC-17 | Serviço no Render (imagem, health check, credencial do registro) | Painel do Render | Bernardo |
| IC-18 | Slides da apresentação | Arquivo entregue no ZIP final | Gabriela (design), Guilherme (consolidação) |

Esses itens não têm histórico no Git. Qualquer mudança neles é registrada na descrição do PR relacionado ou, quando não houver PR, comunicada ao grupo e anotada no Plano.

## 3. Nomenclatura

### 3.1 Repositório e arquivos

| Item | Regra | Exemplo |
|---|---|---|
| Repositório | `kebab-case`, sem acentos | `tp-gerencia-config` |
| Arquivos de código e teste | `kebab-case.ts` | `task-service.ts` |
| Arquivos de teste | Mesmo nome do arquivo testado + `.test.ts`; aceitação usa `.acceptance.test.ts` | `task-service.test.ts`, `tasks.acceptance.test.ts` |
| Pastas de teste | Por nível: `unit`, `integration`, `acceptance` | `tests/unit/` |
| Seções do plano | `docs/plano/secao-<assunto>.md` | `secao-estrategia-testes.md` |
| Classes e tipos | `PascalCase` | `TaskService`, `NotFoundError` |
| Funções e variáveis | `camelCase` | `validateTitle`, `dueDate` |
| Constantes | `UPPER_SNAKE_CASE` | `TASK_STATUSES`, `MAX_TITLE_LENGTH` |
| Variáveis de ambiente | `UPPER_SNAKE_CASE` | `PORT`, `APP_VERSION`, `BASE_URL` |

Identificadores no código ficam em inglês. Comentários, documentação, nomes de casos de teste e mensagens de erro ficam em português.

### 3.2 Branches

| Branch | Regra | Vida útil |
|---|---|---|
| `main` | Única branch permanente. Sempre compilável e com testes verdes. Regra: só recebe mudanças por PR (a proteção técnica ainda não está ativa; ver 3.2.1 e 3.3.2) | Permanente |
| De trabalho | `<autor>/<assunto>`, em minúsculas, `kebab-case`, sem acentos | Até o merge do PR. Depois é apagada |

Exemplos do histórico: `carlos/camada-http-testes`, `mateus/teste-aceitacao`, `gabriela/readme-plano`.

Toda branch de trabalho sai da `main` atualizada e volta para ela por PR. Não há branches de release nem de desenvolvimento separadas: a release é marcada por tag sobre a `main` (seção 4).

### 3.3 Commits

Seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

```
<tipo>: <descrição no imperativo, em português, sem ponto final>
```

| Tipo | Uso | Efeito na versão |
|---|---|---|
| `feat` | Nova funcionalidade | MINOR |
| `fix` | Correção de defeito | PATCH |
| `docs` | Só documentação | Nenhum |
| `test` | Só testes | Nenhum |
| `chore` | Manutenção, configuração, preparação de release | Nenhum |
| `refactor` | Mudança interna sem alterar comportamento | Nenhum |
| `ci` | Mudança no pipeline | Nenhum |
| `feat!` / `fix!` ou rodapé `BREAKING CHANGE:` | Mudança incompatível no contrato da API | MAJOR |

Exemplos do histórico: `feat: camada de dominio (tarefas) com testes unitarios e secao do plano`, `fix: etapa de Lancamento idempotente em re-run (Release existente)`, `chore: release v0.1.1`.

### 3.4 Pull requests

- Título no mesmo padrão do commit (`<tipo>: <descrição>`). No merge por *squash* (único método para os próximos PRs; os PRs #1, #5 e #7 foram *merge commit*), o título vira a mensagem do commit na `main`, com o número do PR no final (ex.: `(#6)`).
- A descrição explica o que mudou, por quê, como foi testado e se algum IC fora do Git (seção 2.4) foi alterado.

### 3.5 Tags, releases e imagens

| Item | Regra | Exemplo |
|---|---|---|
| Tag de release no Git | `v` + versão SemVer, **anotada** (`git tag -a`) | `v0.1.1` |
| Mensagem da tag | `Release vX.Y.Z` | `Release v0.1.1` |
| Commit de preparação | `chore: release vX.Y.Z` | `chore: release v0.1.1` |
| GitHub Release | Mesmo nome da tag | `v0.1.1` |
| Imagem Docker | `ghcr.io/<dono>/<repositório>:<tag>` em minúsculas | `ghcr.io/guilhermevieira05/tp-gerencia-config:0.1.1` |

### 3.6 Pipeline

| Item | Regra | Exemplo |
|---|---|---|
| Arquivo do workflow | `.github/workflows/<nome>.yml` | `pipeline.yml` |
| ID do job | `<etapa>-stage`, em inglês | `commit-stage`, `acceptance-stage`, `release-stage` |
| Nome exibido do job | `Etapa de <Etapa>`, em português | `Etapa de Commit` |
| Environment | Nome do ambiente de destino | `production` |
| Secrets e variáveis | `UPPER_SNAKE_CASE`, prefixados pelo serviço | `RENDER_DEPLOY_HOOK_URL`, `RENDER_APP_URL` |

## 4. Versionamento

### 4.1 Versionamento dos itens no Git

Todos os ICs da seção 2.2 são versionados no Git, no repositório único `GuilhermeVieira05/tp-gerencia-config`. Cada commit identifica uma versão de todos eles ao mesmo tempo, pelo hash. Não há versão individual por arquivo: a versão de um IC é a do commit (ou da tag) em que ele está.

Regras:

- O `package-lock.json` é sempre commitado junto com qualquer mudança no `package.json`. Assim, o mesmo commit gera sempre as mesmas dependências (`npm ci`).
- O histórico da `main` não é reescrito (sem `push --force`).
- Arquivos gerados e credenciais nunca são commitados (`.gitignore`).

### 4.2 Versionamento da aplicação (SemVer)

A versão da aplicação segue o [Versionamento Semântico 2.0.0](https://semver.org/lang/pt-BR/), no formato `MAJOR.MINOR.PATCH`. A API é o contrato público, então os incrementos são decididos pelo impacto nos clientes da API:

| Incremento | Quando | Exemplo neste projeto |
|---|---|---|
| **MAJOR** | Mudança incompatível no contrato HTTP | Remover uma rota, renomear um campo da tarefa, mudar o formato do erro |
| **MINOR** | Funcionalidade nova, compatível | Nova rota, novo filtro em `GET /tasks`, novo campo opcional |
| **PATCH** | Correção compatível, ou mudança interna que precisa ser implantada | Corrigir uma validação, ajustar o `Dockerfile` ou o pipeline |

Regras adicionais:

- Enquanto a versão estiver em `0.y.z`, o contrato ainda pode mudar. O grupo publica a `1.0.0` na entrega final do TP, quando o contrato for considerado estável.
- Mudanças só de documentação ou de testes não geram release sozinhas. Elas entram na próxima.
- Uma versão publicada nunca é alterada nem reutilizada. Uma correção vira uma nova versão (`X.Y.Z+1`).

### 4.3 Fonte única da versão

A versão fica registrada em um só lugar, o campo `version` do `package.json`, e é propagada a partir dele:

```
package.json "version": "0.1.1"
        │  (deve ser igual)
        ▼
tag Git v0.1.1 ──▶ pipeline valida tag × package.json ──▶ imagem :0.1.1 (APP_VERSION=0.1.1)
                                                        ──▶ GitHub Release v0.1.1
                                                        ──▶ Render implanta :0.1.1
```

Se a tag e o `package.json` divergirem, a etapa de Lançamento falha no primeiro passo e nada é publicado. Para mudar a versão, usa-se `npm version <nova> --no-git-tag-version`, que atualiza `package.json` e `package-lock.json` juntos.

### 4.4 Baselines

Cada tag `vX.Y.Z` na `main` é uma **baseline de release**: congela o estado de todos os ICs do repositório naquele commit e é a origem de todos os itens derivados daquela versão.

| Baseline | Data | Commit | Conteúdo |
|---|---|---|---|
| `v0.1.0` | 17/11/2026 | `e832342` | Scaffold da API, pipeline (Commit), camada de domínio com testes, `Dockerfile` e etapa de Lançamento |
| `v0.1.1` | 19/11/2026 | `886f61f` | Etapa de Lançamento idempotente em re-run, camada HTTP com testes de unidade e integração |
| `v0.1.2` | 22/11/2026 | `69b137f` | Etapa de Aceitação no pipeline, script de implantação, artefato único (imagem testada = imagem lançada), plano consolidado, slides, backup e recuperação, evidência da execução vermelha |

Regras para uma baseline:

- Só é criada sobre um commit da `main` com todas as etapas do pipeline verdes.
- A tag é anotada, o que registra autor e data de quem criou a baseline.
- Nunca é movida nem apagada. Uma baseline com defeito é substituída por uma nova versão de PATCH.
- A partir da tag, é possível reconstruir exatamente aquele estado: `git checkout vX.Y.Z && npm ci && npm run build`, ou rodar a imagem `:X.Y.Z` do GHCR.

O procedimento para criar uma release, as aprovações e a auditoria das baselines estão nas seções de Release e Implantação (Bernardo) e de Gestão de Releases (Rafael).

### 4.5 Rastreabilidade

Com as regras acima, qualquer item pode ser rastreado nos dois sentidos:

| Partindo de | Chega-se a | Como |
|---|---|---|
| Aplicação no Render | Imagem | Tag da imagem implantada (`X.Y.Z`) |
| Imagem | Commit e versão | Tag `sha-<commit>`, labels OCI e variável `APP_VERSION` |
| Versão | Mudanças incluídas | GitHub Release `vX.Y.Z`, com notas geradas a partir dos PRs |
| PR | Commit e autor | Número do PR no commit da `main` (`(#N)`) |
| Commit | Execução do pipeline | Aba *Actions*, filtrando pelo commit |

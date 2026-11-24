# Plano de Gerenciamento de Configuração

| | |
|---|---|
| **Organização** | Grupo do TP1 · Gerência de Configuração e Evolução de Software |
| **Projeto** | tp-gerencia-config: API REST de gerenciamento de tarefas |
| **Repositório** | https://github.com/GuilhermeVieira05/tp-gerencia-config |
| **Versão do plano** | 1.4 |
| **Modelo** | Plano de Gerenciamento de Configuração (RUP) |

## Histórico de revisão

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-11-13 | 0.1 | Primeira seção do plano (domínio e testes unitários) | Marcos |
| 2026-11-18 | 0.2 | Estratégia de testes e qualidade e aceitação | Carlos, Mateus |
| 2026-11-19 | 0.3 | Release e implantação | Bernardo |
| 2026-11-22 | 0.4 | Introdução, itens de configuração, nomenclatura e versionamento | Gabriela |
| 2026-11-22 | 1.0 | Controle de mudanças e CCB, auditorias, marcos, treinamento e subfornecedores; capa e histórico | Marcos (registro no Git) |
| 2026-11-22 | 1.1 | Plano consolidado na estrutura do modelo; seção 3.3.1 (backup, retenção e recuperação); artefato único no pipeline; contagem por AST; correção de divergências apontadas na auditoria 2 | Grupo |
| 2026-11-22 | 1.2 | Rodada final de correção (auditoria 3): distinção entre o procedimento definido e a prática realizada (proteção da `main`, reviews, CCB, merge, rastreabilidade); papéis × registro no Git; `/health` com versão e verificação pós-deploy por versão; esclarecimento de entrega contínua e do artefato único; baseline `v0.1.2`; números atualizados | Marcos |
| 2026-11-23 | 1.3 | Proteção da `main` ativada (registrada como ativa, com o *bypass* do administrador); primeira review de PR (#18); ajustes sugeridos na review do `deploy.sh` | Marcos |
| 2026-11-23 | 1.4 | Relatórios de auditoria das rodadas 1 a 3 removidos da árvore de trabalho (permanecem no histórico do Git; resumo em 3.3.2); tabela de auditorias corrigida; imagem base e runner com versão exata; `npm audit` registrado; changelog, roteiro e `scripts/demo-local.sh` | Marcos |

## Índice

1. Introdução (1.1 Objetivo · 1.2 Escopo · 1.3 Definições, acrônimos e abreviações · 1.4 Referências · 1.5 Visão geral)
2. Gerenciamento de Configuração de Software (2.1 Organização, responsabilidades e interfaces · 2.2 Ferramentas, ambiente e infraestrutura)
3. O Programa de Gerenciamento de Configuração
    - 3.1 Identificação da Configuração (3.1.1 Métodos de identificação · 3.1.2 Linhas de base do projeto)
    - 3.2 Configuração e controle de alterações (3.2.1 Processamento e aprovação de mudanças · 3.2.2 CCB)
    - 3.3 Contabilidade do status de configuração (3.3.1 Armazenamento de mídia e processo de release · 3.3.2 Relatórios e auditorias)
4. Marcos
5. Treinamento e recursos
6. Controle de software do subfornecedor e do fornecedor

Apêndices: A. O projeto e sua arquitetura · B. Testes e critérios de aceitação · C. Pipeline como materialização do plano

## 1. Introdução

Este plano descreve como o grupo gerencia a configuração do sistema `tp-gerencia-config`, uma API REST de tarefas em TypeScript/Node.js, usando Git/GitHub, um pipeline de CI/CD (GitHub Actions) e contêineres Docker. Ele foi escrito a partir do modelo de Plano de Gerenciamento de Configuração (RUP) e descreve o que de fato está implementado.

### 1.1 Objetivo

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

O sistema em si é descrito no Apêndice A.

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

Outros termos usados: **CCB** (comitê que analisa e aprova mudanças), **pipeline** (sequência automatizada Commit → Aceitação → Lançamento), **artefato** (resultado de uma etapa, aqui a imagem Docker), **release** (versão liberada aos usuários), **DevOps** (integração entre desenvolvimento e operação por automação e feedback rápido), **rollback** (voltar a uma versão anterior).

### 1.4 Referências

| Referência | Uso |
|---|---|
| Modelo de Plano de Gerência de Configuração do RUP | Estrutura deste documento |
| [Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/) | Regras de numeração de versões |
| [Conventional Commits 1.0.0](https://www.conventionalcommits.org/pt-br/v1.0.0/) | Padrão de mensagens de commit |
| Documentação do GitHub Actions e do GHCR | Pipeline e registro de artefatos |
| Repositório: `github.com/GuilhermeVieira05/tp-gerencia-config` | Fonte única de todos os ICs versionados |
| Enunciado do TP1 e modelo de plano da disciplina | Requisitos e estrutura |
| Guia *Docker Build in CI* (docs.docker.com/build/ci) | Referência para empacotamento no pipeline |
| Apêndices A a C deste plano | Arquitetura, testes e pipeline |

### 1.5 Visão geral

| Parte | Conteúdo |
|---|---|
| 1. Introdução | Objetivo, escopo, definições, referências |
| 2. Gerenciamento de Configuração | Papéis, ferramentas, ambientes |
| 3.1 Identificação | Itens de configuração, nomenclatura, versionamento e baselines |
| 3.2 Controle de alterações | Fluxo de mudança e CCB |
| 3.3 Contabilidade de status | Armazenamento, backup, release, relatórios e auditorias |
| 4, 5, 6 | Marcos, treinamento e recursos, fornecedores |
| Apêndices | Projeto e arquitetura, testes, ligação entre o pipeline e o plano |

## 2. Gerenciamento de Configuração de Software

### 2.1 Organização, responsabilidades e interfaces

O grupo tem sete integrantes, trabalhando de forma remota sobre um repositório único. As responsabilidades de CM são:

| Papel | Integrante | Responsabilidade de CM |
|---|---|---|
| Presidente do CCB e dono do repositório | Guilherme | Convoca o CCB, desempata, mantém a proteção da `main` e a etapa de Commit do pipeline |
| Gerente de configuração | Rafael | Mantém a lista de ICs, conduz as auditorias, revisa PRs |
| Responsável por pipeline e releases | Bernardo | `Dockerfile`, etapa de Lançamento, tags, deploy no Render |
| Qualidade e aceitação | Mateus | Testes de aceitação e a etapa de Aceitação |
| Domínio e testes de unidade | Marcos | Camada de domínio, testes de unidade, contagem de requisitos |
| Camada HTTP e testes de integração | Carlos | Camada HTTP, testes de unidade e de integração |
| Documentação | Gabriela | README, guia de execução, introdução e identificação de configuração |

**Papéis × registro no Git.** A tabela acima é o **papel definido**. O que o histórico mostra (verificado em 2026-11-23, commit `fdcc342`; `git log` e GitHub) é:

| Integrante | Registro no Git e no GitHub |
|---|---|
| Guilherme | 1 commit (estrutura inicial da API e etapa de Commit do pipeline); dono do repositório |
| Marcos | Camada de domínio e testes de unidade; PRs #13, #14 e #16 (integração da Aceitação, script de implantação, plano consolidado, artefato único, slides, release `v0.1.2`) |
| Carlos | PR #5: camada HTTP, testes de unidade e de integração |
| Mateus | Autor dos 3 commits do PR #4 (etapa de Aceitação e os 22 cenários), fechado sem merge; o conteúdo foi integrado pelo PR #13 (squash), onde consta como `Co-authored-by` |
| Bernardo | PRs #2, #3 e #6: `Dockerfile`, etapa de Lançamento, idempotência e release `v0.1.1` |
| Gabriela | PR #7: README, guia de execução e a introdução do plano |
| Rafael | Nenhum commit ou PR; **primeira review registrada do repositório**, no PR #18 (aprovado) |

Onde a prática difere do papel definido, vale esta tabela. Em especial, **nenhum PR anterior ao #18 tem review registrada** (3.2.1).

**Interfaces:** o código deve entrar pela `main` por PR; o pipeline é a interface entre o desenvolvimento e a operação (GitHub Actions → GHCR → Render); o professor avalia o plano, o repositório e a apresentação.

### 2.2 Ferramentas, ambiente e infraestrutura

| Ferramenta | Versão | Uso |
|---|---|---|
| Git e GitHub | — | Controle de versão, PRs, issues, Actions, Releases, GHCR |
| Node.js | 20 | Execução e build |
| TypeScript | 5 (`strict`) | Linguagem; `tsc` gera `dist/` |
| npm | `npm ci` com `package-lock.json` | Dependências reproduzíveis |
| Express | 4 | Framework HTTP |
| Jest, `ts-jest`, `supertest` | 29 | Testes de unidade, integração e aceitação |
| Docker | Dockerfile em dois estágios sobre `node:20.20.2-alpine3.23` | Empacotamento |
| GitHub Actions | `.github/workflows/pipeline.yml` | CI/CD |
| GHCR | — | Registro de imagens das releases |
| Render | Plano gratuito | Produção (imagem implantada por *deploy hook*) |

| Ambiente | Onde | Para quê |
|---|---|---|
| Desenvolvimento | Máquina de cada integrante (`npm start`, `docker run`) | Escrever e testar antes do PR |
| Integração contínua | Runner `ubuntu-24.04` do GitHub Actions | Build, testes e Aceitação a cada push e PR |
| Produção | Render, `https://tp-gerencia-config.onrender.com` | Sistema entregue aos usuários |

**Volume e distribuição:** repositório pequeno (**63** arquivos versionados, conforme `git ls-files`), sete pessoas em máquinas distintas, um único servidor remoto (GitHub). O Render hiberna após inatividade; a primeira requisição pode levar cerca de 1 minuto. Procedimentos de controle de versão estão em 3.1 e 3.2.

## 3. O Programa de Gerenciamento de Configuração

### 3.1 Identificação da Configuração

#### 3.1.1 Métodos de identificação

##### Itens de configuração

###### Critério de seleção

Um artefato vira IC quando atende a pelo menos um destes critérios:

1. é necessário para construir, testar ou implantar o sistema;
2. uma mudança nele pode alterar o comportamento da aplicação em produção;
3. é preciso saber, depois, qual versão dele estava em uma release.

O que pode ser gerado de novo a partir dos ICs (`node_modules/`, `dist/`, `coverage/`) **não** é IC e fica no `.gitignore`. Credenciais também não são ICs versionados: ficam no GitHub Environment `production` (ver "Itens de configuração fora do Git", em 3.1.1).

###### Itens de configuração versionados no Git

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
| IC-13 | README, guia de execução, changelog, roteiro e evidências | `README.md`, `docs/como-rodar.md`, `docs/changelog.md`, `docs/roteiro-apresentacao.md`, `docs/evidencias/` | Documentação | Gabriela |
| IC-14 | Plano de GC | `docs/plano/` | Documentação | Todos (unificado por Rafael) |

###### Itens derivados (gerados pelo pipeline)

São produzidos automaticamente a partir de uma baseline e nunca editados à mão.

| ID | Item | Onde fica | Identificação | Gerado por |
|---|---|---|---|---|
| ID-01 | Imagem Docker | `ghcr.io/guilhermevieira05/tp-gerencia-config` | Tags `X.Y.Z`, `X.Y`, `sha-<commit>`, `latest` | Etapa de Lançamento |
| ID-02 | GitHub Release | Aba *Releases* do repositório | Nome igual à tag `vX.Y.Z`, notas geradas a partir dos PRs | Etapa de Lançamento |
| ID-03 | Aplicação implantada | Render (environment `production`) | Imagem `X.Y.Z` implantada | Etapa de Lançamento |
| ID-04 | Registros de execução | Aba *Actions* do repositório | Número da execução, commit e tag | Todas as etapas |

###### Itens de configuração fora do Git

| ID | Item | Onde fica | Responsável |
|---|---|---|---|
| IC-15 | Proteção da `main` | GitHub → *Settings* → *Branches* | Guilherme |
| IC-16 | Environment `production` (secret `RENDER_DEPLOY_HOOK_URL`, variável `RENDER_APP_URL`) | GitHub → *Settings* → *Environments* | Bernardo |
| IC-17 | Serviço no Render (imagem, health check, credencial do registro) | Painel do Render | Bernardo |
| IC-18 | Slides da apresentação | Arquivo entregue no ZIP final | Gabriela (design), Guilherme (consolidação) |

Esses itens não têm histórico no Git. Qualquer mudança neles é registrada na descrição do PR relacionado ou, quando não houver PR, comunicada ao grupo e anotada no Plano.

##### Nomenclatura

###### Repositório e arquivos

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

###### Branches

| Branch | Regra | Vida útil |
|---|---|---|
| `main` | Única branch permanente. Sempre compilável e com testes verdes. Regra: só recebe mudanças por PR (proteção técnica ativa desde 2026-11-23; ver 3.2.1 e 3.3.2) | Permanente |
| De trabalho | `<autor>/<assunto>`, em minúsculas, `kebab-case`, sem acentos | Até o merge do PR. Depois é apagada |

Exemplos do histórico: `carlos/camada-http-testes`, `mateus/teste-aceitacao`, `gabriela/readme-plano`.

Toda branch de trabalho sai da `main` atualizada e volta para ela por PR. Não há branches de release nem de desenvolvimento separadas: a release é marcada por tag sobre a `main` (ver "Versionamento", em 3.1.1).

###### Commits

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

###### Pull requests

- Título no mesmo padrão do commit (`<tipo>: <descrição>`). No merge por *squash* (único método para os próximos PRs; os PRs #1, #5 e #7 foram *merge commit*), o título vira a mensagem do commit na `main`, com o número do PR no final (ex.: `(#6)`).
- A descrição explica o que mudou, por quê, como foi testado e se algum IC fora do Git (em "Itens de configuração fora do Git", 3.1.1) foi alterado.

###### Tags, releases e imagens

| Item | Regra | Exemplo |
|---|---|---|
| Tag de release no Git | `v` + versão SemVer, **anotada** (`git tag -a`) | `v0.1.1` |
| Mensagem da tag | `Release vX.Y.Z` | `Release v0.1.1` |
| Commit de preparação | `chore: release vX.Y.Z` | `chore: release v0.1.1` |
| GitHub Release | Mesmo nome da tag | `v0.1.1` |
| Imagem Docker | `ghcr.io/<dono>/<repositório>:<tag>` em minúsculas | `ghcr.io/guilhermevieira05/tp-gerencia-config:0.1.1` |

###### Pipeline

| Item | Regra | Exemplo |
|---|---|---|
| Arquivo do workflow | `.github/workflows/<nome>.yml` | `pipeline.yml` |
| ID do job | `<etapa>-stage`, em inglês | `commit-stage`, `acceptance-stage`, `release-stage` |
| Nome exibido do job | `Etapa de <Etapa>`, em português | `Etapa de Commit` |
| Environment | Nome do ambiente de destino | `production` |
| Secrets e variáveis | `UPPER_SNAKE_CASE`, prefixados pelo serviço | `RENDER_DEPLOY_HOOK_URL`, `RENDER_APP_URL` |

##### Versionamento

###### Versionamento dos itens no Git

Todos os ICs listados acima são versionados no Git, no repositório único `GuilhermeVieira05/tp-gerencia-config`. Cada commit identifica uma versão de todos eles ao mesmo tempo, pelo hash. Não há versão individual por arquivo: a versão de um IC é a do commit (ou da tag) em que ele está.

Regras:

- O `package-lock.json` é sempre commitado junto com qualquer mudança no `package.json`. Assim, o mesmo commit gera sempre as mesmas dependências (`npm ci`).
- O histórico da `main` não é reescrito (sem `push --force`).
- Arquivos gerados e credenciais nunca são commitados (`.gitignore`).

###### Versionamento da aplicação (SemVer)

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

###### Fonte única da versão

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

##### Rastreabilidade

Com as regras acima, qualquer item pode ser rastreado nos dois sentidos:

| Partindo de | Chega-se a | Como |
|---|---|---|
| Aplicação no Render | Imagem | Tag da imagem implantada (`X.Y.Z`) |
| Imagem | Commit e versão | Tag `sha-<commit>`, labels OCI e variável `APP_VERSION` |
| Versão | Mudanças incluídas | GitHub Release `vX.Y.Z`, com notas geradas a partir dos PRs |
| PR | Commit e autor | Número do PR no commit da `main` (`(#N)`) |
| Commit | Execução do pipeline | Aba *Actions*, filtrando pelo commit |

#### 3.1.2 Linhas de base do projeto

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

O procedimento para criar uma release está em 3.3.1 e a auditoria das baselines em 3.3.2.

**Quem autoriza:** presidente do CCB e responsável por releases (ver 3.2.2). **O que contém:** todos os ICs do repositório naquele commit, mais os itens derivados (imagem, Release, registro de execução).

### 3.2 Configuração e controle de alterações

#### 3.2.1 Processamento e aprovação de controles de mudança

Toda mudança em um Item de Configuração (código, testes, pipeline, `Dockerfile`, documentação) deve seguir o caminho abaixo, que é o **procedimento definido**. O que foi **efetivamente praticado** até aqui, e onde difere do definido, está em "Procedimento definido × prática realizada", ao fim desta seção. Regra: não há commit direto na `main`.

| Passo | O que acontece | Quem | Registro |
|---|---|---|---|
| 1. Solicitação | Abre-se uma **issue** descrevendo o problema ou a melhoria, com tipo (`feat`, `fix`, `docs`, `ci`...) e prioridade | Qualquer integrante | Issue no GitHub |
| 2. Triagem | O CCB aceita, adia ou rejeita a solicitação e define o responsável | CCB | Comentário e rótulo na issue |
| 3. Implementação | Cria-se a branch `<autor>/<assunto>` a partir da `main` atualizada e commita-se no padrão Conventional Commits | Responsável | Histórico Git |
| 4. Verificação local | `npm run build` e `npm test` passam antes de abrir o PR | Responsável | Descrição do PR |
| 5. Pull request | Título no padrão do commit, descrição com o quê, por quê e como foi testado, e `Closes #N` | Responsável | PR |
| 6. Verificação automática | O pipeline roda a Etapa de Commit e a de Aceitação; ambas precisam estar verdes | GitHub Actions | Execução do workflow |
| 7. Revisão | Um revisor que **não seja o autor** aprova ou pede mudanças | Revisor (Rafael por padrão) | Review no PR |
| 8. Integração | Merge por *squash* na `main` (regra para os próximos PRs; ver "Estratégia de merge"); a branch é apagada | Autor, após aprovação | Commit na `main` com `(#N)` |
| 9. Release (se aplicável) | Atualiza-se `package.json`, cria-se a tag `vX.Y.Z` e o pipeline publica a imagem | Bernardo | Tag, GitHub Release, imagem no GHCR |

**Critérios de aprovação de um PR:** pipeline verde; ao menos 1 aprovação de outro integrante; mensagem no padrão; testes novos para comportamento novo; documentação atualizada quando o contrato da API ou um IC muda; nenhum segredo no diff.

**Mudança urgente (hotfix):** segue o mesmo fluxo, com issue de prioridade alta, revisão imediata e release `PATCH`. O CCB é avisado depois, e a decisão é registrada na própria issue.

**Rastreabilidade:** issue → branch → commits → PR → commit na `main` → tag → imagem (`APP_VERSION` e labels OCI) → release. Com isso é possível ir de uma versão em execução até o pedido que a originou.

**Proteção técnica da `main` (definida):** exigir PR, a aprovação mencionada e os status checks **`Etapa de Commit`** e **`Etapa de Aceitacao`** (os nomes exatos dos jobs em `pipeline.yml`, **sem acento** no segundo; com acento o check nunca seria satisfeito e todo PR ficaria travado), e bloquear *force-push*. A configuração fica em *Settings → Branches* e deve ser conferida a cada auditoria (3.3.2). **Estado: ativa desde 2026-11-23** (ver abaixo e `docs/evidencias/protecao-main.md`). Até o PR #18 ela não existia, segundo a issue #11 (aberta até a ativação) e a declaração do dono.

#### Procedimento definido × prática realizada

Verificado em 2026-11-23 no GitHub (`gh api`) e no histórico Git, sobre o commit `fdcc342` (a `main` após o PR #18). Onde o estado mudou durante a rodada de correção, a linha diz a data:

| Tema | Definido neste plano | Realizado até 2026-11-23 |
|---|---|---|
| Proteção da `main` | PR, aprovação e dois status checks obrigatórios; sem *force-push* | **Ativa desde 2026-11-23**, configurada pelo dono (Guilherme; issue #11, fechada). Verificável por qualquer integrante: `gh api repos/<dono>/<repo>/branches/main` retorna `protected: true` e os status checks "Etapa de Commit" e "Etapa de Aceitacao" como obrigatórios. O print de *Settings → Branches* (`docs/evidencias/protecao-main.png`) comprova o restante: PR obrigatório com 1 aprovação, *force-push* e deleção bloqueados (esses dois valem **inclusive para administradores**); esses itens não aparecem na API para contas sem permissão de administrador. **O administrador pode contornar as regras de PR, aprovação e checks** (a opção *Do not allow bypassing* está desmarcada); isso é um risco aceito e deve ser usado só em emergência, com registro no PR ou na issue. Antes disso não havia proteção, segundo a issue #11 (aberta até a ativação) e a declaração do dono; o 404 de `.../branches/main/protection` para contas sem permissão de administrador **não** prova a ausência, porque essa conta receberia 404 de qualquer forma |
| Revisão de PR | Aprovação de outro integrante; 2 aprovações do CCB para contrato, pipeline, `Dockerfile` ou baseline | **Nenhuma review registrada nos PRs #1 a #7 e #13 a #16** (11 PRs, contando os fechados sem merge #4 e #15). **O PR #18 é o primeiro com review registrada** (Rafael, aprovado, com validação local descrita na review). O portão efetivo foi o pipeline verde; as decisões de merge não ficaram registradas como aprovação do CCB. Alterações de `pipeline.yml` e `Dockerfile` (PRs #2, #3, #13, #14) entraram sem as 2 aprovações previstas |
| Quem revisa | Rafael, por padrão | Rafael não tem commit nem PR; fez a **primeira review registrada**, no PR #18 (aprovado) |
| Issue → PR (`Closes #N`) | Todo PR referencia uma issue | PRs #1 a #7 anteriores às issues; só o #13 tem `Closes #N`; #14, #15 e #16 não têm; a rodada de correção usa a issue #17 |
| Estratégia de merge | *Squash* | Mista: *merge commit* nos PRs #1, #5 e #7; *squash* nos PRs #2, #3, #6, #13, #14 e #16 (PRs #4 e #15 fechados sem merge) |

**Estratégia de merge:** para os próximos PRs vale **somente *squash***: um commit por PR na `main`, com `(#N)` no título. Os PRs #1, #5 e #7 permanecem como *merge commit*; o histórico não é reescrito. A restrição técnica (desabilitar *merge commit* e *rebase* em *Settings → General*) também depende do dono do repositório.

**Rastreabilidade a partir daqui:** todo PR novo cita a issue que o originou (`Closes #N`, ou `Refs #N` quando a issue deve continuar aberta). Os PRs sem vínculo listados acima não são corrigidos retroativamente; são rastreados pelo número do PR e pelo histórico de commits.

**Revisão a partir do PR #18:** a aprovação de outro integrante deve ficar registrada como *review* no GitHub. Um PR integrado sem *review* registra o desvio na sua descrição.

#### 3.2.2 CCB (Comitê de Controle de Configuração)

| Papel | Integrante | Atribuição |
|---|---|---|
| Presidente | Guilherme | Convoca reuniões, tem o voto de desempate, dono do repositório e da proteção da `main` |
| Gerente de configuração | Rafael | Mantém a lista de ICs, conduz as auditorias, revisa PRs |
| Responsável pelo pipeline e releases | Bernardo | Avalia impacto no pipeline e aprova a criação de tags |
| Membro técnico (rodízio) | Marcos, Carlos, Mateus ou Gabriela | Um integrante por mudança, sempre diferente do autor |

**Quórum:** 3 membros, sendo o autor da mudança excluído do voto. **Decisão:** maioria simples; empate resolvido pelo presidente.

**Procedimento (definido):**
1. Mudanças comuns são decididas no próprio PR: a aprovação do revisor registra a decisão do CCB.
2. Mudanças que afetam **contrato da API, pipeline, `Dockerfile`, versionamento ou baseline** exigem aprovação explícita de pelo menos 2 membros do CCB no PR.
3. **Criação de baseline (tag):** só com aprovação do presidente e do responsável por releases, pipeline verde na `main` e `package.json` na versão da tag.
4. Reuniões: curtas, ao fim de cada marco (ver "Versionamento", em 3.1.1), para revisar issues abertas e a pauta da próxima baseline. A ata fica como comentário na issue do marco.
5. Mudanças rejeitadas ficam registradas na issue com a justificativa.

**Prática até 2026-11-23:** não há atas nem votações do CCB registradas; a única aprovação registrada é a review do Rafael no PR #18, e fora isso o registro de verificação das mudanças é o resultado do pipeline. As três tags criadas (`v0.1.0` a `v0.1.2`) também não têm registro de aprovação do presidente e do responsável por releases além da própria tag anotada e do GitHub Release. Daqui em diante, as decisões do CCB são registradas no PR ou na issue correspondente.

### 3.3 Contabilidade do status de configuração

#### 3.3.1 Armazenamento de mídia do projeto e processo de release

##### Armazenamento, backup, retenção e recuperação

###### Onde cada item fica

| Item | Mídia / local | Tipo | Cópias existentes |
|---|---|---|---|
| Código, testes, scripts, documentação e histórico (ICs do Git) | Repositório `GuilhermeVieira05/tp-gerencia-config` no GitHub | Online, remoto | Remoto no GitHub e um clone completo em cada integrante (o Git é distribuído: cada clone contém todo o histórico) |
| Baselines | Tags anotadas `vX.Y.Z` no mesmo repositório | Online | As mesmas do repositório |
| Imagens Docker das releases | GitHub Container Registry (`ghcr.io/guilhermevieira05/tp-gerencia-config`) | Online, registro de imagens | Tags `X.Y.Z` imutáveis; também reproduzíveis a partir da tag com `docker build` |
| GitHub Releases | Aba *Releases* | Online | Notas geradas; a imagem é a do GHCR |
| Registros de execução do pipeline | Aba *Actions* | Online | Só no GitHub (retenção do próprio serviço) |
| Artefato `app-image` entre Aceitação e Lançamento | Artefatos do GitHub Actions | Online, temporário | Retenção de 7 dias; descartável, pode ser regenerado |
| Secrets (`RENDER_DEPLOY_HOOK_URL`) e variáveis | GitHub Environment `production` | Online | Não são versionados; a URL do hook pode ser regenerada no painel do Render |
| Entrega final | Plano (PDF), slides (PDF), script de implantação e ZIP do repositório com `.git` | Arquivos, offline | Enviados no Canvas; uma cópia fica com o gerente de configuração |

###### Backup

- **Contínuo:** todo `git push` coloca o histórico no GitHub, e cada integrante mantém seu clone. Não há commit direto na `main`, e o histórico nunca é reescrito (sem `push --force`), então nenhuma cópia diverge do remoto.
- **Espelho do repositório:** antes de cada tag e antes da entrega, o gerente de configuração gera um espelho completo:

  ```bash
  git clone --mirror https://github.com/GuilhermeVieira05/tp-gerencia-config.git espelho.git
  git -C espelho.git bundle create ../tp-gerencia-config-<data>.bundle --all   # arquivo único
  ```

  O espelho (ou o ZIP final, que inclui `.git`) fica fora do GitHub, em um disco do gerente de configuração.
- **Imagens:** cada release fica no GHCR com tag imutável. Como a imagem é gerada a partir da tag, perder o registro não perde a release.
- **Credenciais:** não entram em backup do repositório. Em caso de perda, são recriadas (novo deploy hook no Render, novo secret no GitHub).

###### Retenção

| Item | Retenção |
|---|---|
| Repositório, histórico e tags | Permanente. Tags e commits publicados nunca são apagados nem reescritos. |
| Imagens `X.Y.Z` e `sha-*` no GHCR | Permanente, até o fim da disciplina. Não são apagadas, porque são o alvo do rollback. `latest` e `X.Y` são mutáveis. |
| GitHub Releases | Permanente |
| Execuções do pipeline e artefato `app-image` | Execuções: conforme o GitHub (90 dias por padrão). Artefato: 7 dias, definidos no workflow. |
| Espelho e ZIP de entrega | Até o encerramento da avaliação do TP |

###### Recuperação de desastres

| Cenário | Procedimento |
|---|---|
| Repositório no GitHub apagado ou inacessível | Qualquer clone de integrante ou o espelho é enviado para um novo repositório com `git push --mirror`. Depois recriam-se o environment `production`, o secret e a variável `RENDER_APP_URL` (3.3.1, "Configuração única do ambiente", itens 3 e 4) e a proteção da `main`. |
| Uma versão precisa ser reconstruída | `git clone ... && git checkout vX.Y.Z && npm ci && npm run build` (ou `docker build`). A tag fixa o estado de todos os ICs. |
| Imagem perdida no GHCR | Reconstruir a partir da tag e republicar com a mesma tag `X.Y.Z` pelo pipeline. |
| Produção (Render) fora do ar ou com versão defeituosa | Rollback: *Manual Deploy* com a imagem da versão anterior, ou o deploy hook com `imgURL` (3.3.1, "Rollback"). |
| Secret vazado | Regenerar o deploy hook no Render, atualizar o secret e registrar o fato como defeito de criticidade alta. |
| Perda de um clone local | Novo `git clone`. Não há trabalho a recuperar além das branches não enviadas. |

###### Teste de recuperação executado

| Data | O que foi feito | Resultado |
|---|---|---|
| 2026-11-22 | `git clone --mirror` do repositório, clone a partir do espelho, `git checkout v0.1.1`, `npm ci`, `npm run build`, `npm test` | `git describe` = `v0.1.1`; build ok; 11 suítes e 171 testes passando. A baseline foi restaurada a partir do espelho. |
| 2026-11-22 | Imagem: `docker save` + `docker load` da imagem candidata | Mesmo ID (`sha256:2caacfff…`) antes e depois, e os 22 testes de aceitação passaram contra o contêiner restaurado |

##### Processo de release

**Conteúdo da release:** imagem Docker `ghcr.io/guilhermevieira05/tp-gerencia-config:X.Y.Z` (com as tags `X.Y`, `sha-<commit>` e `latest`), GitHub Release com notas geradas dos PRs e a aplicação implantada no Render. **Público-alvo:** usuários da API (neste TP, o professor e o grupo). **Instalação:** `docker run --rm -p 3000:3000 ghcr.io/guilhermevieira05/tp-gerencia-config:X.Y.Z` ou acesso à URL do Render. **Problemas conhecidos:** ver o fim desta subseção.

###### Gatilho e política de release

- **Push na `main`** roda apenas Commit e Aceitação: valida a integração contínua, mas não implanta.
- **Decisão de projeto:** o Lançamento por tag é **entrega contínua** (o sistema está sempre pronto para ser liberado, e a tag é a decisão humana de liberar a baseline). **Implantação contínua** seria publicar em produção a cada merge na `main`; o grupo não a adotou, para que cada versão em produção corresponda a uma baseline identificada. Consequência: o último commit da `main` mostra o Lançamento como *skipped*; a execução completa das três etapas está na execução da tag (por exemplo, `v0.1.2`, run 45093771847).
- **Push de tag `vX.Y.Z`** roda o pipeline completo, incluindo o Lançamento.
- O job só executa se as etapas anteriores passarem (`needs`). Uma tag criada sobre um commit quebrado não gera release.
- A tag deve ser igual à versão do `package.json` (`v` + `version`). Se forem diferentes, o primeiro passo do job falha. Assim, a versão declarada no código e a versão publicada nunca divergem.

**Como gerar uma release:**

```bash
npm version 1.0.0 --no-git-tag-version   # atualiza package.json e package-lock.json
git commit -am "chore: release v1.0.0"

###### Versionamento do artefato

Versionamento semântico (`MAJOR.MINOR.PATCH`). Cada release publica a mesma imagem com várias tags (geradas por `docker/metadata-action`):

| Tag da imagem | Exemplo | Mutável? | Uso |
|---|---|---|---|
| `X.Y.Z` | `1.0.0` | Não | Referência oficial da release; é a tag implantada |
| `X.Y` | `1.0` | Sim | Última correção da linha 1.0 |
| `sha-<commit>` | `sha-e51f277` | Não | Rastreabilidade direta ao commit |
| `latest` | `latest` | Sim | Última release publicada |

A imagem também carrega a variável de ambiente `APP_VERSION` e labels OCI (`org.opencontainers.image.version`, `.revision`, `.source`). Com isso, uma imagem em execução pode ser rastreada até a tag e o commit que a geraram (auditoria).

###### Passos da etapa de Lançamento

| Passo | O que faz | Falha quando |
|---|---|---|
| Validar tag | Compara a tag com o `package.json` | Versões diferentes |
| Carregar a imagem aprovada | Baixa o artefato `app-image` gerado na Aceitação, faz `docker load` e compara o ID da imagem com o ID testado | IDs diferentes ou artefato ausente |
| Smoke test | Sobe o contêiner e chama `/health` | Contêiner não responde em ~30 s |
| Publicar no GHCR | Aplica as tags de "Versionamento do artefato" (`docker tag`) à **mesma** imagem e faz push, sem reconstruir | Falha de autenticação ou de rede |
| GitHub Release | Cria a release com notas geradas a partir dos commits/PRs. Num re-run, mantém a existente | Falha na API do GitHub |
| Deploy no Render | Chama o deploy hook com `imgURL` apontando para `X.Y.Z` | Secret ausente ou hook inválido |
| Verificar implantação | `scripts/deploy.sh` consulta `RENDER_APP_URL/health` (30 tentativas a cada 10 s, com timeout por requisição) e só passa quando o campo `version` é igual a `X.Y.Z` | `RENDER_APP_URL` ausente, versão diferente ou sem resposta no prazo |

O smoke test acontece **antes** do push. Uma imagem que nem sobe nunca chega ao registro.

###### Secrets e variáveis

Ficam configurados no GitHub Environment **`production`** (Settings → Environments), e não no código:

| Nome | Tipo | Conteúdo |
|---|---|---|
| `GITHUB_TOKEN` | Automático | Fornecido pelo Actions. Autentica no GHCR e cria o Release (permissões `packages: write` e `contents: write`, declaradas no job) |
| `RENDER_DEPLOY_HOOK_URL` | Secret | URL do deploy hook do serviço no Render (contém a chave de deploy) |
| `RENDER_APP_URL` | Variable | URL pública da aplicação (ex.: `https://tp-gerencia-config.onrender.com`). Usada na verificação pós-deploy e no link do environment |

Regras:
- Nenhuma credencial é versionada. O `.env` está no `.gitignore`.
- O workflow recebe só as permissões mínimas de que precisa.
- Os secrets do environment só ficam disponíveis para jobs que o declaram (`environment: production`), ou seja, só para o `release-stage`.

###### Configuração única do ambiente

1. **GHCR**: depois da primeira release, a imagem aparece em *Packages* do repositório. O repositório é público, mas o pacote do GHCR nasce privado por padrão; confira a visibilidade em *Packages*.
2. **Render**: criar um *Web Service* → *Existing Image* → `ghcr.io/guilhermevieira05/tp-gerencia-config:latest`.
   - Se o pacote estiver privado, cadastrar em *Registry Credentials* um GitHub PAT (classic) com escopo `read:packages`. Outra opção é tornar o pacote público no GHCR.
   - Plano *Free*. Health check path: `/health`.
3. Em *Settings → Deploy Hook* do Render, copiar a URL para o secret `RENDER_DEPLOY_HOOK_URL`.
4. No GitHub, criar o environment `production`, cadastrar o secret e a variável `RENDER_APP_URL`. Opcionalmente, marcar *Required reviewers* para exigir aprovação manual antes de cada implantação.

###### Rollback

Toda release fica disponível no GHCR com tag imutável. Para voltar a uma versão anterior:

- **Pelo Render:** *Manual Deploy* → informar a imagem `ghcr.io/guilhermevieira05/tp-gerencia-config:<versão anterior>`.
- **Pelo hook:** `curl -X POST -G "$RENDER_DEPLOY_HOOK_URL" --data-urlencode "imgURL=ghcr.io/guilhermevieira05/tp-gerencia-config:1.0.0"`.

A correção definitiva entra como nova release de patch (`vX.Y.Z+1`). Tags publicadas nunca são reescritas.

###### Problemas conhecidos

- O plano gratuito do Render hiberna o serviço após inatividade. A primeira requisição pode levar até ~1 min, o que a verificação pós-deploy tolera.
- **Verificação por versão (desde o PR da rodada final de correção):** `/health` devolve `{status, version}` e o `deploy.sh` só aceita o deploy quando `version` bate com a tag. As releases `v0.1.0` a `v0.1.2` foram implantadas **antes** dessa mudança: a instância atual no Render ainda responde `/health` sem `version`, e nelas a verificação só provou que a aplicação estava no ar, não que a versão nova a substituíra (no log da `v0.1.2`, "OK na tentativa 1"). A verificação por versão passa a valer na primeira release criada depois da integração desse PR.
- **Artefato único:** a imagem é construída uma só vez, na Aceitação, e passada ao Lançamento como artefato do workflow (`app-image`, retenção de 7 dias). O Lançamento confere o ID da imagem antes de publicar. Se o artefato expirar, é preciso reexecutar o pipeline da tag. O `npm run build` (`tsc`) da Etapa de Commit é uma **validação de compilação** e não gera o artefato entregue: o artefato que segue da Aceitação para o Lançamento é a **imagem Docker**, cujo estágio de build compila o TypeScript de novo dentro do `Dockerfile`. Não se afirma, portanto, que o `dist/` do Commit seja o binário entregue; o que se garante é que a imagem lançada é a mesma (mesmo ID) que passou na Aceitação.
- O Lançamento só roda em tag (a tag é a baseline). Push na `main` executa apenas Commit e Aceitação.

#### 3.3.2 Relatórios e auditorias

##### Relatórios

| Relatório | Fonte | Conteúdo | Frequência |
|---|---|---|---|
| Execuções do pipeline | GitHub Actions | Resultado, duração e commit de cada execução; logs de testes | A cada push na `main` e a cada tag |
| Estado das mudanças | Issues e PRs | Abertas, em revisão, concluídas; por responsável e prioridade | A cada marco |
| Releases | GitHub Releases e GHCR | Versão, notas geradas, imagem publicada | A cada tag |
| Histórico de baselines | Tabela em 3.1.2 | Tag, data, commit, conteúdo | A cada release |

**Defeitos:** classificados por criticidade (crítico: pipeline ou produção parados; alto: funcionalidade quebrada; médio: comportamento incorreto com contorno; baixo: cosmético). Analisam-se **tempo** em aberto, **contagem** por responsável, prioridade e estado, e **tendência** (acumulado e tempo médio de resolução) a partir das issues.

##### Auditorias de configuração

| Tipo | Quando | O que verifica | Responsável |
|---|---|---|---|
| Funcional | Antes de cada tag | Os requisitos e testes da versão passam; o contrato da API bate com o README | Rafael |
| Física | Antes de cada tag e antes da entrega | Todos os ICs estão versionados; nada de segredos, `node_modules` ou binários; tag = versão do `package.json`; imagem publicada = tag; `main` protegida | Rafael com Bernardo |
| Plano × realidade | Antes da entrega | Cada afirmação do plano é conferida no repositório, no pipeline e no histórico | Rafael e Gabriela |

**Checklist da auditoria física:**
- [ ] `git ls-files` sem `.env`, chaves ou binários
- [ ] `npm ci && npm run build && npm test` passam em clone limpo
- [ ] Pipeline verde com Commit, Aceitação e Lançamento
- [ ] Tag `vX.Y.Z` igual a `package.json` e com GitHub Release
- [ ] Imagem `ghcr.io/guilhermevieira05/tp-gerencia-config:X.Y.Z` existe e `/health` responde no Render
- [ ] Proteção da `main` ativa: `gh api repos/<dono>/<repo>/branches/main --jq '{protected, protection}'` mostra `protected: true` e os checks `Etapa de Commit` e `Etapa de Aceitacao` (o endpoint `.../protection` exige permissão de administrador e responde 404 às demais contas, mesmo com a proteção ativa); print de *Settings → Branches* em `docs/evidencias/`
- [ ] Toda PR mesclada referencia uma issue

**Registro:** cada rodada produz um relatório com data, commit auditado, achados e correções. Os relatórios das rodadas 1 a 3 eram de commits antigos e foram **removidos da árvore de trabalho** (issue #22); o resumo de cada um está na tabela abaixo e os arquivos continuam no histórico do Git, por exemplo: `git show b8ee699:docs/auditoria_configuracao.md`, `git show b8ee699:docs/auditoria_rodada2.md` e `git show b8ee699:docs/auditoria_rodada3.md`. Eles descrevem o estado do commit auditado, não o atual.

**Auditorias realizadas**

| Nº | Data | Commit | Resultado |
|---|---|---|---|
| 1 | 2026-11-22 | `cbce85e` | Relatório `auditoria_configuracao.md` (histórico do Git): aceitação fora da `main` e seções do plano faltantes; correções aplicadas na branch `fix/aceitacao-e-plano` |
| 2 | 2026-11-22 | `d042f02` | Relatório `auditoria_rodada2.md` (histórico do Git): faltavam backup/retenção/recuperação (3.3.1), prova de bloqueio do pipeline e artefato único. Corrigidos: seção de backup com teste de recuperação, imagem construída uma só vez e reaproveitada no Lançamento, plano alinhado ao pipeline. Execução vermelha registrada em `docs/evidencias/execucao-vermelha.md` (run 45093573497) |
| 3 | 2026-11-22 | `69b137f` (`v0.1.2`) | Relatório `auditoria_rodada3.md` (histórico do Git). Sem bloqueador. Achados: proteção da `main` descrita mas inativa; nenhuma review de PR registrada; arquivos de auditoria deletados no disco (restaurados); `/health` sem versão; lançamento só em tag e `tsc` do Commit não geram o artefato entregue (esclarecidos no plano); números e datas desatualizados. Correções no PR #18 (issue #17), mesclado em `fdcc342`, com a primeira review registrada do repositório (Rafael) |

**Desvios conhecidos (registrados nas auditorias 2 e 3):**

- Os PRs #1 a #7 foram abertos antes de o grupo registrar issues. A rastreabilidade issue → PR vale a partir do PR #13; os anteriores são rastreados pelo número do PR e pelo histórico de commits.
- **Proteção da `main`:** não existia até o PR #18, segundo a issue #11 (aberta até a ativação) e a declaração do dono; a auditoria 3 registrou 404 no endpoint de proteção, mas esse resultado não prova a ausência para contas sem permissão de administrador. Foi ativada pelo dono em 2026-11-23 (issue #11, fechada); evidência em `docs/evidencias/protecao-main.md`. O administrador pode contornar a regra. Os merges dos PRs #1 a #7, #13 a #16 e #18 ocorreram antes dela.
- **Nenhum dos PRs #1 a #7 e #13 a #16 tem review registrada** (a primeira é a do #18); ver "Procedimento definido × prática realizada" em 3.2.1.
- A regra `Closes #N` não foi aplicada nos PRs #14, #15 e #16; a estratégia de merge foi mista (#1, #5 e #7 com *merge commit*). Detalhes em 3.2.1.
- A verificação pós-deploy por versão só vale a partir da primeira release posterior à correção F-06 (3.3.1).

## 4. Marcos

| Marco | Data | Entrega de CM | Atualiza o plano? |
|---|---|---|---|
| M1: Scaffold e CI | 2026-11-11 | Repositório, API base, pipeline de Commit | Sim |
| M2: Domínio e Docker | 2026-11-13 a 2026-11-17 | Camada de domínio, `Dockerfile`, Lançamento no Render | Sim |
| M3: HTTP e testes | 2026-11-18 | Rotas, testes de integração, estratégia de testes | Sim |
| M4: Primeira release | 2026-11-19 | Tags `v0.1.0` e `v0.1.1`, imagem no GHCR | Sim |
| M5: Aceitação e documentação | 2026-11-22 | Etapa de Aceitação no pipeline, README, plano completo (v1.0) | Sim |
| M6: Auditoria final e release `v1.0.0` | 2026-11-27 | Auditoria física, tag da versão final, zip do repositório | Sim |
| M7: Entrega no Canvas e apresentação | 2026-11-29 (entrega); ordem da apresentação por sorteio em aula | Plano em PDF, zip, script de implantação, slides | Congelado |

**Quando atualizar o plano:** ao fim de cada marco; ao criar uma baseline; quando uma ferramenta, o pipeline ou o fluxo de mudança muda; e após cada auditoria com achado. Cada atualização gera uma linha no histórico de revisão e incrementa a versão do plano (`MINOR` para ajuste, `MAJOR` para mudança de processo).

## 5. Treinamento e recursos

| Papel | Conhecimento necessário | Como é obtido |
|---|---|---|
| Todos | Git (branch, PR, rebase/merge), Conventional Commits, SemVer, npm | Seção 3.1 e `docs/como-rodar.md`; revisão cruzada no primeiro PR de cada integrante |
| Responsável pelo pipeline | GitHub Actions, Docker multi-stage, GHCR, deploy hook do Render | Documentação oficial; subseção 3.3.1 |
| Testes | Jest, supertest, testes caixa-preta contra contêiner | o Apêndice B |
| CCB e auditoria | Conceitos de baseline, CCB e auditoria | Material da disciplina e este plano |

**Ferramentas e recursos:** Git/GitHub (repositório, issues, PRs, Actions, GHCR), Node.js 20, TypeScript 5, Jest 29, Docker, Render (plano gratuito). Todos os integrantes precisam de acesso de escrita ao repositório. Os segredos (`RENDER_DEPLOY_HOOK_URL`) ficam no *environment* `production` e só o presidente e o responsável por releases os gerenciam.

**Prática de disseminação:** todo integrante cria ao menos um PR que dispara o pipeline e participa de um ensaio da apresentação cobrindo o projeto inteiro.

## 6. Controle de software do subfornecedor e do fornecedor

Todo software de terceiros é open source ou serviço gratuito. Nada é copiado para dentro do repositório.

| Item | Origem | Controle de versão | Como entra |
|---|---|---|---|
| `express` 4 | npm | Faixa `^4.21.2` em `package.json`; versão exata em `package-lock.json` | PR que altera `package.json` e `package-lock.json` |
| Dependências de desenvolvimento (`typescript`, `jest`, `ts-jest`, `supertest`, tipos) | npm | Idem | Idem |
| Imagem base `node:20.20.2-alpine3.23` | Docker Hub | **Versão exata** fixa no `Dockerfile` (Node, patch e Alpine). Não recebe correções de segurança sozinha: a atualização é feita por PR | PR que altera o `Dockerfile` |
| Runner `ubuntu-24.04` | GitHub Actions | Versão fixa em `runs-on` (não usa `ubuntu-latest`) | PR que altera `pipeline.yml` |
| Actions (`actions/checkout@v4`, `setup-node@v4`, `docker/*@v3/v5/v6`) | GitHub Marketplace | Só a **versão maior** é fixada (`@vN`); correções menores chegam sem PR. Limitação aceita: não há fixação por *commit SHA* | PR que altera `pipeline.yml` |
| GitHub Container Registry | GitHub | Imagens com tag `X.Y.Z`, `X.Y`, `sha-*` e `latest` | Publicado pelo pipeline |
| Render | Render | Imagem implantada por tag `X.Y.Z` | Deploy hook acionado pelo pipeline |

**Regras:**
1. Dependência nova entra por PR, com justificativa, e sempre com `package-lock.json` atualizado; a instalação usa `npm ci`.
2. Atualizações de versão maior passam pelo CCB (afetam o contrato e o pipeline).
3. Antes de cada tag, roda-se `npm audit` e registram-se vulnerabilidades altas ou críticas na auditoria. Última execução: 2026-11-23, **0 vulnerabilidades** (inclusive só de produção), registrada em `docs/evidencias/npm-audit.md`.
4. Licenças: apenas licenças permissivas (MIT, Apache-2.0, ISC, BSD); conferir ao adicionar dependência.
5. Falha de um fornecedor (Render ou GHCR fora do ar): o artefato continua reproduzível a partir da tag com `docker build`; a versão anterior da imagem permite *rollback*.

## Apêndice A. O projeto e sua arquitetura

### O projeto

- **Nome:** `tp-gerencia-config` (API de gerenciamento de tarefas).
- **Origem:** projeto novo, desenvolvido pelo grupo (não reutiliza projeto público do GitHub, portanto o P-05 não se aplica).
- **Descrição:** API REST em TypeScript/Node.js (Express) que permite criar, consultar, atualizar, mudar o status e remover tarefas, além de gerar um resumo (total, contagem por status e tarefas atrasadas).
- **Papel no TP:** o sistema serve de objeto para as atividades de GC. Ele tem lógica testável (P-03) e é empacotável em contêiner para o pipeline de CI/CD.

### Arquitetura

Duas camadas, com dependência em um único sentido (HTTP → domínio):

| Camada | Diretório | Responsabilidade | Autor |
|---|---|---|---|
| Domínio | `src/domain/` | Regras de negócio, validação e armazenamento em memória. Não conhece HTTP. | Marcos |
| HTTP | `src/` (rotas e controladores) | Traduz requisições em chamadas ao `TaskService` e erros do domínio em códigos HTTP. | Carlos |

Decisões:
- **Repositório atrás de interface** (`TaskRepository`): hoje há só a implementação em memória, mas o serviço pode ser testado e trocado sem mudança de regras.
- **Relógio e gerador de ids injetáveis** no `TaskService`: testes determinísticos, sem depender de data real nem de UUID aleatório.
- **Erros tipados** (`ValidationError`, `NotFoundError`): a camada HTTP mapeia para 400 e 404 sem inspecionar mensagens.
- **Sem banco de dados:** o escopo do TP é GC e pipeline, então a persistência foi mantida simples. Os dados se perdem ao reiniciar o servidor.

### Estrutura do código de domínio

| Arquivo | Conteúdo |
|---|---|
| `src/domain/task.ts` | Tipos `Task`, `TaskStatus`, `TaskPriority`, entradas e filtros |
| `src/domain/errors.ts` | `ValidationError`, `NotFoundError` |
| `src/domain/validation.ts` | `validateTitle`, `validatePriority`, `validateStatus`, `validateDueDate` |
| `src/domain/task-repository.ts` | Interface `TaskRepository` e `InMemoryTaskRepository` (`save`, `findById`, `findAll`, `delete`, `clear`) |
| `src/domain/task-service.ts` | `TaskService` (`create`, `get`, `list`, `update`, `changeStatus`, `remove`, `summary`) |

### Evidência de tamanho (P-01 e P-02)

Contagem do código de produção (`src/`), feita pelo script `scripts/contar-requisitos.js`, que usa o compilador do TypeScript (AST):

- **Arquivos:** 12 (mínimo exigido: 10).
- **Funções e métodos:** 36 (mínimo exigido: 20).
- **Critério:** contam declarações de função, métodos de classe e funções atribuídas a variável ou propriedade. Não contam construtores nem callbacks anônimos. Testes, dependências e `dist/` ficam fora.
- **Reprodução:** `node scripts/contar-requisitos.js` (lista por arquivo) e `find src -name '*.ts' | wc -l` (arquivos). O registro está em `docs/contagem_requisitos.md`.

## Apêndice B. Testes e critérios de aceitação

### Níveis de teste

| Nível | Pasta | O que exercita | O que fica de fora | Ferramentas | Casos |
|---|---|---|---|---|---|
| Unidade | `tests/unit/` | Uma função ou classe isolada. Dependências são substituídas por dublês | Rede, Express, outras camadas | Jest + ts-jest | 117 |
| Integração | `tests/integration/` | Rotas HTTP ligadas ao domínio e ao repositório em memória, no mesmo processo | Contêiner, `Dockerfile`, porta real | Jest + `supertest` | 55 |
| Aceitação | `tests/acceptance/` | A aplicação empacotada, como cliente externo | Código interno (caixa-preta) | Jest + `fetch` | 22 |

Cada nível pega uma classe de defeito que os outros deixam passar:

- **Unidade** localiza o defeito: se `validateTitle` quebra, só o teste dela falha.
- **Integração** pega erros de ligação entre as camadas: rota registrada na ordem errada, erro do domínio mapeado para o código HTTP errado, corpo da requisição lido de forma incorreta.
- **Aceitação** pega o que só aparece no artefato final: arquivo que não entrou na imagem, variável de ambiente errada. É descrita nos critérios de aceitação deste apêndice.

### Critérios de aceitação

Cada critério vira um bloco `describe` no código, com cenários no formato **Dado / Quando / Então**.

| ID | Critério | Cenários |
|---|---|---|
| CA01 | A aplicação implantada responde ao health check | `/health` → 200 `{status: "ok", version}`; no pipeline, `version` deve ser igual à do `package.json` |
| CA02 | O usuário cria tarefas e entradas inválidas são recusadas | Criação com padrões (`todo`, `medium`) → 201; todos os campos → 201; sem título, título em branco, título > 100 caracteres, prioridade inválida, data inválida → 400 |
| CA03 | O usuário consulta e filtra tarefas | Por id → 200; id inexistente → 404; filtro por prioridade; filtro por status |
| CA04 | O usuário edita uma tarefa sem perder os outros campos | Edição parcial → 200 e campos não enviados preservados; título inválido → 400 sem alterar a tarefa; id inexistente → 404 |
| CA05 | O usuário move a tarefa entre os status | `todo → doing → done`; status inválido → 400; id inexistente → 404 |
| CA06 | O resumo reflete as tarefas | Total, contagem por status e atrasadas (tarefa concluída não conta como atrasada) |
| CA07 | O usuário remove tarefas | Remoção → 204 e depois 404; id inexistente → 404 |
| CA08 | Jornada completa | Criar → listar → editar → concluir → remover |

Ao todo são **22 cenários**.

#### Contrato HTTP assumido

Os critérios foram escritos a partir do contrato do `TaskService` (seção do Marcos, item 4) e da tabela de rotas acordada com a camada HTTP:

| Método e rota | Sucesso | Erros |
|---|---|---|
| `GET /health` | 200 | — |
| `POST /tasks` | 201 + tarefa | 400 |
| `GET /tasks?status=&priority=` | 200 + lista | 400 (filtro inválido; coberto só pela integração) |
| `GET /tasks/summary` | 200 + resumo | — |
| `GET /tasks/:id` | 200 + tarefa | 404 |
| `PATCH /tasks/:id` | 200 + tarefa | 400, 404 |
| `PATCH /tasks/:id/status` (corpo `{status}`) | 200 + tarefa | 400, 404 |
| `DELETE /tasks/:id` | 204 | 404 |

Qualquer mudança nessa tabela é uma mudança de contrato. Por isso, ela precisa atualizar a camada HTTP e os testes de aceitação **no mesmo pull request**.

### Gates de qualidade do pipeline

Uma mudança só entra na baseline (`main`) e uma versão só é liberada se passar, em ordem, por:

1. **Revisão de código** no pull request (proteção da `main`).
2. **Etapa de Commit:** compila sem erro e os testes de unidade e de integração passam.
3. **Etapa de Aceitação:** o contêiner sobe, responde ao `/health` e todos os 22 cenários passam.
4. **Etapa de Lançamento** (só em tag): versão da tag igual à do `package.json` e smoke test do contêiner antes de publicar.

Se qualquer etapa falhar, as seguintes não rodam (`needs`). Uma tag criada sobre um commit que não passa na aceitação não gera release.

### Limitações dos testes

- Os dados ficam em memória, então os testes não cobrem persistência nem reinício do servidor (o que está fora do escopo do projeto).
- O conjunto valida o comportamento funcional. Desempenho, carga e segurança não são testados.
- A imagem é construída **uma única vez**, na Aceitação, e salva como artefato do workflow (`app-image`). O Lançamento a carrega, confere o ID e publica a mesma imagem. Assim, o que foi testado é exatamente o que é publicado.

## Apêndice C. Pipeline como materialização do plano

```
push na main / PR / tag vX.Y.Z
   |
   v
[1. COMMIT]    npm ci -> build -> testes de unidade -> testes de integração
   |  (falhou? nada avança)
   v
[2. ACEITAÇÃO] constrói a imagem UMA vez -> sobe o contêiner -> 22 cenários via HTTP -> salva a imagem como artefato
   |  (falhou? não há lançamento)
   v
[3. LANÇAMENTO] (só em tag) carrega a MESMA imagem, confere o ID -> smoke test -> GHCR -> GitHub Release -> deploy.sh -> /health com a versão esperada
```

| Seção do plano | Onde aparece no pipeline |
|---|---|
| 2.2 Ferramentas | Runner, Node 20, Docker, GHCR, Render |
| 3.1 Identificação | Validação tag × `package.json`; tags e labels da imagem (`APP_VERSION`, `revision`, `source`) |
| 3.2 Controle de mudanças | Pipeline em PR e na `main`; Commit e Aceitação verdes antes do merge |
| 3.3.1 Release | Etapa de Lançamento e `scripts/deploy.sh` |
| 3.3.2 Auditoria | Registros de execução; artefato único (ID conferido) |
| 6 Fornecedores | `npm ci` com lockfile; imagem base e runner com versão exata; actions na versão maior (`@vN`) |

**Artefato único:** a imagem Docker é construída apenas na Aceitação (o `tsc` da Etapa de Commit é só validação de compilação). O Lançamento a recebe como artefato do workflow, compara o ID com o testado e só então aplica as tags e publica. O mesmo `scripts/deploy.sh` entregue ao professor é o chamado pelo pipeline.


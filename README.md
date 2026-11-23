# tp-gerencia-config

![Pipeline](../../actions/workflows/pipeline.yml/badge.svg)

API REST de gerenciamento de tarefas, usada como objeto do Trabalho Prático 1 de **Gerência de Configuração e Evolução de Software**. O foco do trabalho é o processo de GC em volta do código: controle de versões, pipeline de CI/CD em três etapas (Commit, Aceitação e Lançamento), releases versionadas e implantação automática.

## Sumário

- [Visão geral](#visão-geral)
- [Início rápido](#início-rápido)
- [Comandos](#comandos)
- [Endpoints](#endpoints)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Pipeline](#pipeline)
- [Como contribuir](#como-contribuir)
- [Documentação](#documentação)
- [Equipe](#equipe)

## Visão geral

| Item | Escolha |
|---|---|
| Linguagem | TypeScript 5 (modo `strict`) |
| Plataforma | Node.js 20 |
| Framework HTTP | Express 4 |
| Testes | Jest 29 + `ts-jest` + `supertest` |
| Armazenamento | Em memória (os dados se perdem ao reiniciar) |
| Artefato de release | Imagem Docker publicada no GitHub Container Registry (GHCR) |
| Produção | Render |
| CI/CD | GitHub Actions (`.github/workflows/pipeline.yml`) |

Cada tarefa tem título, descrição, status (`todo`, `doing`, `done`), prioridade (`low`, `medium`, `high`) e data de vencimento opcional. A API também gera um resumo com o total de tarefas, a contagem por status e quantas estão atrasadas.

## Início rápido

Pré-requisitos: **Node.js 20** e **npm** (o Docker é opcional).

```bash
git clone https://github.com/GuilhermeVieira05/tp-gerencia-config.git
cd tp-gerencia-config
npm ci            # instala as dependências exatas do package-lock.json
npm run build     # compila src/ para dist/
npm start         # sobe a API em http://localhost:3000
```

Em outro terminal:

```bash
curl http://localhost:3000/health
# {"status":"ok","version":"dev"}
```

O passo a passo completo, com Docker, testes, exemplos de requisição e solução de problemas, está em **[docs/como-rodar.md](docs/como-rodar.md)**.

## Comandos

| Comando | O que faz |
|---|---|
| `npm ci` | Instala as dependências travadas no `package-lock.json` |
| `npm run build` | Compila o TypeScript (`src/`) para `dist/` |
| `npm start` | Sobe a API a partir de `dist/` (porta `PORT`, padrão 3000) |
| `npm run test:unit` | Testes de unidade (`tests/unit/`) |
| `npm run test:integration` | Testes de integração (`tests/integration/`) |
| `npm test` | Unidade e integração |
| `npm run test:acceptance` | Testes de aceitação contra uma API já no ar (`BASE_URL`, padrão `http://localhost:3000`) |

## Endpoints

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| `GET` | `/health` | Verifica se a aplicação está no ar | 200 |
| `POST` | `/tasks` | Cria uma tarefa | 201 |
| `GET` | `/tasks?status=&priority=` | Lista tarefas, com filtros opcionais | 200 |
| `GET` | `/tasks/summary` | Total, contagem por status e atrasadas | 200 |
| `GET` | `/tasks/:id` | Consulta uma tarefa | 200 |
| `PATCH` | `/tasks/:id` | Edita título, descrição, prioridade ou vencimento | 200 |
| `PATCH` | `/tasks/:id/status` | Muda o status | 200 |
| `DELETE` | `/tasks/:id` | Remove uma tarefa | 204 |

Erros respondem no formato `{ "error": "mensagem" }`: **400** para entrada inválida, **404** para tarefa, rota ou método inexistente e **500** para falha inesperada.

## Estrutura do repositório

```
.
├── .github/workflows/pipeline.yml   # pipeline de CI/CD (Commit, Aceitação, Lançamento)
├── docs/
│   ├── como-rodar.md                # guia de execução
│   └── plano/                       # seções e plano consolidado (PLANO_DE_CM.md)
├── scripts/
│   ├── deploy.sh                    # script de implantação (usado pela etapa de Lançamento)
│   ├── contar-requisitos.js         # contagem de arquivos e funções (P-01, P-02)
│   └── gerar-entrega.sh             # gera PDFs e zip de entrega
├── src/
│   ├── domain/                      # regras de negócio, validação e repositório em memória
│   ├── http/                        # rotas, controlador, leitura de requisição e erros
│   ├── app.ts                       # monta o app Express
│   └── server.ts                    # ponto de entrada (listen)
├── tests/
│   ├── unit/                        # uma peça por vez, sem rede
│   ├── integration/                 # rotas + domínio, em processo
│   ├── acceptance/                  # caixa-preta, contra o contêiner
│   └── helpers/                     # utilitários compartilhados pelos testes
├── Dockerfile                       # build em dois estágios (build e runtime)
├── package.json                     # dependências, scripts e versão da aplicação
└── tsconfig.json / jest.config.js   # configuração do compilador e dos testes
```

## Pipeline

| Etapa | Job | Quando roda | O que faz |
|---|---|---|---|
| Commit | `commit-stage` | Push na `main` e tags `vX.Y.Z` | `npm ci`, build, testes de unidade e de integração |
| Aceitação | `acceptance-stage` | Depois da Commit | Constrói a imagem (uma única vez), sobe o contêiner e roda os testes de aceitação via HTTP; salva a imagem como artefato |
| Lançamento | `release-stage` | Só em tag `vX.Y.Z`, depois das anteriores | Carrega a **mesma** imagem testada, publica no GHCR, cria o GitHub Release e implanta no Render (`scripts/deploy.sh`) |

Em pull requests para a `main` rodam Commit e Aceitação. Uma etapa só roda se a anterior passar.

**Entrega contínua, não implantação contínua:** um push na `main` executa Commit e Aceitação (o Lançamento aparece como *skipped*); a tag `vX.Y.Z` é a decisão humana de liberar e dispara o Lançamento. A imagem Docker é construída uma única vez, na Aceitação, e é ela (mesmo ID, conferido) que o Lançamento publica; o `tsc` do Commit é só validação de compilação. A execução completa das três etapas está na tag `v0.1.2` (run 45093771847). `/health` informa a versão (`{"status":"ok","version":"X.Y.Z"}`) e o `scripts/deploy.sh` só aceita o deploy quando a versão confere; a produção atual (`v0.1.2`) é anterior a essa mudança.

**Sistema implantado:** https://tp-gerencia-config.onrender.com (`/health`). O plano gratuito do Render hiberna após inatividade, então a primeira requisição pode levar cerca de 1 minuto. Para gerar uma release, veja a seção de release em [docs/plano/secao-release-implantacao.md](docs/plano/secao-release-implantacao.md).

## Como contribuir

1. Atualize a `main` e crie uma branch `<autor>/<assunto>` (ex.: `gabriela/readme-plano`).
2. Faça commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
3. Rode `npm run build` e `npm test` antes de abrir o pull request.
4. Abra o pull request para a `main`, citando a issue (`Closes #N`), e peça revisão a outro integrante. Merge somente por *squash*.

> **Estado real:** a proteção da `main` está **ativa desde 2026-11-23** (checks obrigatórios `Etapa de Commit` e `Etapa de Aceitacao`, verificáveis com `gh api repos/<dono>/<repo>/branches/main`; o administrador pode contornar). "PR com 1 aprovação" e o bloqueio de *force-push* e de deleção não aparecem na API para contas sem permissão de administrador; estão comprovados pelo print de *Settings → Branches* em `docs/evidencias/protecao-main.png`. Os PRs #1 a #7 e #13 a #16 (#4 e #15 fechados sem merge) foram integrados **sem review registrada**; a primeira review é a do PR #18. O plano (3.2.1 e 3.3.2) registra esses desvios e `docs/evidencias/protecao-main.md` a verificação.

As convenções completas de nomenclatura e versionamento estão em [docs/plano/secao-introducao-configuracao.md](docs/plano/secao-introducao-configuracao.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/como-rodar.md](docs/como-rodar.md) | Como instalar, rodar, testar e empacotar a aplicação |
| [Introdução, itens de configuração, nomenclatura e versionamento](docs/plano/secao-introducao-configuracao.md) | Primeira parte do Plano de GC |
| [Projeto e arquitetura](docs/plano/secao-projeto-arquitetura.md) | Escopo do sistema e organização do código |
| [Estratégia de testes](docs/plano/secao-estrategia-testes.md) | Níveis de teste, convenções e critérios |
| [Release e implantação](docs/plano/secao-release-implantacao.md) | Etapa de Lançamento, Docker, secrets e rollback |
| [Backup, retenção e recuperação](docs/plano/secao-backup-recuperacao.md) | Onde ficam os artefatos e como restaurar |
| [Plano consolidado](docs/plano/PLANO_DE_CM.md) | Plano de GC completo, na estrutura do modelo (origem do PDF) |
| [Contagem de requisitos](docs/contagem_requisitos.md) | Evidência de P-01 e P-02 |
| [Auditorias](docs/auditoria_rodada3.md) | Rodadas 1 a 3 (`docs/auditoria_configuracao.md`, `docs/auditoria_rodada2.md`, `docs/auditoria_rodada3.md`) |

## Equipe

| Pessoa | Responsabilidade técnica |
|---|---|
| Guilherme | Repositório, proteção da `main` e workflow do GitHub Actions (etapa de Commit) |
| Marcos | Camada de domínio e seus testes de unidade; integração da Aceitação, script de implantação, plano consolidado e release `v0.1.2` (PRs #13, #14, #16) |
| Carlos | Camada HTTP, seus testes de unidade e os testes de integração |
| Mateus | Teste de aceitação automatizado e sua etapa no pipeline (PR #4, fechado sem merge; integrado pelo #13 com `Co-authored-by`) |
| Bernardo | Dockerfile e etapa de Lançamento (CD) |
| Gabriela | README e documentação de como rodar |
| Rafael | Revisão de código e dos pull requests (papel definido; sem commits; a primeira review registrada do repositório é dele, no PR #18) |

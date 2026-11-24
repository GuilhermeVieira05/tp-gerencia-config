# Seção do Plano de GC — Marcos, Treinamento e Fornecedores (4, 5 e 6)

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
| Todos | Git (branch, PR, rebase/merge), Conventional Commits, SemVer, npm | Seção 3 da introdução e `docs/como-rodar.md`; revisão cruzada no primeiro PR de cada integrante |
| Responsável pelo pipeline | GitHub Actions, Docker multi-stage, GHCR, deploy hook do Render | Documentação oficial; `secao-release-implantacao.md` |
| Testes | Jest, supertest, testes caixa-preta contra contêiner | `secao-estrategia-testes.md` e `secao-qualidade-aceitacao.md` |
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

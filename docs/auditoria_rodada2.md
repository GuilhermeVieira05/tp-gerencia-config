# Auditoria TP1 — Rodada 2

**Data:** 2026-11-22 · **Commit auditado:** `d042f02` (`main`) · **Entrega no Canvas:** 2026-11-29
**Régua:** `TP1_Gerencia_de_Configuracao_FONTE_DA_VERDADE.md` · **Roteiro:** `PROMPT_AUDITORIA_TP1.md`
**Método:** execução local (`npm run build`, `test:unit`, `test:integration`, `test:acceptance` contra `node dist/server.js`), `git log`/`git tag`, `gh` (runs, PRs, issues, proteção de branch), `curl` no deploy, leitura do `pipeline.yml`, `Dockerfile`, `scripts/deploy.sh` e de `docs/plano/*.md`.
**Não executado:** `docker build` e a execução do pipeline no GitHub (só li os logs de status via `gh run list`). Nenhum resultado foi inventado.
**Aviso:** a rubrica oficial não existe. A nota é estimativa, com a ponderação declarada na seção 10.

---

## 1. Veredito

- **Nota estimada hoje: 5,0–7,0 / 10.** Com os itens críticos fechados: 8,5–9,5.
- **Bloqueadores:** 3 dos 4 entregáveis não existem. Faltam o **Plano em PDF**, os **slides em PDF** e o **zip** do repositório. Não há nenhum `.pdf` no repositório.
- **3 maiores riscos:**
  1. Plano que afirma o que o repositório não prova: `main` protegida (API retorna 404), fluxo "issue → PR" (issues só foram criadas em 22/11), Rafael como gerente de configuração e revisor (0 commits).
  2. Lançamento só roda em tag e **nunca foi executado com o `deploy.sh` e a Aceitação**. A última execução do Lançamento é a `v0.1.1` (19/11), anterior aos dois. A imagem é reconstruída 3 vezes (sem artefato único).
  3. Sem execução vermelha de demonstração e sem seção de backup/retenção/recuperação (modelo 3.3.1).
- **Pontos fortes comprovados:** 12 arquivos e cerca de 40 funções em `src/`; 193 testes passando; Aceitação caixa-preta contra o contêiner; `needs` encadeando as 3 etapas; deploy no ar; nenhum atalho (`continue-on-error`, `skip`) nos testes; sem segredos no repositório.

---

## 2. Entradas ausentes / não verificáveis

| Entrada | Situação | Consequência |
|---|---|---|
| Plano de CM em PDF | Ausente. Existem 9 fragmentos `.md` em `docs/plano/`, sem arquivo unificado. | Capa, índice, texto azul de orientação e legibilidade do PDF **não verificáveis**. |
| Slides em PDF | Ausentes | AP-01, AP-02, AP-04, AP-05 e PL-03 **não verificáveis**. |
| Zip do repositório | Não gerado | Teste em pasta limpa **não verificável**. Auditei o clone. |
| Execução vermelha | Nenhuma deliberada. A falha da tag `v0.1.0` (run `44157170853`) não foi proposital e a causa não foi investigada. | A prova de bloqueio não existe. |
| Plano B da demo (gravação) | Não encontrado | Não verificável. |
| Atividade do Rafael | 0 commits e 0 PRs. Revisões nos PRs não auditadas. | Contradição com o plano (ver seção 5). |
| `docs/auditoria_configuracao.md` (rodada 1) | Commitado em `d042f02`, mas **deletado no working tree** (`git status: D`) | Decidir se restaura ou substitui por este arquivo. |
| URL pública no README | O README não contém o link do deploy (grep por `onrender` sem resultado) | Exigido pela recomendação da fonte (§5.1). |

---

## 3. Checklist de conformidade

| ID | Requisito | Status | Evidência | O que falta |
|---|---|---|---|---|
| P-01 | ≥ 10 classes/arquivos | ✅ | 12 `.ts` em `src/` (`find src -type f \| wc -l` = 12) | Documentar a contagem. O plano diz 5 arquivos (`secao-projeto-arquitetura.md:55`). |
| P-02 | ≥ 20 métodos/funções | ✅ | ~40 por grep de assinaturas e arrow functions. Por arquivo: task-service 15, task-controller 8, task-routes 8, task-repository 6, request-parsing 6, validation 4, error-handler 4. | Método de contagem oficial. A contagem é aproximada (grep). O plano diz 16 e está desatualizado. |
| P-03 | Testes executáveis | ✅ | 193 testes passando (116 + 55 + 22) | — |
| P-04 | Projeto novo/existente | ✅ | Autoral | Declarar no plano (conferir). |
| P-05 | Unicidade | ✅ | Autoral, sem risco | — |
| G-01 | Dispara em commit na `main` | ✅ | `on.push.branches: [main]`; run `45091932232` (main, push, success, 52 s) | — |
| C-01 | Build | ⚠️ | Step "Build" (`tsc`) passa, mas não gera artefato reaproveitado | `upload-artifact` ou usar a imagem como artefato |
| C-02 | Suíte automatizada | ✅ | 3 suítes (unit/integration/acceptance) | — |
| C-02a | Unidade | ✅ | Step "Testes de unidade" (`tests/unit`, 7 suítes, 116 testes) | — |
| C-02b | Integração | ✅ | Step separado (`tests/integration`, 4 suítes, 55 testes) | Integração é em processo, sem banco. Preparar a justificativa. |
| A-01 | Aceitação automatizada | ✅ | Job `acceptance-stage`: sobe o contêiner, espera `/health`, roda 22 cenários via `fetch`. `tests/acceptance` não importa `src/`. | — |
| L-01 | Entrega aos usuários | ⚠️ | `GET https://tp-gerencia-config.onrender.com/health` retornou 200 em 12,7 s (cold start). Último Lançamento: run `44607534306` (tag `v0.1.1`). | O Lançamento atual (com `deploy.sh`) nunca rodou. |
| L-02 | Docker ou servidor gratuito | ✅ | `Dockerfile` multi-stage, GHCR e Render | — |
| PL-01 | Plano em PDF | ❌ | Nenhum `.pdf` no repositório | Gerar o PDF |
| PL-02 | A partir do modelo | ⚠️ | Fragmentos usam numeração RUP (3.2 Mudanças, 3.4 Releases) em vez da do modelo (3.1.1…3.3.2) | Remapear para as seções 1–6 |
| PL-03 | Slides refletem o plano | ❔ | Sem slides | Anexar |
| PL-04 | Exemplos como referência | ❔ | Sem PDF para comparar | Verificar que nada foi copiado |
| AP-01 | ≤ 10 min | ❔ | Sem slides | Ensaiar com cronômetro |
| AP-02 | Plano + tecnologias + pipeline | ❔ | Sem slides | — |
| AP-03 | Ordem por sorteio | ❔ | Logística | Estar presente |
| AP-04 | Reflete o plano | ❔ | Sem slides | — |
| AP-05 | Lições aprendidas | ❔ | Sem slides | Slide final |
| Entregável 1 | Plano (.pdf) | ❌ | — | — |
| Entregável 2 | Repositório (.zip) | ❌ | Não gerado | Gerar e testar em pasta limpa |
| Entregável 3 | Script de implantação | ✅ | `scripts/deploy.sh` (comentado, sem segredos, é o chamado no step "Deploy no Render") | Enviar também como arquivo solto |
| Entregável 4 | Slides (.pdf) | ❌ | — | — |

---

## 4. Auditoria do pipeline

| Etapa / item | Resultado | Evidência |
|---|---|---|
| **Gatilho** | ✅ `push` em `main`, tags `v*.*.*` e `pull_request` | `pipeline.yml:3-9` |
| **Commit** | ✅ `npm ci`, Build, unidade e integração em steps distintos; Node 20; cache npm | job `commit-stage` |
| **Integração é integração?** | ⚠️ Usa supertest sobre o app Express em memória (rotas + controller + service + repositório). Integra componentes, mas sem banco. | `tests/integration/*` |
| **Aceitação** | ✅ Constrói a imagem, `docker run`, aguarda `/health` (15 × 2 s), roda `npm run test:acceptance` contra `BASE_URL`, mostra logs em falha e remove o contêiner. | job `acceptance-stage` |
| **Lançamento** | ⚠️ `if: startsWith(github.ref,'refs/tags/v')`. Em push na `main` o job é pulado. | `release-stage` |
| **Verificação pós-deploy** | ✅ Smoke local do contêiner e `curl /health` no Render. Esse segundo passo depende de `vars.RENDER_APP_URL`. | `deploy.sh` e step "Smoke test" |
| **Script de implantação** | ✅ Chamado pelo pipeline: `./scripts/deploy.sh "<imagem>:<versão>"` | step "Deploy no Render" |
| **Encadeamento** | ✅ `acceptance needs commit`, `release needs acceptance` | `needs:` |
| **Prova de bloqueio** | ❌ Nenhuma execução vermelha deliberada | `gh run list` |
| **Artefato único** | ❌ A imagem é construída na Aceitação (`APP_VERSION=github.sha`), no smoke e na publicação (`APP_VERSION=versão`). O build-arg é diferente, então o digest testado ≠ o publicado. Nada é passado entre jobs. | `acceptance-stage` e `release-stage` |
| **Versões fixadas** | 🔵 Actions em `@v4`/`@v5`/`@v6`; `node:20-alpine` sem digest | `Dockerfile:4,13` |
| **Segredos** | ✅ `secrets.RENDER_DEPLOY_HOOK_URL` e `GITHUB_TOKEN`; sem `.env` versionado (`.gitignore` e `.dockerignore` o excluem) | `git ls-files` |
| **Idempotência/rollback** | ✅ Release existente é mantido em re-run. Rollback documentado em `secao-release-implantacao.md` §8, mas nunca exercitado. | step "Criar GitHub Release" |
| **Atalhos** | ✅ Nenhum `continue-on-error`, `skip`, `xit` ou `\|\| true` em teste. Só `docker rm -f app \|\| true` na limpeza. | grep |
| **Dockerfile** | ✅ Multi-stage, `npm ci --omit=dev`, `USER node`, `HEALTHCHECK` | `Dockerfile` |

**Execuções (últimas):**

| Run | Ref | Evento | Resultado | Duração |
|---|---|---|---|---|
| `45091932232` | main | push (`d042f02`) | ✅ | 52 s |
| `45091763715` | `fix/aceitacao-e-plano` | pull_request | ✅ | 1m02s |
| `45086472310` | main | push (PR #7) | ✅ | 22 s |
| `44607534306` | `v0.1.1` | tag | ✅ | 1m21s |
| `44607466086` | main | push | ✅ | 24 s |
| `44418426028` | main | push (PR #5) | ✅ | 37 s |
| `44223955526` | main | push (PR #3) | ✅ | 31 s |
| `44157170853` | `v0.1.0` | tag | ❌ | 40 s (causa não investigada) |
| `44157081468` | main | push (PR #2) | ✅ | 32 s |

Observação: o run `45091932232` na `main` não executou o Lançamento (sem tag). Ou seja, **o caminho Commit → Aceitação → Lançamento completo, com `deploy.sh`, nunca foi provado**.

---

## 5. Contradições plano × repositório × pipeline × slides

| Afirmação | Onde | Realidade | Gravidade |
|---|---|---|---|
| "`main` protegida: só recebe mudanças por PR" | `secao-introducao-configuracao.md` (branches) e `secao-controle-mudancas.md:25` | `gh api repos/.../branches/main/protection` → 404. A issue #11 "Ativar proteção da branch main" está aberta. Pode ser falta de permissão do token, então confirmar na UI. | 🟠 |
| "O workflow não dispara em pull request" | `secao-estrategia-testes.md:158` | `pipeline.yml` tem `pull_request` desde `d042f02`. | 🟠 |
| "`release-stage` depende de `commit-stage`; há TODO no workflow" | `secao-release-implantacao.md:131` | Já é `needs: acceptance-stage`; não há TODO. | 🟡 |
| 5 arquivos e 16 funções; "grupo ainda precisa acordar método de contagem" | `secao-projeto-arquitetura.md:53-57` | Real: 12 arquivos e cerca de 40 funções. | 🟡 |
| Rafael: gerente de configuração, revisor, dono das seções 2–3.4 | README (tabela de papéis), `secao-controle-mudancas.md:15,32`, `secao-auditorias.md:18-20` | 0 commits e 0 PRs no histórico. | 🟠 |
| Fluxo "issue → branch → PR" e "toda PR referencia uma issue" | `secao-controle-mudancas.md:9`, `secao-auditorias.md:29` | PRs #1–#7 sem issue. As issues #8–#12 foram criadas no fim, em 22/11. | 🟠 |
| Backup, retenção e recuperação de desastres (modelo 3.3.1) | Modelo, seção 3.3.1 | `grep backup\|retenç\|recuper docs/plano` sem resultado. Só há Rollback (versão) e falha de fornecedor. | 🟠 |
| Marco M6: tag `v1.0.0` em 27/11 | `secao-marcos-treinamento-fornecedores.md:12` | Só existem `v0.1.0` e `v0.1.1`. Coerente enquanto for futuro. | 🔵 |
| Pipeline "Commit → Aceitação → Lançamento" ligado a commit | `secao-qualidade-aceitacao.md:28` | Lançamento só em tag. O plano declara isso, mas é divergência em relação ao enunciado G-01. | 🟡 |
| Numeração do plano (3.2 Mudanças, 3.4 Releases) | Cabeçalhos dos fragmentos | O modelo usa 3.2.1, 3.2.2, 3.3.1, 3.3.2. | 🟡 |
| Identidades de autoria | `git log` | 8 e-mails distintos e o nome "Mateus Araujo **Sanotos**"; Marcos aparece com 3 variações. | 🔵 |
| Slides × plano | — | Sem slides | ❔ |

---

## 6. Resultados de execução

| Comando | Resultado |
|---|---|
| `npm run build` | ✅ `tsc` sem erros |
| `npm run test:unit` | ✅ 7 suítes, 116 testes, 1,4 s |
| `npm run test:integration` | ✅ 4 suítes, 55 testes, 0,9 s |
| `node dist/server.js` (porta 3999) + `BASE_URL=http://localhost:3999 npm run test:acceptance` | ✅ 1 suíte, 22 testes (CA01–CA08) |
| `curl https://tp-gerencia-config.onrender.com/health` | ✅ HTTP 200, `{"status":"ok"}`, 12,7 s (cold start) |
| Busca de atalhos (`continue-on-error`, `\|\| true`, `.skip`, `xit`, `xdescribe`, `test.todo`) | Só `docker rm -f app \|\| true` (limpeza) |
| `git ls-files` | 48 arquivos; sem `.env`, `node_modules`, `dist` |
| Contagem de arquivos em `src/` | 12 |
| Contagem de funções/métodos (grep) | ~40 (aproximada; não é AST) |
| `docker build` | **Não executado** |
| Zip em pasta limpa | **Não executado** (zip não existe) |

Nota: a Aceitação local roda contra o Node direto, não contra o contêiner. A validação em contêiner só consta nos runs do GitHub (`45091763715` e `45091932232`, ambos verdes).

---

## 7. Achados priorizados

### A-01 Plano em PDF inexistente
- **Severidade:** 🔴 Crítico
- **Requisito:** PL-01, PL-02, Entregável 1
- **Evidência:** nenhum `.pdf` no repositório. Os fragmentos estão em `docs/plano/` e usam numeração RUP.
- **Por que importa:** é um dos 4 entregáveis e a base de AP-04.
- **Correção:** unificar os 9 fragmentos num documento com a estrutura do modelo (capa, histórico, índice, seções 1.1–6), sem texto de orientação, e exportar para PDF. Abrir o PDF e conferir página a página.
- **Esforço:** horas

### A-02 Slides em PDF inexistentes
- **Severidade:** 🔴 Crítico
- **Requisito:** AP-01..AP-05, Entregável 4
- **Evidência:** nenhum arquivo de slides.
- **Por que importa:** o AP-05 (lições aprendidas) e a demo dependem deles.
- **Correção:** montar 8–10 slides (projeto, plano, tecnologias, pipeline com demo, lições aprendidas específicas). Ensaiar com cronômetro. Gravar uma demo de reserva.
- **Esforço:** horas

### A-03 Zip do repositório não gerado nem testado
- **Severidade:** 🔴 Crítico
- **Requisito:** Entregável 2
- **Evidência:** não há zip.
- **Correção:** `git archive` não inclui `.git`. Para incluir o histórico, zipar a pasta excluindo `node_modules/` e `dist/`. Descompactar em pasta limpa e rodar `npm ci && npm run build && npm test`. Verificar tamanho. Decidir sobre o `.git` com o professor.
- **Esforço:** minutos

### A-04 Lançamento nunca rodou com Aceitação e `deploy.sh`
- **Severidade:** 🟠 Alto
- **Requisito:** L-01, L-02, Entregável 3
- **Evidência:** a última execução do `release-stage` é a `44607534306` (19/11). `deploy.sh` e `acceptance-stage` entraram em 22/11 (`d042f02`). O `deploy.sh` pode ter erro e só seria descoberto na demo.
- **Correção:** criar a tag `v0.1.2` (ou `v1.0.0`) após atualizar `package.json`, e ver o pipeline completo verde. Confirmar que o `RENDER_DEPLOY_HOOK_URL` e `RENDER_APP_URL` continuam configurados.
- **Esforço:** minutos

### A-05 Sem execução vermelha de demonstração
- **Severidade:** 🟠 Alto
- **Requisito:** §3.4 da fonte (prova de bloqueio)
- **Evidência:** nenhuma execução vermelha deliberada. A falha da `v0.1.0` não serve como prova (causa desconhecida).
- **Correção:** abrir PR com um teste quebrado, deixar a Etapa de Commit falhar e registrar o link e o print (`docs/evidencias/`). Fazer o mesmo para a Aceitação, se possível.
- **Esforço:** minutos

### A-06 Plano afirma "`main` protegida" sem comprovação
- **Severidade:** 🟠 Alto
- **Requisito:** PL-03
- **Evidência:** API 404; issue #11 aberta.
- **Correção:** ativar a proteção (PR obrigatório e checks "Etapa de Commit" e "Etapa de Aceitação"), tirar print e salvar em `docs/evidencias/`. Se não puder ativar, reescrever o plano para refletir a realidade.
- **Esforço:** minutos

### A-07 Seção de backup/retenção/recuperação ausente
- **Severidade:** 🟠 Alto
- **Requisito:** modelo 3.3.1
- **Evidência:** `grep` sem resultado em `docs/plano`.
- **Correção:** escrever o texto: repositório no GitHub (e espelho/clone local), imagens no GHCR com tags imutáveis, retenção dos releases, passos de restauração (`git clone` + `docker build` da tag). Testar a restauração uma vez e registrar.
- **Esforço:** horas

### A-08 Papéis e processo do plano divergem da prática
- **Severidade:** 🟠 Alto
- **Requisito:** PL-03, AP-04
- **Evidência:** Rafael sem commits ou PRs; PRs #1–#7 sem issue.
- **Correção:** Rafael revisa e aprova pelo menos um PR real e faz um commit, ou ajustar o plano. Para a rastreabilidade, fazer os próximos PRs fecharem issues (`Closes #N`) e registrar a limitação honestamente nas lições aprendidas.
- **Esforço:** horas

### A-09 Plano com trechos desatualizados
- **Severidade:** 🟡 Médio
- **Requisito:** PL-03
- **Evidência:** ver seção 5 (`secao-estrategia-testes.md:158`, `secao-release-implantacao.md:131`, `secao-projeto-arquitetura.md:53-57`).
- **Correção:** atualizar as 3 passagens: PR agora dispara o pipeline, o `needs` já aponta para a Aceitação, e a contagem real é 12 arquivos e cerca de 40 funções, com o método descrito.
- **Esforço:** minutos

### A-10 Artefato não é único
- **Severidade:** 🟡 Médio
- **Requisito:** §3.3 da fonte
- **Evidência:** 3 builds (`acceptance-stage`, smoke, publicação) com `APP_VERSION` diferente.
- **Correção:** opção A (mais simples): mesmo build-arg nas duas etapas e declarar a limitação no plano. Opção B: a Aceitação publica a imagem como artefato (`docker save` + `upload-artifact`), e o Lançamento a carrega (`docker load`) e publica a mesma imagem.
- **Esforço:** horas (B) · minutos (A)

### A-11 Lançamento só em tag, não em commit na `main`
- **Severidade:** 🟡 Médio
- **Requisito:** G-01
- **Evidência:** `if: startsWith(github.ref,'refs/tags/v')`.
- **Correção:** manter e justificar (a tag é a baseline) ou **[SUGESTÃO]** perguntar ao professor. A defesa deve citar que o pipeline dispara no commit e o Lançamento é a entrega contínua, não a implantação contínua.
- **Esforço:** minutos

### A-12 Contagem de métodos não documentada
- **Severidade:** 🟡 Médio
- **Requisito:** P-01, P-02
- **Evidência:** a fonte exige "anexar contagem". `docs/` não tem `contagem_requisitos.md`.
- **Correção:** criar `docs/contagem_requisitos.md` com o comando de arquivos e uma listagem de funções por arquivo (ou script), declarando se construtores e getters contam.
- **Esforço:** minutos

### A-13 README sem link do deploy
- **Severidade:** 🔵 Baixo
- **Requisito:** fonte §5.1
- **Correção:** adicionar a URL do Render e a observação de cold start (~1 min).
- **Esforço:** minutos

### A-14 Identidades de autoria inconsistentes
- **Severidade:** 🔵 Baixo
- **Correção:** `.mailmap` unificando nomes e e-mails; corrigir "Sanotos" no `.mailmap`.
- **Esforço:** minutos

### A-15 Versões não fixadas em imagem base e actions
- **Severidade:** 🔵 Baixo
- **Correção:** fixar `node:20-alpine` por digest ou versão menor; declarar no plano (seção 6) como dependência de terceiros.
- **Esforço:** minutos

### A-16 Arquivos de auditoria e prompt fora do controle
- **Severidade:** 🔵 Baixo
- **Evidência:** `docs/auditoria_configuracao.md` deletado no working tree; `PROMPT_AUDITORIA_TP1.md` e a fonte da verdade não versionados.
- **Correção:** decidir o que entra no zip. Restaurar ou substituir a auditoria da rodada 1 por este documento; commitar o que fizer parte da entrega.
- **Esforço:** minutos

### A-17 💡 Sugestão: `/health` com versão
- **Evidência:** `secao-release-implantacao.md` §9 já admite que `/health` não informa `APP_VERSION`, então o pós-deploy não prova que a versão nova substituiu a anterior.
- **Correção:** incluir `version` na resposta de `/health` e comparar no `deploy.sh`.
- **Esforço:** horas

---

## 8. Plano de correção (pontos recuperados ÷ esforço)

| # | Ação | Achado | Esforço | Responsável |
|---|---|---|---|---|
| 1 | Gerar zip e testar em pasta limpa | A-03 | minutos | `[PREENCHER]` |
| 2 | Criar tag e ver o pipeline completo verde com `deploy.sh` | A-04 | minutos | `[PREENCHER]` (Bernardo) |
| 3 | PR com teste quebrado para a execução vermelha, com print | A-05 | minutos | `[PREENCHER]` |
| 4 | Ativar proteção da `main` e registrar print | A-06 | minutos | `[PREENCHER]` (Guilherme) |
| 5 | Corrigir trechos desatualizados e criar `contagem_requisitos.md` | A-09, A-12 | minutos | `[PREENCHER]` |
| 6 | Escrever seção 3.3.1 (backup/retenção/recuperação) | A-07 | horas | `[PREENCHER]` |
| 7 | Unificar o plano no modelo e exportar o PDF | A-01 | horas | `[PREENCHER]` |
| 8 | Alinhar papéis e rastreabilidade (Rafael revisa um PR; PRs fecham issues) | A-08 | horas | `[PREENCHER]` |
| 9 | Montar slides, ensaiar com cronômetro e gravar demo de reserva | A-02 | horas | `[PREENCHER]` |
| 10 | README com URL, `.mailmap`, pinagem de versões | A-13..A-15 | minutos | `[PREENCHER]` |
| 11 | Artefato único (opção B) | A-10 | horas | `[PREENCHER]` |

---

## 9. Simulação do professor

### 9.1 Dez perguntas técnicas sobre os pontos fracos reais

| # | Pergunta | Resposta esperada | Erro provável |
|---|---|---|---|
| 1 | Vocês dizem que a `main` é protegida. Mostrem. | Settings → Branches com PR obrigatório e os 2 checks. Se não está ativa, admitir e explicar. | Afirmar sem mostrar; a API retornou 404. |
| 2 | O Lançamento não roda no push na `main`. O enunciado fala em commit. Por quê? | A tag é a baseline; o pipeline dispara a cada commit (Commit + Aceitação) e a entrega é decisão do grupo (entrega contínua). | Dizer que "não deu tempo". |
| 3 | A imagem que passou na Aceitação é a mesma que foi publicada? | Não é o mesmo digest: é construída 3 vezes, com mesmo `Dockerfile` e contexto, mas build-arg diferente. É uma limitação conhecida; a melhoria seria `docker save`/`load`. | Dizer "sim, é a mesma" sem checar. |
| 4 | Mostrem uma execução em que o pipeline bloqueou o lançamento. | Run vermelho do PR com teste quebrado; o job seguinte aparece como "skipped" por causa do `needs`. | Não ter a execução. |
| 5 | Qual a diferença entre o seu teste de integração e o de unidade? | Integração usa supertest sobre o app (rota + controller + service + repositório). A unidade isola cada módulo (task-service com repositório fake etc.). | Dizer que "só muda a pasta". |
| 6 | Seu teste de aceitação não importa `src/`. Por que importa? | Valida o contêiner empacotado pelo comportamento visível por HTTP: pega arquivo que não entrou na imagem, variável de ambiente errada, porta. | Confundir com teste de integração. |
| 7 | Como vocês provam 20 métodos? | Mostrar a contagem e o método (e se getters/construtores contam). | Dar o número do plano (16) ou chutar. |
| 8 | Quem é o Rafael e o que ele fez? | Gerente de configuração: revisa PRs e conduz auditorias. Precisa haver evidência. | Ninguém sabe responder. |
| 9 | Onde está o backup do repositório e como restaura? | GitHub + clone local + imagens no GHCR com tags imutáveis; restauração = clone + `docker build` da tag. | Dizer "o GitHub faz". |
| 10 | O que a auditoria encontrou e o que mudaram? | Citar achados reais desta auditoria (seção 7) e as correções com commit. | Dizer "encontramos tudo certo". |

### 9.2 Cinco perguntas armadilha

1. **Unidade × integração × aceitação:** o que cada um valida e qual é o seu exemplo no projeto?
   Resposta: componente isolado × componentes juntos em processo × sistema empacotado em execução, pelo comportamento do usuário.
2. **Baseline × release:** toda tag é as duas coisas?
   Resposta: a baseline é o conjunto de ICs aprovado e congelado; a release é a versão entregue. No projeto, a tag `vX.Y.Z` é as duas, mas os conceitos são diferentes (uma baseline pode não ser liberada).
3. **CI × entrega contínua × implantação contínua:** onde estão?
   Resposta: CI em todo push; entrega contínua (a imagem fica pronta, a liberação é por tag, decisão humana); não é implantação contínua.
4. **CCB:** quem é, o que decide e o que acontece num hotfix?
   Resposta: presidente, gerente de configuração e responsável por releases. Triagem das issues e aprovação de tags. No hotfix, o CCB é avisado depois e a decisão é registrada.
5. **Rastreabilidade:** de uma versão em produção, como chegam ao requisito?
   Resposta: imagem (`APP_VERSION` e labels OCI) → tag → commit → PR → issue. Admitir que os PRs #1–#7 não têm issue.

### 9.3 Três cenários de mudança

| Cenário | Resposta ideal |
|---|---|
| **O deploy falha em produção** | 1) `deploy.sh` retorna erro (health-check falha após 30 tentativas) e o job fica vermelho. 2) O Render mantém a versão anterior. 3) Registrar a falha em issue de prioridade alta. 4) Corrigir por PR; nova tag `PATCH`. 5) Se for urgente, rollback: Manual Deploy com a imagem anterior ou `curl` no deploy hook com `imgURL`. |
| **Dois devs alteram o mesmo módulo** | Branches `<autor>/<assunto>` a partir da `main`. O segundo PR a ser mesclado atualiza a branch (`git merge main`/rebase), resolve o conflito, e o pipeline do PR (Commit + Aceitação) valida antes do merge. Revisor que não seja o autor aprova. |
| **Precisa reverter uma versão** | Tags são imutáveis e as imagens ficam no GHCR. Reverter por Manual Deploy ou hook com a imagem anterior. A correção definitiva entra como nova release `PATCH` (`vX.Y.Z+1`). Nunca reescrever tag. Registrar a decisão do CCB na issue. |

### 9.4 Partes que costumam ficar com uma pessoa

| Parte | Hoje | Pergunta para checar todos |
|---|---|---|
| Pipeline de Lançamento e Render | Bernardo | "O que `needs` faz? Onde está o secret do Render e como o `deploy.sh` o usa?" |
| Aceitação | Mateus | "Por que o teste de aceitação não importa `src/`? O que ele pega que a integração não pega?" |
| Plano de CM | Rafael e Gabriela | "Quem autoriza uma baseline? Qual é o fluxo de mudança, do pedido ao merge?" |
| Docker | Bernardo | "Por que dois estágios no `Dockerfile`? Por que `USER node`?" |
| Camada HTTP | Carlos | "O que acontece com um JSON inválido? Onde fica o tratamento de erro?" |

Cada integrante responde sobre o projeto inteiro. Fazer com que todos criem um commit que dispare o pipeline.

---

## 10. Estimativa de nota

Ponderação assumida (a rubrica oficial não existe; confirmar com o professor):

| Dimensão | Peso | Estimativa (pior–melhor) | Principais perdas |
|---|---:|---|---|
| Plano de CM | 2,5 | 0,5–2,0 | Sem PDF; 3.3.1 ausente; numeração fora do modelo; contradições |
| Projeto e testes | 1,5 | 1,3–1,5 | Contagem não documentada; integração sem banco |
| Pipeline (Commit, Aceitação, Lançamento) | 3,0 | 2,0–2,8 | Sem execução vermelha; Lançamento atual não provado; artefato não único; só em tag |
| Entregáveis e coerência plano × repo × slides | 1,5 | 0,3–1,2 | Zip e slides inexistentes; papéis e proteção divergentes |
| Apresentação e lições aprendidas | 1,5 | 0,0–1,2 | Sem slides e sem ensaio |
| **Total** | **10** | **4,1–8,7 (hoje, sem corrigir A-01..A-03: ≈ 5,0–7,0 se as lacunas forem fechadas parcialmente)** | |

Após fechar as correções 1–9 do plano, a estimativa sobe para 8,5–9,5.

---

## 11. Checklist final "pronto para entregar" (só o que não foi comprovado)

- [ ] Plano em **PDF**, no modelo, sem texto azul, com capa e histórico de revisão
- [ ] Seção 3.3.1 (backup/retenção/recuperação) escrita
- [ ] Trechos desatualizados do plano corrigidos (A-09)
- [ ] Papéis do plano batendo com a prática (Rafael com evidência)
- [ ] Proteção da `main` ativa e com print (ou plano reescrito)
- [ ] Execução vermelha deliberada registrada
- [ ] Execução verde completa com tag, Aceitação e `deploy.sh` registrada
- [ ] `docs/contagem_requisitos.md` criado
- [ ] README com URL do deploy
- [ ] Zip gerado, aberto em pasta limpa, com build e testes passando; sem `node_modules`/`dist`/segredos
- [ ] `scripts/deploy.sh` enviado também como arquivo solto
- [ ] Slides em PDF, legíveis, com lições aprendidas específicas
- [ ] Ensaio cronometrado (≤ 10 min) e demo gravada de reserva
- [ ] Todos os integrantes dominam o projeto inteiro
- [ ] Auditoria de configuração registrada (este documento commitado ou substituído)
- [ ] URL do Render verificada na véspera (cold start)

---

## 12. Perguntas para o professor

1. Qual é a **rubrica** (pesos de plano, pipeline, testes, apresentação)?
2. O **Lançamento só em tag** atende o G-01, ou o enunciado exige a entrega a cada commit na `main`?
3. O zip deve incluir **`.git`**? Qual o limite de tamanho no Canvas?
4. **Build** de TypeScript (`tsc`) conta como "compilação"?
5. O script de implantação vai **separado** do zip? Em qual formato?
6. A integração em memória, sem banco, atende o teste de integração?
7. A nota é **individual** ou do grupo? Há arguição por integrante?
8. O exemplo "Datasus" é mesmo o plano da Fábrica de Software?

---

## Os 5 ajustes que mais aumentam a nota, em ordem

1. **Gerar o Plano em PDF** no modelo, incluindo a seção 3.3.1, e corrigir as contradições (proteção da `main`, PR, papéis).
2. **Gerar os slides em PDF**, com lições aprendidas específicas, e ensaiar com cronômetro mais demo gravada.
3. **Criar a tag e provar o pipeline verde completo** (Commit → Aceitação → Lançamento com `deploy.sh`), mais **uma execução vermelha** que bloqueia o Lançamento.
4. **Ativar a proteção da `main`** e fazer o Rafael revisar um PR, para o plano bater com o repositório.
5. **Gerar o zip e abrir numa pasta limpa** com `npm ci && npm run build && npm test`, e enviar o `deploy.sh` à parte.

---

## Status das correções (atualizado em 2026-11-22, depois da rodada)

| Achado | Status | Evidência |
|---|---|---|
| A-01 Plano em PDF | ✅ Gerado (23 páginas) | `docs/plano/PLANO_DE_CM.md` + `entrega-tp1/Plano_de_Gerenciamento_de_Configuracao.pdf` |
| A-02 Slides em PDF | ✅ Gerado (10 slides) | `docs/slides/slides.html` + `entrega-tp1/Slides_TP1.pdf` |
| A-03 Zip | ✅ Gerado e testado em pasta limpa (`npm ci`, build, 171 testes) | `scripts/gerar-entrega.sh` |
| A-04 Lançamento com `deploy.sh` | ⏳ Pendente: exige criar tag e push | — |
| A-05 Execução vermelha | ⏳ Pendente: exige PR com teste quebrado | — |
| A-06 Proteção da `main` | ⏳ Pendente: configuração no GitHub (issue #11) | — |
| A-07 Backup/retenção/recuperação | ✅ `secao-backup-recuperacao.md`, com recuperação testada | — |
| A-08 Rafael / issues | ⚠️ Desvios registrados em `secao-auditorias.md`; falta evidência de Rafael | — |
| A-09 Trechos desatualizados | ✅ Corrigidos (inclusive "repositório privado", que é público) | — |
| A-10 Artefato único | ✅ Implementado no `pipeline.yml`; validado localmente (`docker save`/`load` com mesmo ID). Falta a execução no Actions. | — |
| A-12 Contagem | ✅ `docs/contagem_requisitos.md` (12 arquivos, 36 funções, por AST) | — |
| A-13 README com URL | ✅ | — |
| A-14 `.mailmap` | ⚠️ Só a identidade do Marcos. O sobrenome "Sanotos" do Mateus não foi alterado: confirmar a grafia. | — |

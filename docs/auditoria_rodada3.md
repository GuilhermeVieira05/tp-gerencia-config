# Auditoria de Configuração — TP1 (rodada 3)

> **Relatório histórico** do estado do commit `69b137f` (`v0.1.2`). Não descreve o estado atual: as correções estão na branch `marcos/correcao-final` (issue #17) e o que depende do dono do repositório (proteção da `main`, issue #11) segue aberto. Uma imprecisão sobre a autoria do Mateus foi corrigida neste arquivo (nota no achado F-07). **Nota:** os "404" do endpoint `.../branches/main/protection` citados aqui não provam a ausência de proteção, porque esse endpoint exige permissão de administrador e responde 404 às demais contas; a ausência foi confirmada depois pela issue #11 e pela declaração do dono.

**Auditado:** commit `69b137f` (HEAD de `main`, tag `v0.1.2`) · **Data:** 2026-11-22 · **Régua:** `TP1_Gerencia_de_Configuracao_FONTE_DA_VERDADE.md`
**Método:** execução real em cópia limpa (`git archive HEAD`), consulta à API do GitHub (`gh`), extração de texto dos PDFs de `../entrega-tp1/` e descompactação do zip entregue. Onde não executei, está dito.

---

## 1. Veredito

- **Nota estimada: 8,0 a 9,3 (ponto médio ≈ 8,7).** A rubrica oficial não existe; a ponderação assumida está na seção 10.
- **Nenhum bloqueador.** Pipeline dispara na `main`, aceitação roda contra o contêiner, lançamento está no ar, projeto acima do mínimo, 4 entregáveis existem, nenhum segredo encontrado.
- **Maior risco 1 (🟠):** o plano, o README e os slides descrevem controles que o GitHub **não aplica**. A `main` não tem proteção (API retorna 404, `rulesets` vazio, issue #11 aberta) e **nenhum dos 11 PRs tem review**. É a incoerência plano × realidade que a fonte da verdade chama de "aparece na arguição".
- **Maior risco 2 (🟠):** os arquivos `docs/auditoria_configuracao.md` e `docs/auditoria_rodada2.md` aparecem **deletados no working tree** (não commitado), mas o plano (seção 3.3.2) os cita como registro das auditorias.
- **Maior risco 3 (🟡):** a distribuição de autoria na `main` é concentrada: Marcos tem 4 dos 10 commits não-merge, e Rafael não tem commit nem review em lugar nenhum. A Aceitação é do Mateus (3 commits no PR #4, fechado sem merge), integrada pelo squash #13 do Marcos, onde o Mateus consta só como `Co-authored-by` (correção posterior: ver a nota ao final da seção 7, F-07).

---

## 2. Entradas ausentes / não verificáveis

| Item | Situação |
|---|---|
| Plano (PDF), slides (PDF), zip, `deploy.sh` | **Presentes** em `../entrega-tp1/` (plano 23 págs., slides 10 págs.) |
| Rubrica, data de entrega, limite do zip | Ausentes do enunciado (fonte da verdade, seção 12) |
| Gravação da demo (plano B dos slides) | ❔ Não encontrada no repositório nem em `../entrega-tp1/` |
| Visibilidade do pacote no GHCR e credencial do Render | ❔ Não verificável por mim (o plano cita "credencial do registro" no painel do Render) |
| Conteúdo dos secrets do environment `production` | ❔ Nunca inspecionado, por regra. O environment existe (`gh api .../environments`) |
| Varredura de segredos no **conteúdo** do histórico completo | ❔ Só varri o working tree e os **nomes** de arquivos adicionados no histórico (nenhum `.env`, `.pem`, `.key`, `.zip`, `.pdf`) |
| Confirmação de P-05 com o professor | Não se aplica: projeto autoral |

---

## 3. Checklist de conformidade

| ID | Requisito | Status | Evidência | O que falta |
|---|---|---|---|---|
| P-01 | ≥10 arquivos/classes | ✅ | `find src -name '*.ts'` = **12**; `docs/contagem_requisitos.md` | Folga de +2 |
| P-02 | ≥20 métodos/funções | ✅ | `node scripts/contar-requisitos.js` = **36** (AST, sem construtores nem callbacks) | — |
| P-03 | Casos de teste | ✅ | Jest: 116 unidade + 55 integração + 22 aceitação, todos verdes (seção 7) | — |
| P-04 | Origem declarada | ✅ | Plano e `contagem_requisitos.md`: projeto autoral | — |
| P-05 | Sem duplicidade | ✅ | Projeto autoral, não é repo público de terceiros | — |
| G-01 | Gatilho em commit na `main` | ✅ | `pipeline.yml:3-9` (`push: branches: [main]`); runs `45093764876`, `45093552320`, `45091932232` na `main` | Ver F-04 (lançamento só em tag) |
| C-01 | Build | ⚠️ | `npm run build` (`tsc`) no job `commit-stage`; passa na cópia limpa | O job não publica `dist/` como artefato; o artefato é a imagem (F-05) |
| C-02 | Suíte de testes | ✅ | Steps "Testes de unidade" e "Testes de integracao" no job | — |
| C-02a | Unidade | ✅ | `tests/unit/` (7 suítes, 116 testes) com `npm run test:unit` | — |
| C-02b | Integração | ✅ | `tests/integration/` (4 suítes, 55 testes): Express + service + repositório em memória via supertest | Não há banco/serviço externo (ver pergunta-armadilha 2) |
| A-01 | Aceitação automatizada | ✅ | `tests/acceptance/` (22 testes), `fetch` por HTTP, sem importar `src/`; roda contra o contêiner no job `acceptance-stage` | — |
| L-01 | Entrega ao usuário | ✅ | `https://tp-gerencia-config.onrender.com/health` → HTTP 200 `{"status":"ok"}` (testado agora); 3 GitHub Releases | — |
| L-02 | Docker ou servidor gratuito | ✅ | Imagem no GHCR + Render (plano gratuito) | — |
| PL-01 | Arquivo .pdf | ✅ | `Plano_de_Gerenciamento_de_Configuracao.pdf`, 23 págs. | Metadado `Title: doc.html` (F-11) |
| PL-02 | A partir do modelo | ✅ | Seções 1 a 6 e todas as subseções presentes e preenchidas | — |
| PL-03 | Slides refletem o plano | ⚠️ | Maioria coerente | Slide 3 "Baselines existentes: v0.1.0 e v0.1.1" (já existe v0.1.2); slide 4 "Revisor que não é o autor" sem prova (F-02) |
| PL-04 | Não copiar exemplos | ✅ | Nenhuma seção vazia nem marcador azul no texto extraído; texto adaptado a Git/CI/Docker | — |
| AP-01 | ≤10 min | ⚠️ | 10 slides, roteiro 0:00–10:00 sem folga | Ensaio cronometrado não comprovado (F-12) |
| AP-02 | Plano + tecnologias + pipeline | ✅ | Slides 3–6 | — |
| AP-03 | Ordem por sorteio | ❔ | Depende da aula | — |
| AP-04 | Reflete o plano | ⚠️ | Ver PL-03 | — |
| AP-05 | Lições aprendidas ao final | ✅ | Slide 9: 4 lições no formato problema → causa → mudança → o que faria diferente | — |
| E-1 | Plano .pdf | ✅ | `../entrega-tp1/Plano_...pdf` | Regerar após resolver F-01 a F-03 |
| E-2 | Repositório .zip | ⚠️ | `tp-gerencia-config.zip`, 661 KB, com `.git`, HEAD `69b137f`, sem `node_modules`/`dist` | Ficará desatualizado se houver novo commit (F-03) |
| E-3 | Script de implantação | ✅ | `deploy.sh` entregue é **idêntico** ao `scripts/deploy.sh` do repo e do zip (`diff -q`) | — |
| E-4 | Slides .pdf | ✅ | `Slides_TP1.pdf`, 10 págs., 960×540 | — |

---

## 4. Auditoria do pipeline

| Item | Resultado | Evidência |
|---|---|---|
| **Gatilho (G-01)** | ✅ | `push` em `main`, `push` em tag `v*.*.*`, `pull_request` para `main`. Sem filtro `paths` ou `if` que bloqueie. Runs na `main`: `45093764876` (success), `45093552320`, `45091932232`, `45086472310`, etc. |
| **Etapa Commit** | ✅ | Steps distintos: `npm ci` → Build → "Testes de unidade" → "Testes de integracao" |
| **Aceitação (A-01)** | ✅ | Constrói a imagem, `docker run -p 3000:3000`, espera `/health`, roda `npm run test:acceptance` contra `localhost:3000`. **Reproduzi**: build da imagem, contêiner `healthy`, 22/22 testes passando contra ele |
| **Lançamento (L-01/L-02)** | ✅ | Tag `v0.1.2`, run `45093771847`: validar tag × `package.json` → carregar imagem → comparar ID → login GHCR → smoke test → push → Release → `scripts/deploy.sh` |
| **Deploy pelo script entregue** | ✅ | `pipeline.yml:203` chama `./scripts/deploy.sh` |
| **Encadeamento** | ✅ | `needs: commit-stage` (l.39), `needs: acceptance-stage` (l.103). Execução vermelha: run `45093573497` (PR #15), Commit ❌, Aceitação ⏭️, Lançamento ⏭️ (`docs/evidencias/execucao-vermelha.md`) |
| **Artefato único** | ⚠️ | A imagem é construída **uma vez** (Aceitação), salva com `docker save`, e o Lançamento confere o ID (`image_id` via `outputs`). Mas o Commit compila `tsc` sem publicar `dist/`, e o Dockerfile compila de novo (F-05) |
| **Atalhos suspeitos** | ✅ nenhum | `grep` por `skip`, `xit`, `xdescribe`, `.only`, `continue-on-error`, `\|\| true`: **só** `docker rm -f app \|\| true` (l.95), no cleanup. Nenhum teste desabilitado |
| **Segredos** | ✅ | `RENDER_DEPLOY_HOOK_URL` e `GITHUB_TOKEN` via `secrets.*`; `RENDER_APP_URL` via `vars.*`; `deploy.sh` não contém URL nem token |
| **Qualidade** | ⚠️ | `cache: npm`, Node 20 fixo, `permissions` mínimas no release, `environment: production`. Imagens base `node:20-alpine` e `ubuntu-latest` flutuantes. Release idempotente (corrigido no PR #3). Rollback só manual (documentado) |
| **Pós-deploy** | ⚠️ | `deploy.sh` consulta `/health`, mas `/health` devolve só `{"status":"ok"}` e **não identifica a versão**; com `RENDER_APP_URL` vazia a verificação é pulada em silêncio (F-06) |

**Histórico de execuções** (`gh run list`, 17 runs): 15 success, 2 failure.

| Data (UTC) | Evento / ref | Resultado | Observação |
|---|---|---|---|
| 11-23 01:17 | push tag `v0.1.2` | ✅ success | Commit 24 s · Aceitação 42 s · Lançamento 30 s |
| 11-23 01:17 | push `main` (`69b137f`) | ✅ success | Lançamento `skipped` (por desenho: só em tag) |
| 11-23 01:16 | PR #16 | ✅ success | |
| 11-23 01:15 | PR #15 `marcos/demo-pipeline-vermelho` | ❌ failure | **Intencional** (prova de bloqueio) |
| 11-23 01:15 | push `main` (`f8df11f`) | ✅ success | |
| 11-17 19:18 | push tag `v0.1.0` | ❌ failure | HTTP 422: Release já existia. Corrigido pelo PR #3; é a lição 1 dos slides. **Falha real, não flaky** |

---

## 5. Contradições plano × repositório × pipeline × slides

| # | Afirmação | Onde está | Realidade | Gravidade |
|---|---|---|---|---|
| 1 | "`main` … Protegida: só recebe mudanças por PR" | Plano 3.1.1 (Branches); README "Nenhuma mudança entra direto na `main`" | `gh api .../branches/main/protection` → 404; `gh api .../rulesets` → `[]`; issue #11 "Ativar proteção da branch main" **aberta**. O plano admite o desvio só em 3.3.2 ("Desvios conhecidos"); o README não | 🟠 |
| 2 | "ao menos 1 aprovação de outro integrante"; "2 aprovações explícitas" para pipeline/Dockerfile | Plano 3.2.1 e 3.2.2; slide 4 | **11 PRs, 0 reviews.** Os PRs #13 e #14 alteraram `pipeline.yml` e `Dockerfile`, e todos os mesclados foram aprovados sem review registrada. Rafael ("revisa PRs") tem 0 commits e 0 reviews | 🟠 |
| 3 | Registro das auditorias em `docs/auditoria_configuracao.md` e `docs/auditoria_rodada2.md` | Plano 3.3.2 (linhas 573–580) | `git status`: ` D` (deletados no disco, não commitados). Estão em `HEAD` e dentro do zip, mas não no working tree | 🟠 |
| 4 | "A rastreabilidade issue → PR vale a partir do PR #13" | Plano 3.3.2 | Só o #13 tem `Closes #N`; **#14 e #16 não têm**. Issues #11 e #12 ainda abertas; há só 5 issues no total | 🟡 |
| 5 | Autoria: Mateus = "teste de aceitação e sua etapa no pipeline"; Rafael = "revisão de código" | README Equipe; Plano 2.1 e IC-06 | Mateus: 0 commits **na `main`**, mas autor de 3 commits do PR #4 (fechado sem merge), cujo conteúdo entrou pelo squash #13 (autor Marcos) com `Co-authored-by` para ele. Rafael: 0 commits e 0 reviews em qualquer branch | 🟡 |
| 6 | "Merge por squash" | Plano 3.2.1; slide 4 | Misto: PRs #1, #5, #7 entraram como *merge commit*; #2, #3, #6, #13, #14, #16 como squash | 🔵 |
| 7 | "Baselines existentes: v0.1.0 e v0.1.1" | Slide 3 | Existe `v0.1.2` (Release "Latest"); o plano não menciona `v0.1.2` | 🔵 |
| 8 | "repositório pequeno (48 arquivos versionados)" | Plano 2.2 | `git ls-files` = **59** em `HEAD` | 🔵 |
| 9 | "Proteção da `main` exigindo os 2 checks" listada como "próximo passo" | Slide 10 | Coerente com a realidade, mas contradiz o slide 4 e o plano 3.2.1, que a descrevem como existente | 🔵 |
| 10 | "Execuções prévias … e gravação da demo" | Slide 6 | Nenhuma gravação encontrada | 🟡 |

Coerências **confirmadas**: 12 arquivos / 36 funções / 193 testes (slides = contagem = execução); "171 testes" na recuperação = 116 + 55; "116 + 55" e "22 testes" no slide 5; `deploy.sh` entregue = usado; tags anotadas (`git for-each-ref` → `tag`); tag = versão do `package.json` (validado no pipeline); Release e imagem por tag.

---

## 6. Resultados de execução

Ambiente: macOS, Node v26.13.0 (o pipeline usa 20), Docker 29.9.2. Cópia limpa via `git archive HEAD` em pasta do scratchpad.

| Comando | Resultado real |
|---|---|
| `npm ci` | OK |
| `npm run build` | OK, gera `dist/app.js`, `dist/server.js`, `dist/domain/`, `dist/http/` |
| `npm run test:unit` | **7 suítes, 116 testes passando** |
| `npm run test:integration` | **4 suítes, 55 testes passando** |
| `node scripts/contar-requisitos.js` | **12 arquivos, 36 funções/métodos** |
| Servidor local (`node dist/server.js`) + `npm run test:acceptance` | **1 suíte, 22 testes passando** |
| `docker build` (`APP_VERSION=0.1.2`) + `docker run` | Imagem construída; `/health` → `{"status":"ok"}`; healthcheck `healthy`; `User=node` |
| `npm run test:acceptance` contra o contêiner | **22/22 passando** |
| `curl https://tp-gerencia-config.onrender.com/health` e `/tasks/summary` | HTTP 200 (resposta em 0,7 s, instância acordada) |
| `gh run list`, `gh pr list`, `gh api` (proteção, rulesets, releases, environments) | Resultados citados nas seções 4 e 5 |
| Zip: descompactado em pasta limpa | Contém `.git` (HEAD `69b137f`), 3 tags, sem `node_modules`, `dist` ou `.env`. **Não rodei `npm ci` dentro do zip** (o `gerar-entrega.sh` faz isso; o conteúdo é idêntico ao `HEAD` que testei) |
| Workflow YAML | Lido por inspeção; **não** validei com `actionlint`. As execuções reais no GitHub são a prova de validade |

**Não executado:** o job de Lançamento fora do GitHub (depende de secrets); o cold start do Render com a instância hibernada; Node 20 local (usei o 26; a CI usa o 20 e passou).

---

## 7. Achados priorizados

### [F-01] Proteção da `main` descrita, mas inexistente
- **Severidade:** 🟠 Alto
- **Requisito afetado:** PL-03, AP-04 (coerência plano × repositório); fonte da verdade 4.4 ("plano coerente com o repositório real")
- **Evidência:** `gh api repos/GuilhermeVieira05/tp-gerencia-config/branches/main/protection` → 404; `rulesets` → `[]`; issue #11 aberta. Plano 3.1.1, README ("Nenhuma mudança entra direto na `main`") e slide 4 afirmam o contrário.
- **Por que importa:** é a pergunta mais provável da arguição ("mostre que a `main` é protegida"). O plano já confessa o desvio em 3.3.2, mas o README e os slides não.
- **Correção:** (a) ativar em *Settings → Branches* (ou Rulesets): exigir PR, ≥1 aprovação, status checks "Etapa de Commit" e "Etapa de Aceitação", bloquear force-push. Fechar a issue #11 com print. (b) Se não for possível, trocar o texto do README e do slide 4 por "disciplina do grupo" e manter o desvio registrado.
- **Esforço:** minutos
- **Atenção:** com a exigência de aprovação ligada, o dono do repo precisa de um segundo revisor (ou de bypass explícito para o admin). Ative **antes** de gerar o PDF final.

### [F-02] Nenhuma revisão de PR registrada
- **Severidade:** 🟠 Alto
- **Requisito afetado:** PL-03/AP-04; plano 3.2.1 e 3.2.2 (fluxo e CCB "igual ao praticado")
- **Evidência:** `gh pr list --state all`: 11 PRs, `reviews=0` em todos. Plano exige ≥1 aprovação de outro integrante e 2 para mudanças em pipeline/Dockerfile; os PRs #13 e #14 mudaram o pipeline. Rafael, gerente de configuração e revisor, tem 0 atividade.
- **Por que importa:** o CCB descrito não tem nenhum registro de decisão. A fonte da verdade pede fluxo "igual ao praticado".
- **Correção:** antes de entregar, abrir um PR pequeno de ajuste (por exemplo, o das correções desta auditoria) e fazer **Rafael** revisar e aprovar de verdade, registrando a decisão do CCB no PR. Em paralelo, acrescentar ao "Desvios conhecidos" (3.3.2) que os PRs #1 a #16 foram integrados sem review formal. Não afirmar o que não houve.
- **Esforço:** minutos a 1 hora

### [F-03] Arquivos de auditoria deletados no disco; plano depende deles
- **Severidade:** 🟠 Alto
- **Requisito afetado:** PL-03; fonte da verdade 9.2 ("auditoria executada e registrada")
- **Evidência:** `git status`: ` D docs/auditoria_configuracao.md`, ` D docs/auditoria_rodada2.md`. Plano 3.3.2: "O resultado vai em `docs/auditoria_configuracao.md` e `docs/auditoria_rodada2.md`". O zip atual os contém.
- **Por que importa:** se a deleção for commitada, o plano aponta para registro inexistente. Se não for, o zip e o disco divergem.
- **Correção:** decidir uma das duas. (a) `git restore docs/auditoria_*.md` e manter (recomendado: a auditoria executada é evidência exigida). (b) Commitar a deleção, mas então apontar o plano 3.3.2 para outro registro (por exemplo, este `AUDITORIA_TP1.md` movido para `docs/`) e regerar PDF e zip. Registrar **esta** auditoria como a rodada 3 no plano.
- **Esforço:** minutos

### [F-04] Lançamento só dispara em tag, não em commit na `main`
- **Severidade:** 🟡 Médio
- **Requisito afetado:** G-01, L-01 (interpretação do enunciado)
- **Evidência:** `pipeline.yml:104` (`if: startsWith(github.ref, 'refs/tags/v')`). Run `45093764876` (push na `main`): Lançamento `skipped`.
- **Por que importa:** o enunciado diz que o pipeline é "disparado a cada commit na principal", com 3 etapas. Um professor que clique no último commit da `main` verá o Lançamento pulado. O plano e os slides explicam a decisão (entrega contínua com tag como decisão humana), então a defesa existe, mas é uma interpretação.
- **Correção:** (a) levar para a demo a execução **da tag** (já planejado) e dizer na primeira frase do slide 5 que o commit na `main` percorre as 2 primeiras etapas e a tag, a terceira; ou (b) fazer o Lançamento rodar também em push na `main` (implantação contínua). A opção (b) muda o plano e arrisca deploy a cada merge. **[SUGESTÃO]** manter (a) e perguntar ao professor (seção 12).
- **Esforço:** minutos (a) · horas (b)

### [F-05] "Build" da Etapa de Commit não gera artefato; compilação duplicada
- **Severidade:** 🟡 Médio
- **Requisito afetado:** C-01, "artefato único" (fonte da verdade 3.3)
- **Evidência:** `commit-stage` roda `npm run build` e não faz upload de `dist/`. O `acceptance-stage` roda `npm ci` de novo e `docker build` compila `tsc` outra vez dentro do Dockerfile (estágio `build`).
- **Por que importa:** a fonte da verdade recomenda "um passo explícito chamado Build com artefato gerado". O mesmo artefato vale de Aceitação para Lançamento (provado pelo ID), mas não do Commit. O slide 5 diz "A imagem é construída uma só vez", o que é verdade para a imagem, não para o código compilado.
- **Correção:** (a) ajustar o texto: "a **imagem** é o artefato; o `tsc` do Commit é validação de compilação"; ou (b) mover o `docker build` para o Commit e passar a imagem adiante. **[SUGESTÃO]** (a), por custo.
- **Esforço:** minutos (a) · horas (b)

### [F-06] Verificação pós-deploy não prova que a versão nova está no ar
- **Severidade:** 🟡 Médio
- **Requisito afetado:** L-01/L-02 (qualidade do lançamento)
- **Evidência:** `src/http/health-routes.ts:7` devolve `{status:'ok'}` sem versão. `scripts/deploy.sh:32-35`: com `RENDER_APP_URL` vazia, pula a verificação e sai com 0.
- **Por que importa:** o Render continua respondendo pela versão antiga enquanto a nova sobe; o health-check pode passar sem que o deploy tenha concluído. O próprio slide 10 lista isso como próximo passo.
- **Correção:** `/health` retornar `{status, version: process.env.APP_VERSION}`; o `deploy.sh` comparar com a versão do argumento até bater ou estourar o tempo; falhar (não pular) se `RENDER_APP_URL` estiver vazia no pipeline. Adicionar 1 teste de unidade e 1 de aceitação.
- **Esforço:** 1 a 2 horas

### [F-07] Autoria concentrada e atribuições que não batem com o Git
- **Severidade:** 🟡 Médio
- **Requisito afetado:** AP-04; fonte da verdade 10 ("só uma pessoa entende o pipeline")
- **Evidência:** `git log --no-merges`: Marcos 4, Bernardo 3, Carlos 1, Gabriela 1, Guilherme 1, **Mateus 0, Rafael 0** na `main` (13 commits no total, 10 não-merge). O PR #4 do Mateus foi fechado sem merge; as 3 autorias dele ficam na branch remota `mateus/teste-aceitacao`. Os PRs #13, #14 e #16, que contêm Aceitação, script, plano consolidado, artefato único e release, são todos do Marcos.
- **Por que importa:** na arguição, quem constar como dono da revisão (Rafael) precisará explicar algo sem nenhum registro seu. O caso do Mateus é mais brando do que escrevi inicialmente: ver a nota abaixo.
- **Nota de correção (verificada depois, na rodada final):** `git log origin/mateus/teste-aceitacao` mostra 3 commits do Mateus (`746abb8`, `39b09e1`, `67b63b5`) com a etapa de Aceitação e os 22 cenários; o squash #13 traz `Co-authored-by: Mateus ...` na mensagem. A autoria dele existe, mas não aparece em `git shortlog` da `main`. Rafael não tem nada.
- **Correção:** (a) cada integrante com 0 commits fazer um PR real e pequeno que dispare o pipeline (fonte da verdade 10, mitigação "todos fazem um commit"), e Rafael revisar de verdade; (b) ajustar a tabela do README e do plano 2.1 ao que ocorreu. Não reescrever história.
- **Esforço:** 1 a 2 horas

### [F-08] Rastreabilidade issue → PR não segue o próprio critério
- **Severidade:** 🟡 Médio
- **Requisito afetado:** plano 3.2.1 (rastreabilidade), fonte da verdade 7.4
- **Evidência:** `gh pr view`: `Closes #N` só no #13; #14 e #16 sem vínculo. Plano diz que a regra vale "a partir do PR #13". Issues #11 e #12 abertas.
- **Por que importa:** contradiz o desvio que o plano registra e o checklist de auditoria ("toda PR mesclada referencia uma issue").
- **Correção:** abrir/fechar issues para o que falta (#11 ao ativar a proteção; #12 ao entregar), e corrigir o texto: "vale a partir do #13, exceto #14 e #16". Os próximos PRs com `Closes #N`.
- **Esforço:** minutos

### [F-09] Integração sem componente externo e testes de unidade com mocks
- **Severidade:** 💡 Sugestão
- **Requisito afetado:** C-02b (risco de interpretação)
- **Evidência:** `tests/integration/` usa supertest sobre o app Express real, com `TaskService` e repositório em memória: integra HTTP + domínio, sem banco.
- **Por que importa:** atende "componentes juntos", mas um professor rigoroso pode perguntar "integra com quê?". A resposta precisa estar pronta (pergunta-armadilha 2).
- **Correção:** apenas preparar a resposta. Se sobrar tempo, nada a codar.
- **Esforço:** minutos

### [F-10] Merge misto (squash × merge commit)
- **Severidade:** 🔵 Baixo
- **Requisito afetado:** plano 3.2.1
- **Evidência:** `git log`: "Merge pull request #1/#5/#7" × "(#2)/(#3)/(#6)/(#13)/(#14)/(#16)".
- **Correção:** acrescentar em "Desvios conhecidos": "#1, #5 e #7 foram mesclados com merge commit; a regra de squash vale a partir do #13". Ou ativar só squash em *Settings → General*.
- **Esforço:** minutos

### [F-11] Números e metadados soltos no PDF e nos slides
- **Severidade:** 🔵 Baixo
- **Requisito afetado:** PL-01, PL-03
- **Evidência:** plano diz "48 arquivos versionados" (real: 59); PDF com `Title: doc.html`; slide 3 omite `v0.1.2`.
- **Correção:** trocar "48" por "59" (ou remover o número); definir `<title>` no HTML do `md2pdf.py`; incluir `v0.1.2` no slide 3. Regerar tudo com `./scripts/gerar-entrega.sh`.
- **Esforço:** minutos

### [F-12] Slides sem folga e plano B não comprovado
- **Severidade:** 🟡 Médio
- **Requisito afetado:** AP-01
- **Evidência:** 10 slides com roteiro 0:00–10:00; a demo (slide 6) ocupa 2:30 e inclui "Mesma imagem: log com o ID testado". O plano B cita "gravação da demo", que não existe nos arquivos.
- **Por que importa:** o enunciado fixa 10 min como máximo. Com 7 pessoas e uma demo, o estouro é provável sem ensaio. As execuções do Actions levam ~1,5 min ao vivo.
- **Correção:** gravar a demo (verde, vermelha, `/health` no Render) e deixá-la fora do zip, mas à mão; ensaiar com cronômetro; mostrar execuções **já concluídas** em vez de disparar uma ao vivo.
- **Esforço:** 1 hora

### [F-13] Versões flutuantes e rollback manual
- **Severidade:** 🔵 Baixo
- **Requisito afetado:** qualidade de engenharia (Etapa 3, item 7)
- **Evidência:** `node:20-alpine`, `ubuntu-latest`, `actions/*@v4` sem digest; rollback documentado, não automatizado.
- **Correção:** opcional. Citar na arguição como limitação consciente; fixar `node:20.x-alpine` se houver tempo.
- **Esforço:** minutos

### Itens verificados sem achado
- **Segredos:** nenhum valor de token, URL de hook ou chave no working tree ou no zip. As menções são só nomes de variáveis (`RENDER_DEPLOY_HOOK_URL`, `GITHUB_TOKEN`).
- **`.gitignore`/zip:** ignora `node_modules/`, `dist/`, `coverage/`, `.env`; zip sem binários nem dependências.
- **Atalhos no pipeline:** nenhum teste desabilitado nem `continue-on-error`.
- **Documentação:** README com como rodar, testar, pipeline e link do deploy; `docs/como-rodar.md` completo.

---

## 8. Plano de correção (ordenado por pontos recuperados ÷ esforço)

| # | Ação | Achado | Esforço | Responsável |
|---|---|---|---|---|
| 1 | Ativar a proteção da `main` (PR, 1 aprovação, 2 checks) e fechar a issue #11 com print | F-01 | minutos | `[PREENCHER]` (Guilherme) |
| 2 | `git restore docs/auditoria_*.md` **ou** reapontar o plano; registrar esta auditoria como rodada 3 | F-03 | minutos | `[PREENCHER]` |
| 3 | PR de ajustes com **Rafael** revisando e aprovando de verdade; `Closes #N` | F-02, F-08 | minutos a 1 h | `[PREENCHER]` (Rafael) |
| 4 | Corrigir textos: "48" → "59", `v0.1.2` no slide 3, merge misto, rastreabilidade a partir do #13 exceto #14/#16, título do PDF | F-04, F-05, F-08, F-10, F-11 | minutos | `[PREENCHER]` |
| 5 | Rafael com 1 PR real e Mateus (se quiserem) também; alinhar a tabela de papéis | F-07 | 1–2 h | `[PREENCHER]` |
| 6 | Gravar a demo de reserva e ensaiar com cronômetro | F-12 | 1 h | `[PREENCHER]` |
| 7 | `/health` com versão e `deploy.sh` que confirma a versão | F-06 | 1–2 h | `[PREENCHER]` (Bernardo) |
| 8 | Regerar PDFs e zip (`./scripts/gerar-entrega.sh`) **depois de commitar tudo** e testar o zip em outra máquina | F-03 | minutos | `[PREENCHER]` |

---

## 9. Simulação do professor

### 9.1 Dez perguntas técnicas sobre os pontos fracos reais

| # | Pergunta | Resposta esperada | Erro mais provável |
|---|---|---|---|
| 1 | Mostre que a `main` é protegida. | Settings → Branches com PR, 1 aprovação e os 2 checks. Se ainda não estiver: "não, a issue #11 registra; foi disciplina do grupo, e o desvio consta em 3.3.2". | Afirmar que está protegida sem ter ativado |
| 2 | Quem revisou o PR #14? Onde está a aprovação do CCB? | Hoje: nenhuma review registrada; o desvio consta no plano. Daqui para a frente, Rafael aprova pelo GitHub e a decisão fica no PR. | Dizer "o Rafael olhou" sem prova |
| 3 | Um commit na `main` chega à produção? | Não. Atravessa Commit e Aceitação; o Lançamento só roda em tag `vX.Y.Z` (entrega contínua: a tag é a decisão humana). | Dizer que sim, ou não saber que `release-stage` tem `if` de tag |
| 4 | O artefato testado é o mesmo que foi implantado? Como prova? | A Aceitação constrói `app:candidate`, salva com `docker save`; o Lançamento carrega e compara o ID com o `output image_id`, e publica as tags a partir dessa imagem, sem rebuild. | Dizer "a gente buildou de novo", ou esquecer o compare de ID |
| 5 | O que o `/health` do Render prova depois do deploy? | Que alguma instância responde. Não prova a versão (limitação conhecida, slide 10). | Dizer que prova que a versão nova subiu |
| 6 | Por que seu teste de aceitação não é um teste de integração renomeado? | Não importa nada de `src/`, usa `fetch` por HTTP contra o contêiner Docker real que vira release. | Falar só "porque está em outra pasta" |
| 7 | Mostre a execução vermelha. Ela rodou na `main`? | Run `45093573497`, num PR (#15), Commit ❌, Aceitação e Lançamento ⏭️. Não rodou na `main`, porque o PR foi fechado sem merge; a `main` nunca recebeu o teste quebrado. | Dizer que quebraram a `main` |
| 8 | A v0.1.0 falhou. Por quê, e o que mudou? | Release já existia (HTTP 422) no re-run; o step virou idempotente (PR #3). | Dizer "foi instabilidade do GitHub" |
| 9 | Mateus, o que o seu teste de aceitação valida? Por que não aparece na `main`? | 22 cenários Dado/Quando/Então; o PR #4 foi fechado e o conteúdo integrado pelo squash #13 (autor Marcos), com `Co-authored-by` para ele. | Não conhecer os cenários |
| 10 | Rafael, qual foi a última auditoria e o que ela achou? | Auditorias 1 e 2 (e 3, esta); achados: aceitação fora da `main`, backup ausente, imagem reconstruída 3×, afirmações sem prova. | Não saber citar um achado |

### 9.2 Cinco perguntas-armadilha

1. **Unidade × integração × aceitação?** Unidade: peça isolada, sem rede (validação, serviço, controller com mocks). Integração: camadas juntas em processo (rotas + domínio + repositório). Aceitação: o sistema empacotado, em execução, validado só pelo comportamento visível por HTTP.
2. **"Integração" sem banco conta?** Conta como integração entre camadas (HTTP, controller, serviço, repositório). Não integra com serviço externo, e a persistência é em memória por decisão de escopo. Assuma isso, não finja que há banco.
3. **Baseline × release?** Baseline: conjunto de ICs aprovado e congelado como referência (cada tag `vX.Y.Z` com código, testes, scripts e docs). Release: o que é entregue ao usuário (imagem, GitHub Release, deploy). Aqui coincidem no tempo, mas não no conceito: baseline é do repositório, release é do artefato.
4. **CI × entrega × implantação contínua?** CI: build + testes a cada integração. Entrega contínua: sempre pronto para implantar, com decisão humana (é onde estamos: a tag). Implantação contínua: cada mudança aprovada vai à produção sozinha (não fazemos).
5. **CCB e rastreabilidade: como ligam uma versão em execução ao pedido que a originou?** Imagem (label `revision` = SHA, `APP_VERSION`) → tag → commit `(#N)` → PR → `Closes #N` → issue. Cuidado: só vale integralmente de #13 em diante, e #14/#16 não têm `Closes`.

### 9.3 Três cenários de mudança

1. **Deploy falha em produção.** O `deploy.sh` sai com código ≠ 0 e o job fica vermelho; a Release no GitHub já existe e a imagem já está no GHCR. Ação: verificar logs do Render; reexecutar o job (o Release é idempotente); se persistir, rollback para a imagem anterior (`0.1.1`) via deploy hook com `imgURL` ou pelo painel (plano 3.3.1). Abrir issue de prioridade alta e, depois, um PATCH.
2. **Dois devs alteram o mesmo módulo.** Cada um em sua branch `autor/assunto`; o segundo PR acusa conflito; ele atualiza a branch a partir da `main`, resolve, o pipeline do PR roda de novo e só então o revisor aprova. Mudança em contrato da API exige 2 aprovações do CCB (plano 3.2.2). *Ressalva:* só é automático depois de ativar a proteção da `main` (F-01).
3. **Reverter uma versão.** Não se apaga a tag (baseline imutável). Opções: implantar a imagem anterior (`ghcr.io/.../tp-gerencia-config:0.1.1`) pelo deploy hook, e criar `v0.1.3` com `git revert` do commit problemático, passando pelo pipeline completo. Registrar na issue e no plano.

### 9.4 Partes que costumam ficar com uma pessoa

| Parte | Quem aparece no histórico | Pergunta para checar se todos dominam |
|---|---|---|
| Pipeline | Marcos (PRs #13, #14, #16); Bernardo (Lançamento) | "Qual job tem `needs`, e o que acontece se `test:integration` falhar?" |
| Docker | Bernardo | "Por que dois estágios e `npm ci --omit=dev`? Quem é o usuário do contêiner?" |
| Plano | Marcos e Gabriela | "Em qual seção do plano está o backup e o que foi testado?" |
| Revisão/CCB | Rafael (sem atividade) | "Qual critério de aprovação, e qual PR provou isso?" |
| Aceitação | Mateus (autor no PR #4, co-autor do #13) | "Escolha um dos 22 cenários e explique." |

---

## 10. Estimativa de nota

**Premissa declarada:** o enunciado não traz rubrica. Pesos assumidos abaixo, soma 10. A faixa considera o risco de arguição sobre os desvios (F-01 a F-03) **se não forem corrigidos**; "melhor" assume correção antes da entrega.

| Dimensão | Peso assumido | Estimativa (pior–melhor) | Principais perdas |
|---|---:|---|---|
| Plano de CM | 2,5 | 2,0 – 2,4 | Afirma proteção e review que não existem (F-01, F-02); depende de arquivos deletados (F-03); números soltos (F-11) |
| Projeto e testes | 1,5 | 1,4 – 1,5 | Nenhuma relevante. 12/36/193, tudo verde; integração sem componente externo (F-09) |
| Pipeline (Commit, Aceitação, Lançamento) | 3,0 | 2,6 – 2,9 | Lançamento só em tag (F-04); sem artefato no Commit (F-05); health sem versão (F-06) |
| Entregáveis e coerência plano×repo×slides | 1,5 | 1,1 – 1,4 | Zip pode ficar defasado (F-03); contradições 1–5 da seção 5 |
| Apresentação e lições aprendidas | 1,5 | 0,9 – 1,3 | Sem folga em 10 min, sem gravação (F-12); autoria concentrada (F-07) |
| **Total** | **10** | **8,0 – 9,3** | |

Os pontos mais "baratos" para recuperar (minutos) estão nos itens 1 a 4 da seção 8.

---

## 11. Checklist final "pronto para entregar"

Só o que **ainda não foi comprovado**:

- [ ] Proteção da `main` ativa e print anexado à issue #11 (F-01)
- [ ] Pelo menos 1 PR com review de Rafael registrada (F-02)
- [ ] `docs/auditoria_*.md` restaurados **ou** plano reapontado; esta auditoria registrada no plano (F-03)
- [ ] Textos corrigidos: "48 arquivos", slide 3 (`v0.1.2`), merge misto, rastreabilidade (F-08, F-10, F-11)
- [ ] Mateus e Rafael com atividade real no Git (F-07)
- [ ] Todas as mudanças **commitadas**, `git status` limpo, **antes** de `./scripts/gerar-entrega.sh` (F-03)
- [ ] PDFs e zip regenerados; zip aberto em pasta limpa **em outra máquina**: `npm ci`, `npm run build`, `npm test`
- [ ] `deploy.sh` solto idêntico ao do zip (re-checar com `diff -q`)
- [ ] Demo gravada de reserva (F-12)
- [ ] Ensaio cronometrado ≤ 10 min, com todos respondendo sobre o projeto inteiro
- [ ] Render acordado antes da apresentação (`curl .../health` minutos antes)
- [ ] Execuções da tag verde e da vermelha abertas em abas
- [ ] Zero segredos no zip (re-rodar a varredura depois dos últimos commits)
- [ ] Este `AUDITORIA_TP1.md`, o `PROMPT_AUDITORIA_TP1.md` e a `FONTE_DA_VERDADE` fora do zip (o `gerar-entrega.sh` exclui só os dois últimos; mover esta auditoria para `docs/` se quiser entregá-la)

---

## 12. Perguntas para o professor

1. Qual a rubrica dos 10 pontos? Qual o peso da apresentação e da arguição?
2. O Lançamento disparado por **tag** (e não por todo commit na `main`) atende "pipeline disparado a cada commit na principal"? As etapas Commit e Aceitação rodam em todo commit; só o Lançamento exige tag.
3. Em linguagem transpilada (TypeScript), `npm ci` + `tsc` conta como "compilação"? A imagem Docker conta como o artefato do build?
4. O zip deve conter `.git`? O script de implantação deve ir solto, além de estar no zip?
5. Teste de integração em processo (HTTP + serviço + repositório em memória) satisfaz "integração", ou espera-se serviço externo (banco)?
6. Data limite de entrega e tamanho máximo do zip e do PDF.
7. A nota é do grupo ou individual, e a arguição pondera por pessoa?

---

## Os 5 ajustes que mais aumentam a nota, em ordem

1. **Ativar a proteção da `main` e fechar a issue #11** (F-01). Minutos, e elimina a contradição mais exposta.
2. **Restaurar (ou reapontar) `docs/auditoria_*.md` e registrar esta auditoria no plano** (F-03). Minutos, e a auditoria executada é evidência exigida.
3. **Fazer Rafael revisar e aprovar um PR de verdade, e alinhar o plano ao que ocorreu até aqui** (F-02, F-08). Dá lastro ao CCB.
4. **Dar a Mateus e Rafael 1 commit/PR real cada e gravar a demo de reserva com ensaio cronometrado** (F-07, F-12). Protege a arguição e os 10 min.
5. **Commitar tudo, regerar PDFs e zip, e testar o zip numa máquina limpa** (F-03, F-11). Garante que o que vai ao Canvas é o que foi auditado.

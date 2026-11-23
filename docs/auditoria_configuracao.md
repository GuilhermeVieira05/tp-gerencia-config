# Auditoria de Configuração — TP1 (rodada 1)

**Data:** 2026-11-22 · **Commit auditado:** `cbce85e` (`main`) · **Método:** execução local (`npm ci`, build, testes), `git log`, `gh` (runs, PRs, issues, proteção de branch) e análise estática de `pipeline.yml` e `docs/plano/`.
**Régua:** `TP1_Gerencia_de_Configuracao_FONTE_DA_VERDADE.md`. A rubrica oficial não existe; a nota abaixo é estimativa.

## 1. Veredito

- **Nota estimada: 3,5–6,0 / 10 hoje.** Chega a 8,5–10 se os bloqueadores abaixo forem fechados.
- **Há bloqueadores:** (1) não existe etapa de Aceitação na `main`; (2) faltam o Plano em PDF, os slides e o script de implantação (3 dos 4 entregáveis); (3) o Lançamento não é disparado por commit na `main`, só por tag.
- **Maiores riscos:** pipeline sem Aceitação encadeada; plano afirma "`main` protegida" e a API não confirma; sem artefato único entre as etapas.
- **Pontos fortes comprovados:** projeto acima do mínimo, 171 testes passando, 8 execuções verdes na `main`, release `v0.1.1` publicado via pipeline, trabalho distribuído em PRs.

## 2. Entradas ausentes / não verificáveis

| Entrada | Situação |
|---|---|
| Plano de CM (PDF) | **Ausente.** Só existem 4 seções em Markdown (`docs/plano/`). |
| Slides (PDF) | **Ausente.** |
| Script de implantação | **Ausente.** Não há `scripts/`; a lógica está embutida no YAML. |
| Zip do repositório | Não gerado; auditei o clone. |
| Sistema implantado | URL `https://tp-gerencia-config.onrender.com` aparece só no log do run `44157170853`. **Não testei o acesso.** |
| Contribuição do Rafael | 0 commits e 0 PRs próprios no histórico; revisões não auditadas. |

## 3. Checklist de conformidade

| ID | Requisito | Status | Evidência | Falta |
|---|---|---|---|---|
| P-01 | ≥10 arquivos | ✅ | 12 `.ts` em `src/` (`find src -name '*.ts'`) | Folga pequena; registrar contagem em `docs/` |
| P-02 | ≥20 métodos | ✅ | ~38 funções/métodos em `src/` (grep de assinaturas; assinaturas multilinha podem ficar fora) | Contagem documentada |
| P-03 | Testes executáveis | ✅ | `jest`: 11 suítes, 171 testes, todos passam | — |
| P-04 | Projeto novo ou existente | ✅ | Autoral | Declarar no plano |
| P-05 | Projeto público único | ✅ | Autoral, sem risco | — |
| G-01 | Dispara em commit na `main` | ✅ | `on.push.branches: [main]`; runs verdes em `main` (ex.: `45086472310`) | — |
| C-01 | Build | ⚠️ | `npm run build` (tsc) passa, mas **não gera artefato para a etapa seguinte** | `upload-artifact` ou usar a imagem como artefato |
| C-02a | Unidade | ✅ | Step "Testes de unidade" (`test:unit`) | — |
| C-02b | Integração | ✅ | Step separado (`test:integration`, supertest sobre o app em memória) | Integração é em processo, sem banco: defensável, mas expor isso na defesa |
| A-01 | Aceitação automatizada | ❌ | `acceptance-stage` **comentado** em `pipeline.yml`; o trabalho está no **PR #4 aberto** (`tests/acceptance/`, `jest.acceptance.config.js`) | Concluir e mesclar o PR #4 |
| L-01 | Entrega aos usuários | ⚠️ | Release `v0.1.1`, run `44607534306` verde (1m21s), imagem no GHCR e deploy Render | Confirmar URL acessível hoje |
| L-02 | Docker ou servidor gratuito | ✅ | `Dockerfile` multi-stage + GHCR + Render | — |
| PL-01 | Plano em PDF | ❌ | Inexistente | Gerar PDF |
| PL-02 | A partir do modelo | ⚠️ | Seções mapeadas ao modelo RUP; conteúdo não comparado integralmente | Ver seção 6 |
| PL-03/AP-04 | Coerência | ⚠️ | Há contradições (seção 5) | Corrigir |
| PL-04 | Exemplos como referência | ❔ | Sem plano completo para comparar | — |
| AP-01..05 | Apresentação | ❌ | Sem slides, sem lições aprendidas registradas | Montar slides |
| Entregável 1 | Plano PDF | ❌ | — | — |
| Entregável 2 | Zip do repo | ⚠️ | Repo pronto; zip não gerado/testado | Gerar e testar em pasta limpa |
| Entregável 3 | Script de implantação | ❌ | Não existe arquivo próprio | Extrair para `scripts/deploy.sh` |
| Entregável 4 | Slides PDF | ❌ | — | — |

## 4. Auditoria do pipeline

| Item | Resultado | Evidência |
|---|---|---|
| Gatilho | ✅ `push` em `main` e tags `v*.*.*`; sem `pull_request` | `pipeline.yml:3-7` |
| Commit | ✅ build, unidade e integração em steps distintos; Node 20 e cache npm | `commit-stage` |
| Aceitação | ❌ ausente na `main` (comentada) | Comentário "responsabilidade do Mateus"; PR #4 aberto |
| Lançamento | ⚠️ `if: startsWith(github.ref,'refs/tags/v')`: em push na `main` o job é **pulado** | `release-stage` |
| Encadeamento | ⚠️ `release-stage` depende de `commit-stage`, **não de Aceitação** (há `TODO` no YAML) | `needs: commit-stage` |
| Artefato único | ❌ O commit-stage não publica artefato. O release **reconstrói** a imagem duas vezes: `app:smoke` (teste) e a imagem publicada. Mesmo contexto e cache, mas sem garantia de mesmo digest | step "Build da imagem (local…)" e "Publicar imagem…" |
| Verificação pós-deploy | ✅ smoke test local do contêiner + `curl /health` no Render (condicional a `vars.RENDER_APP_URL`) | steps finais |
| Atalhos | ✅ Nenhum `|| true`, `continue-on-error` ou skip de teste encontrado | grep no YAML |
| Segredos | ✅ `RENDER_DEPLOY_HOOK_URL` e `GITHUB_TOKEN` via `secrets.*`; scan de padrões em `src`, `tests`, `Dockerfile`, `.github`, `docs`, `README.md` sem achados; nenhum `.env`/chave versionado | — |
| Idempotência | ✅ Release já existente é mantido em re-run | step "Criar GitHub Release" |
| Rollback | ❔ Não documentado como procedimento verificável (imagens versionadas no GHCR permitem) | — |
| Execuções | 8 verdes na `main` (22–37s); tag `v0.1.1` verde. **Tag `v0.1.0` falhou** (run `44157170853`); não investiguei a causa | `gh run list` |
| Execução vermelha de demonstração | ❌ Nenhuma deliberada | — |

## 5. Contradições plano × repositório × pipeline

| Afirmação | Onde | Realidade | Gravidade |
|---|---|---|---|
| "`main` protegida: só recebe mudanças por PR" | `docs/plano/secao-introducao-configuracao.md:142` | `gh api .../branches/main/protection` → **404** e `rulesets` vazio. Pode ser ausência de proteção ou falta de permissão do meu token. Os 12 commits recentes vieram por PR, exceto o scaffold | 🟠 |
| Pipeline em 3 etapas Commit → Aceitação → Lançamento | README (tabela do pipeline) | Só 2 etapas existem na `main` | 🔴 |
| Lançamento ligado ao commit na `main` (G-01 da fonte) | Fonte da verdade | Lançamento só em tag | 🟠 |
| README lista Rafael como revisor e dono de 3.2–3.4 | README, `secao-introducao-configuracao.md:64` | Sem commits, sem seção dele no repo | 🟠 |
| Rastreabilidade commit/PR ↔ issue | Plano | `gh issue list` vazio: 0 issues | 🟡 |
| Autoria consistente | `git log` | Um autor aparece como "Mateus Araujo Sanotos" e Marcos com 2 identidades de e-mail | 🔵 |

## 6. Cobertura do Plano contra o modelo (por nome de arquivo e menções, sem leitura integral)

| Modelo | Situação |
|---|---|
| 1.1–1.5, 3.1.1, 3.1.2 | Presentes (`secao-introducao-configuracao.md`) |
| Estratégia de testes, release/implantação, arquitetura | Presentes, mas **não são seções do modelo**; precisam ser encaixadas em 2.2 e 3.3.1 |
| 2.1 papéis | Citados no README; confirmar no plano |
| 3.2.1 fluxo de mudança, 3.2.2 **CCB**, 3.3.2 **auditorias**, 4 **marcos**, 5 **treinamento**, 6 **subfornecedores** | **Sem arquivo e sem menção encontrada** (a seção de Rafael não existe) |
| Capa e histórico de revisão | Ausentes (não há plano consolidado) |

## 7. Resultados de execução

| Comando | Resultado |
|---|---|
| `npm ci` | OK |
| `npm run build` | OK, sem erros |
| `npx jest` | 11 suítes, 171 testes, 0 falhas, ~2,7s |
| `docker build` | **Não executado** |
| Zip em pasta limpa | **Não executado** |
| Acesso à URL do Render | **Não executado** |

## 8. Achados priorizados

**[A1] Etapa de Aceitação ausente na `main`** · 🔴 · A-01, G-01 · Evidência: job comentado; PR #4 aberto com `tests/acceptance/tasks.acceptance.test.ts` · Correção: concluir o PR #4, mesclar e fazer `release-stage` depender de `acceptance-stage` · Esforço: horas.

**[A2] Plano de CM não existe em PDF e faltam seções do modelo** · 🔴 · PL-01, PL-02 · Correção: concluir 2.1, 3.2.1, 3.2.2 (CCB), 3.3.2 (auditoria), 4, 5, 6; capa e histórico; consolidar e exportar PDF · Esforço: dias.

**[A3] Sem script de implantação como arquivo** · 🔴 · Entregável 3 · Correção: criar `scripts/deploy.sh` (build, smoke, publicação, hook do Render, health) e chamá-lo do YAML · Esforço: horas.

**[A4] Slides ausentes, com lições aprendidas** · 🔴 · AP-01..05 · Esforço: horas.

**[A5] Artefato não reaproveitado entre etapas** · 🟠 · Seção 3.3 da fonte · Correção: construir a imagem uma vez (commit-stage ou acceptance), exportar como artefato ou publicar por digest, e a aceitação e o lançamento usarem esse mesmo digest · Esforço: horas.

**[A6] Lançamento só em tag** · 🟠 · G-01 · Correção: decidir e documentar (entrega contínua com tag como decisão de release) ou disparar o deploy também na `main`; confirmar com o professor · Esforço: minutos a horas.

**[A7] Proteção da `main` não confirmada** · 🟠 · Plano 3.2 · Correção: ativar em Settings → Branches (PR obrigatório, status check "Etapa de Commit" e "Etapa de Aceitação") e guardar print · Esforço: minutos.

**[A8] Rafael sem entregas verificáveis** · 🟠 · Defesa oral · Correção: revisar PRs de fato (aprovações no GitHub) e escrever a seção dele · Esforço: horas.

**[A9] Falha do run da tag `v0.1.0` sem explicação** · 🟡 · Correção: abrir o log, registrar causa e correção como lição aprendida · Esforço: minutos.

**[A10] Sem issues e sem execução vermelha de demonstração** · 🟡 · Correção: abrir issues para os PRs restantes; criar PR com teste quebrado e guardar print do bloqueio · Esforço: minutos.

**[A11] Contagem de arquivos e métodos não documentada** · 🔵 · P-01/P-02 · Correção: criar `docs/contagem_requisitos.md` com 12 arquivos e ~38 métodos e o comando usado · Esforço: minutos.

**[A12] `TP1_..._FONTE_DA_VERDADE.md` e `PROMPT_AUDITORIA_TP1.md` na raiz do repo** · 💡 · Mover para `docs/` ou excluir do zip · Esforço: minutos.

## 9. Plano de correção (pontos ÷ esforço)

| Ordem | Ação | Responsável |
|---|---|---|
| 1 | Mesclar PR #4 e encadear `needs: acceptance-stage` | Mateus + Bernardo |
| 2 | Ativar proteção da `main` | Guilherme |
| 3 | Criar `scripts/deploy.sh` e usá-lo no pipeline | Bernardo |
| 4 | Escrever seções faltantes do plano | Rafael + Gabriela |
| 5 | Imagem única entre etapas | Bernardo |
| 6 | Execução vermelha + issues + contagem | `[PREENCHER]` |
| 7 | Slides e ensaio de 10 min | `[PREENCHER]` |
| 8 | Zip em pasta limpa | `[PREENCHER]` |

## 10. Simulação do professor

**Perguntas sobre pontos fracos reais**
1. Onde está o teste de aceitação e o que ele garante? *(Esperado: sistema em contêiner, caixa-preta. Erro provável: citar teste de integração.)*
2. Por que o Lançamento não roda em todo commit na `main`? *(Esperado: justificativa clara; erro: dizer que roda.)*
3. A imagem implantada é a mesma que foi testada? *(Hoje: não garantido; erro: dizer que sim.)*
4. A `main` está protegida? Mostre. *(Erro: afirmar sem prova.)*
5. Como é o CCB e quem o compõe?
6. Mostre uma execução em que o pipeline bloqueou um lançamento.
7. Por que a tag `v0.1.0` falhou e o que mudaram?
8. Como a imagem em produção é rastreada até o commit? *(Esperado: `APP_VERSION`, labels OCI, tag.)*
9. Qual a diferença entre a integração do projeto e a aceitação, já que ambas usam HTTP?
10. Quem revisou os PRs, e o que foi pedido de mudança?

**Armadilha**
1. Unidade × integração × aceitação, citando um teste do repo para cada.
2. Baseline × release: no projeto, toda tag é as duas coisas?
3. CI × entrega contínua × implantação contínua: onde vocês estão? *(Resposta honesta: CI + entrega contínua com release por tag.)*
4. O que muda em uma baseline após criada?
5. Como ligam um requisito a commit, build e release sem issues?

**Cenários**
1. *Deploy falha em produção:* o job para no step Deploy ou Verificar; a versão anterior segue no ar; corrigir por PR e nova tag patch; ou reimplantar a imagem anterior do GHCR.
2. *Dois devs no mesmo módulo:* branches curtas, PR, rebase/merge, CI verde na `main` antes de mesclar; conflito resolvido por quem abre o segundo PR.
3. *Reverter versão:* reimplantar a tag anterior (`imgURL` do Render com a imagem `X.Y.(Z-1)`), registrar a decisão no CCB e abrir issue de correção.

**Domínio individual:** pergunte ao responsável pelo Docker sobre o plano e a quem escreveu o plano sobre o `release-stage`.

## 11. Estimativa de nota

Ponderação assumida (sem rubrica oficial):

| Dimensão | Peso | Pior–melhor hoje | Principais perdas |
|---|---:|---|---|
| Plano de CM | 2,5 | 0,8–1,5 | Sem PDF; seções 3.2, 3.3.2, 4, 5, 6 e capa ausentes |
| Projeto e testes | 2,0 | 1,5–1,8 | Aceitação fora da `main` |
| Pipeline | 3,0 | 1,2–2,0 | Sem Aceitação; sem artefato único; release só por tag |
| Entregáveis e coerência | 1,5 | 0,0–0,6 | Script, slides e PDF ausentes |
| Apresentação e lições | 1,0 | 0,0–0,3 | Sem slides |
| **Total** | **10** | **3,5–6,2** | |

## 12. Checklist "pronto para entregar"

- [ ] PR #4 mesclado; `acceptance-stage` ativo e em `needs` do lançamento
- [ ] Execução verde completa (3 etapas) na `main`
- [ ] Execução vermelha de propósito, com print
- [ ] `main` protegida (print)
- [ ] `scripts/deploy.sh` usado pelo pipeline
- [ ] Plano completo em PDF, sem seções vazias
- [ ] Slides em PDF com lições aprendidas, ensaiados em 10 min
- [ ] Contagem de arquivos e métodos documentada
- [ ] Zip testado em pasta limpa (build + testes)
- [ ] URL do Render acessível
- [ ] Causa do run `v0.1.0` registrada
- [ ] Rafael com seção escrita e revisões feitas

## 13. Perguntas para o professor

1. Lançamento por tag (sem deploy em todo commit na `main`) atende ao G-01?
2. Para TypeScript, "compilação" = `tsc` é aceito?
3. O zip deve incluir `.git`?
4. O script de implantação vai solto ou só dentro do zip?
5. Como se divide a nota (rubrica)?

## Os 5 ajustes que mais aumentam a nota, em ordem

1. Mesclar a Aceitação (PR #4) e encadear o Lançamento a ela.
2. Gerar o Plano completo em PDF (CCB, auditoria, marcos, treinamento, subfornecedores, capa).
3. Criar `scripts/deploy.sh` e usá-lo no pipeline.
4. Montar os slides com lições aprendidas e ensaiar em 10 minutos.
5. Garantir imagem única entre etapas e proteger a `main`, com print de uma execução vermelha.

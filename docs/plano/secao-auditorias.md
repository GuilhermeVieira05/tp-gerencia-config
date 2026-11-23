# Seção do Plano de GC — Relatórios e Auditorias (3.3.2)

## Relatórios

| Relatório | Fonte | Conteúdo | Frequência |
|---|---|---|---|
| Execuções do pipeline | GitHub Actions | Resultado, duração e commit de cada execução; logs de testes | A cada push na `main` e a cada tag |
| Estado das mudanças | Issues e PRs | Abertas, em revisão, concluídas; por responsável e prioridade | A cada marco |
| Releases | GitHub Releases e GHCR | Versão, notas geradas, imagem publicada | A cada tag |
| Histórico de baselines | Tabela em 3.1.2 | Tag, data, commit, conteúdo | A cada release |

**Defeitos:** classificados por criticidade (crítico: pipeline ou produção parados; alto: funcionalidade quebrada; médio: comportamento incorreto com contorno; baixo: cosmético). Analisam-se **tempo** em aberto, **contagem** por responsável, prioridade e estado, e **tendência** (acumulado e tempo médio de resolução) a partir das issues.

## Auditorias de configuração

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

**Registro:** o resultado de cada rodada vai em `docs/auditoria_configuracao.md` (rodada 1), `docs/auditoria_rodada2.md` (rodada 2) e `docs/auditoria_rodada3.md` (rodada 3), com data, commit auditado, achados e correções. Os relatórios são históricos: descrevem o estado do commit auditado, não o atual.

**Auditorias realizadas**

| Nº | Data | Commit | Resultado |
|---|---|---|---|
| 1 | 2026-11-22 | `cbce85e` | Relatório em `docs/auditoria_configuracao.md`: aceitação fora da `main` e seções do plano faltantes; correções aplicadas na branch `fix/aceitacao-e-plano` |
| 2 | 2026-11-22 | `d042f02` | Relatório em `docs/auditoria_rodada2.md`: faltavam backup/retenção/recuperação (3.3.1), prova de bloqueio do pipeline e artefato único. Corrigidos: seção de backup com teste de recuperação, imagem construída uma só vez e reaproveitada no Lançamento, plano alinhado ao pipeline. Execução vermelha registrada em `docs/evidencias/execucao-vermelha.md` (run 45093573497) |

| 3 | 2026-11-22 | `69b137f` (`v0.1.2`) | Relatório em `docs/auditoria_rodada3.md`. Sem bloqueador. Achados: proteção da `main` descrita mas inativa; nenhuma review de PR registrada; arquivos de auditoria deletados no disco (restaurados); `/health` sem versão; lançamento só em tag e `tsc` do Commit não geram o artefato entregue (esclarecidos no plano); números e datas desatualizados. Correções no PR #18 (issue #17), mesclado em `fdcc342`, com a primeira review registrada do repositório (Rafael) |

**Desvios conhecidos (registrados nas auditorias 2 e 3):**

- Os PRs #1 a #7 foram abertos antes de o grupo registrar issues. A rastreabilidade issue → PR vale a partir do PR #13; os anteriores são rastreados pelo número do PR e pelo histórico de commits.
- **Proteção da `main`:** não existia até o PR #18, segundo a issue #11 (aberta até a ativação) e a declaração do dono; a auditoria 3 registrou 404 no endpoint de proteção, mas esse resultado não prova a ausência para contas sem permissão de administrador. Foi ativada pelo dono em 2026-11-23 (issue #11, fechada); evidência em `docs/evidencias/protecao-main.md`. O administrador pode contornar a regra. Os merges dos PRs #1 a #7, #13 a #16 e #18 ocorreram antes dela.
- **Nenhum dos PRs #1 a #7 e #13 a #16 tem review registrada** (a primeira é a do #18); ver "Procedimento definido × prática realizada" em 3.2.1.
- A regra `Closes #N` não foi aplicada nos PRs #14, #15 e #16; a estratégia de merge foi mista (#1, #5 e #7 com *merge commit*). Detalhes em 3.2.1.
- A verificação pós-deploy por versão só vale a partir da primeira release posterior à correção F-06 (3.3.1).

# Seção do Plano de GC — Relatórios e Auditorias (3.3.2)

## Relatórios

| Relatório | Fonte | Conteúdo | Frequência |
|---|---|---|---|
| Execuções do pipeline | GitHub Actions | Resultado, duração e commit de cada execução; logs de testes | A cada push na `main` e a cada tag |
| Estado das mudanças | Issues e PRs | Abertas, em revisão, concluídas; por responsável e prioridade | A cada marco |
| Releases | GitHub Releases e GHCR | Versão, notas geradas, imagem publicada | A cada tag |
| Histórico de baselines | Tabela em `secao-introducao-configuracao.md` (4.4) | Tag, data, commit, conteúdo | A cada release |

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
- [ ] Proteção da `main` ativa (print em `docs/evidencias/`)
- [ ] Toda PR mesclada referencia uma issue

**Registro:** o resultado vai em `docs/auditoria_configuracao.md`, com data, commit auditado, achados e correções.

**Auditorias realizadas**

| Nº | Data | Commit | Resultado |
|---|---|---|---|
| 1 | 2026-11-22 | `cbce85e` | Relatório em `docs/auditoria_configuracao.md`: aceitação fora da `main` e seções do plano faltantes; correções aplicadas na branch `fix/aceitacao-e-plano` |
| 2 | 2026-11-22 | `d042f02` | Relatório em `docs/auditoria_rodada2.md`: faltavam backup/retenção/recuperação (3.3.1), prova de bloqueio do pipeline e artefato único. Corrigidos: seção de backup com teste de recuperação, imagem construída uma só vez e reaproveitada no Lançamento, plano alinhado ao pipeline. Pendentes de ação externa: proteção da `main` e execução vermelha |

**Desvios conhecidos (registrados na auditoria 2):**

- Os PRs #1 a #7 foram abertos antes de o grupo registrar issues. A rastreabilidade issue → PR vale a partir do PR #13; os anteriores são rastreados pelo número do PR e pelo histórico de commits.
- A proteção técnica da `main` depende de configuração no GitHub (issue #11). Enquanto não estiver ativa, o cumprimento de "só por PR" é disciplina do grupo, verificável no histórico (`git log --first-parent main`).

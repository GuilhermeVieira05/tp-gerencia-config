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

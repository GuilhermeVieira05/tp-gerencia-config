# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/). Versionamento semântico (`MAJOR.MINOR.PATCH`); cada tag `vX.Y.Z` é uma baseline (plano, 3.1.2). Datas em AAAA-MM-DD.

## [1.0.0] - release final (marco M6)

Primeira versão estável (ver a exceção declarada em plano 3.1.1). Reúne o que entrou na `main` depois da `v0.1.2`.

### Adicionado
- `/health` informa a versão (`{"status":"ok","version":"X.Y.Z"}`); o teste de aceitação CA01 a confere e, no pipeline, compara com o `package.json` (PR #18).
- `scripts/deploy.sh` só aceita o deploy quando `/health` informa a versão esperada; exige `RENDER_APP_URL`, recusa tag vazia, digest e imagem sem tag, tem timeout e limite de tentativas (PRs #18 e #20).
- Evidências: `docs/evidencias/protecao-main.md` e `.png` (proteção da `main`), `docs/evidencias/npm-audit.md` (0 vulnerabilidades).
- `scripts/demo-local.sh`: repete localmente a Aceitação (imagem, contêiner, `/health`, 22 cenários) como plano B da demonstração.
- Este changelog e `docs/roteiro-apresentacao.md`.

### Alterado
- Versão do `package.json` e do `package-lock.json`: `1.0.0`.
- Plano, README e slides separam o **procedimento definido** da **prática realizada** (proteção da `main`, reviews, CCB, merge, rastreabilidade, papéis × Git) (PRs #18 e #20).
- Imagem base fixada em `node:20.20.2-alpine3.23` e runner em `ubuntu-24.04`.
- Relatórios das auditorias 1 a 3 saíram da árvore de trabalho; continuam no histórico do Git (resumo no plano, 3.3.2).
- Proteção da `main` ativada pelo dono do repositório (configuração do GitHub; não é código).

### Corrigido
- Tabela de auditorias do plano, que perdia a linha da auditoria 3.
- Título do PDF do plano; contagem de arquivos versionados calculada por `git ls-files`.

## [0.1.2] - 2026-11-22
- Etapa de Aceitação no pipeline: 22 cenários caixa-preta via HTTP contra o contêiner.
- Artefato único: a imagem é construída uma vez, salva como artefato, e o Lançamento confere o ID antes de publicar.
- `scripts/deploy.sh` (script de implantação) usado pela etapa de Lançamento.
- Plano de CM consolidado, slides, seção de backup, retenção e recuperação (com teste de recuperação), evidência da execução vermelha, README e guia de execução.

## [0.1.1] - 2026-11-19
- Camada HTTP (rotas de tarefas) com testes de unidade e de integração (PR #5).
- Etapa de Lançamento idempotente em re-run, quando o GitHub Release já existe (PR #3).

## [0.1.0] - 2026-11-17
- Estrutura inicial da API em TypeScript com pipeline de Commit, camada de domínio de tarefas com testes de unidade.
- `Dockerfile` e etapa de Lançamento (CD) com publicação no GHCR e deploy no Render (PR #2).

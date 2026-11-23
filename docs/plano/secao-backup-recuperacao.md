# Seção do Plano de GC — Armazenamento de Mídia, Backup, Retenção e Recuperação (3.3.1)

## Onde cada item fica

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

## Backup

- **Contínuo:** todo `git push` coloca o histórico no GitHub, e cada integrante mantém seu clone. Não há commit direto na `main`, e o histórico nunca é reescrito (sem `push --force`), então nenhuma cópia diverge do remoto.
- **Espelho do repositório:** antes de cada tag e antes da entrega, o gerente de configuração gera um espelho completo:

  ```bash
  git clone --mirror https://github.com/GuilhermeVieira05/tp-gerencia-config.git espelho.git
  git -C espelho.git bundle create ../tp-gerencia-config-<data>.bundle --all   # arquivo único
  ```

  O espelho (ou o ZIP final, que inclui `.git`) fica fora do GitHub, em um disco do gerente de configuração.
- **Imagens:** cada release fica no GHCR com tag imutável. Como a imagem é gerada a partir da tag, perder o registro não perde a release.
- **Credenciais:** não entram em backup do repositório. Em caso de perda, são recriadas (novo deploy hook no Render, novo secret no GitHub).

## Retenção

| Item | Retenção |
|---|---|
| Repositório, histórico e tags | Permanente. Tags e commits publicados nunca são apagados nem reescritos. |
| Imagens `X.Y.Z` e `sha-*` no GHCR | Permanente, até o fim da disciplina. Não são apagadas, porque são o alvo do rollback. `latest` e `X.Y` são mutáveis. |
| GitHub Releases | Permanente |
| Execuções do pipeline e artefato `app-image` | Execuções: conforme o GitHub (90 dias por padrão). Artefato: 7 dias, definidos no workflow. |
| Espelho e ZIP de entrega | Até o encerramento da avaliação do TP |

## Recuperação de desastres

| Cenário | Procedimento |
|---|---|
| Repositório no GitHub apagado ou inacessível | Qualquer clone de integrante ou o espelho é enviado para um novo repositório com `git push --mirror`. Depois recriam-se o environment `production`, o secret e a variável `RENDER_APP_URL` (seção de Release, itens 3 e 4) e a proteção da `main`. |
| Uma versão precisa ser reconstruída | `git clone ... && git checkout vX.Y.Z && npm ci && npm run build` (ou `docker build`). A tag fixa o estado de todos os ICs. |
| Imagem perdida no GHCR | Reconstruir a partir da tag e republicar com a mesma tag `X.Y.Z` pelo pipeline. |
| Produção (Render) fora do ar ou com versão defeituosa | Rollback: *Manual Deploy* com a imagem da versão anterior, ou o deploy hook com `imgURL` (seção de Release, item 8). |
| Secret vazado | Regenerar o deploy hook no Render, atualizar o secret e registrar o fato como defeito de criticidade alta. |
| Perda de um clone local | Novo `git clone`. Não há trabalho a recuperar além das branches não enviadas. |

## Teste de recuperação executado

| Data | O que foi feito | Resultado |
|---|---|---|
| 2026-11-22 | `git clone --mirror` do repositório, clone a partir do espelho, `git checkout v0.1.1`, `npm ci`, `npm run build`, `npm test` | `git describe` = `v0.1.1`; build ok; 11 suítes e 171 testes passando. A baseline foi restaurada a partir do espelho. |
| 2026-11-22 | Imagem: `docker save` + `docker load` da imagem candidata | Mesmo ID (`sha256:2caacfff…`) antes e depois, e os 22 testes de aceitação passaram contra o contêiner restaurado |

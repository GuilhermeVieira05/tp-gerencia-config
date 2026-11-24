# Roteiro da apresentação (máximo 10 minutos)

Os tempos abaixo são **metas**, não medições: ainda não houve ensaio cronometrado. As metas somam **9:20**, deixando cerca de 40 s de folga para troca de falante e para o cold start do Render. Quem apresenta cada parte é **sugestão** a partir dos papéis do plano (2.1); o grupo ajusta.

| Meta | Slide | Conteúdo | Sugestão de quem fala |
|---|---|---|---|
| 0:00–0:40 | 2 | Projeto, stack, 12 arquivos, 36 funções, 194 testes | Marcos |
| 0:40–2:00 | 3 | Plano: ICs, SemVer, tags, baselines, rastreabilidade | Gabriela |
| 2:00–2:40 | 4 | Fluxo de mudança e CCB: **definido × praticado** (sem reviews até o #18; proteção ativa desde 23/11) | Rafael |
| 2:40–3:20 | 5 | Tecnologias | Carlos |
| 3:20–4:50 | 6 | Pipeline: Commit → Aceitação → Lançamento; entrega × implantação contínua; artefato único | Bernardo |
| 4:50–7:20 | 7 | Demonstração (abaixo) | Bernardo e Mateus |
| 7:20–8:00 | 8 | Release, rollback, backup, auditorias | Rafael |
| 8:00–8:50 | 9 | Lições aprendidas (uma lição por pessoa) | todos |
| 8:50–9:20 | 10 | Fechamento e perguntas | Guilherme |

## Antes de começar (5 minutos antes)

- [ ] `curl https://tp-gerencia-config.onrender.com/health` para acordar o Render (cold start de até ~1 min).
- [ ] Abas abertas: [execução verde da tag `v0.1.2`](https://github.com/GuilhermeVieira05/tp-gerencia-config/actions/runs/45093771847) · [execução vermelha, PR #15](https://github.com/GuilhermeVieira05/tp-gerencia-config/actions/runs/45093573497) · [Releases](https://github.com/GuilhermeVieira05/tp-gerencia-config/releases) · [Settings → Branches](https://github.com/GuilhermeVieira05/tp-gerencia-config/settings/branches) (só o dono) ou `docs/evidencias/protecao-main.png`.
- [ ] Docker Desktop aberto e `npm ci` feito, para o plano B.

## Demonstração (slide 7)

1. **Verde:** abrir a execução da tag `v0.1.2`; mostrar as três etapas verdes e, no log do Lançamento, os IDs "testada na Aceitação" e "carregada no Lançamento" iguais.
2. **Vermelha:** abrir o PR #15 (**um PR, não a `main`**): Commit ❌, Aceitação e Lançamento *skipped*.
3. **No ar:** `curl .../health` no Render. **Confira antes:** se a resposta trouxer `"version":"1.0.0"`, a release final está no ar e vale mostrar o campo; se vier só `{"status":"ok"}`, a produção ainda é a `v0.1.2` e não se deve prometer a versão em produção. Se a execução da tag `v1.0.0` já tiver rodado, prefira abri-la no passo 1.
4. **Imagem:** `docker run` da imagem do GHCR, se houver rede.

**Plano B** (CI ou rede fora): execuções já concluídas nas abas acima e `./scripts/demo-local.sh`, que repete a Aceitação localmente (imagem, contêiner, `/health`, 22 cenários). Gravação em vídeo: **não existe ainda**; se o grupo gravar, guardar fora do zip.

## Perguntas que qualquer um deve saber responder

Banco completo no Anexo B da fonte da verdade (`TP1_..._FONTE_DA_VERDADE.md`). As mais prováveis, com a resposta real do projeto:

1. **A `main` é protegida?** Sim, desde 2026-11-23: PR com 1 aprovação e checks `Etapa de Commit` e `Etapa de Aceitacao`; o administrador pode contornar PR, aprovação e checks. Antes disso, não era.
2. **Quem revisou os PRs?** O Rafael revisou o #18 e o #20; os PRs #1 a #7 e #13 a #16 não têm review registrada.
3. **Um commit na `main` vai à produção?** Não. Roda Commit e Aceitação; só a tag `vX.Y.Z` dispara o Lançamento (entrega contínua).
4. **A imagem lançada é a testada?** Sim: construída uma vez na Aceitação, e o Lançamento compara o ID antes de publicar. O `tsc` do Commit só valida a compilação.
5. **Integração integra com quê?** Camadas reais (HTTP, serviço, repositório em memória); não há banco.
6. **O health-check prova a versão em produção?** A partir da `v1.0.0`: `/health` informa `version` e o `deploy.sh` só aceita o deploy quando ela confere. Nas releases `v0.1.0` a `v0.1.2` provava só que a aplicação estava no ar.

## Ensaio

- [ ] Ensaio 1 cronometrado: ____ min ____ s
- [ ] Ensaio 2 cronometrado (com troca de falantes): ____ min ____ s
- [ ] Todos responderam às perguntas acima sobre o projeto inteiro

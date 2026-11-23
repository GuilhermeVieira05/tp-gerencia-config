# Evidência: execução vermelha que bloqueia o pipeline

**Data:** 2026-11-22 · **PR de demonstração:** #15 (fechado sem merge) · **Run:** [45093573497](https://github.com/GuilhermeVieira05/tp-gerencia-config/actions/runs/45093573497)

**O que foi feito:** a asserção da linha 11 de `tests/unit/validation.test.ts` foi alterada de propósito (`toBe('QUEBRADO DE PROPOSITO')`).

| Etapa | Resultado | Duração |
|---|---|---|
| Etapa de Commit | ❌ falhou (teste de unidade) | 16 s |
| Etapa de Aceitação | ⏭️ pulada (`needs: commit-stage`) | 0 s |
| Etapa de Lançamento | ⏭️ pulada (`needs: acceptance-stage`) | 0 s |

**Conclusão:** uma falha na etapa anterior bloqueia as seguintes; nada é construído, publicado ou implantado. O PR foi fechado e a branch apagada, então a `main` nunca recebeu o teste quebrado.

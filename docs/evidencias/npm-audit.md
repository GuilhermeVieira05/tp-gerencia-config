# Evidência: `npm audit` antes da entrega

**Data:** 2026-11-23 · **Commit-base:** `b8ee699` (`package-lock.json` inalterado desde o `v0.1.2`) · **Exigência:** plano, seção 6, regra 3 ("antes de cada tag, roda-se `npm audit`").

| Comando | Resultado |
|---|---|
| `npm audit` | `found 0 vulnerabilities` |
| `npm audit --omit=dev` (só o que vai para a imagem) | `found 0 vulnerabilities` |
| `npm audit --json` (`metadata.vulnerabilities`) | `info 0 · low 0 · moderate 0 · high 0 · critical 0 · total 0` |

Limites: o resultado vale para a base de avisos do npm na data acima e para o `package-lock.json` atual. O `audit` não cobre a imagem base (`node:20.20.2-alpine3.23`) nem as *actions* do pipeline.

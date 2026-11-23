# Contagem de requisitos do projeto (P-01 e P-02)

**Data:** 2026-11-22 · **Escopo:** código de produção em `src/` (exclui testes, `node_modules/`, `dist/`).

## Como foi contado

- **Arquivos (P-01):** `find src -name '*.ts' | wc -l`.
- **Funções e métodos (P-02):** `node scripts/contar-requisitos.js`, que lê cada arquivo com o compilador do TypeScript (AST). Contam declarações de função, métodos de classe e funções (arrow ou expression) atribuídas a variável ou propriedade. **Não contam** construtores nem callbacks anônimos. Esse critério é o mais restritivo, para a contagem resistir a uma interpretação diferente do professor.

## Resultado

| Requisito | Mínimo | Contado | Folga |
|---|---:|---:|---:|
| P-01: classes ou arquivos | 10 | **12** | +2 |
| P-02: métodos ou funções | 20 | **36** | +16 |

| Arquivo | Funções/métodos |
|---|---:|
| `src/app.ts` | 1 (`createApp`) |
| `src/server.ts` | 0 |
| `src/domain/errors.ts` | 0 (duas classes de erro) |
| `src/domain/task.ts` | 0 (tipos) |
| `src/domain/validation.ts` | 4 |
| `src/domain/task-repository.ts` | 5 |
| `src/domain/task-service.ts` | 7 |
| `src/http/error-handler.ts` | 4 |
| `src/http/health-routes.ts` | 1 |
| `src/http/request-parsing.ts` | 6 |
| `src/http/task-controller.ts` | 7 |
| `src/http/task-routes.ts` | 1 |
| **Total** | **36** |

## Testes (P-03)

| Nível | Pasta | Casos |
|---|---|---:|
| Unidade | `tests/unit/` | 117 |
| Integração | `tests/integration/` | 55 |
| Aceitação | `tests/acceptance/` | 22 |
| **Total** | | **194** |

Projeto autoral (P-04): não é projeto público de terceiros, então a restrição P-05 não se aplica.

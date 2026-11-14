# Seção do Plano de GC — Projeto e Arquitetura (Marcos)

> Insumo para o Plano de GC (modelo RUP): alimenta **1.2 Escopo** e **3.1.1 Métodos de Identificação** (estrutura do repositório).

## 1. O projeto

- **Nome:** `tp-gerencia-config` (API de gerenciamento de tarefas).
- **Origem:** projeto novo, desenvolvido pelo grupo (não reutiliza projeto público do GitHub, portanto o REQ-005 não se aplica).
- **Descrição:** API REST em TypeScript/Node.js (Express) que permite criar, consultar, atualizar, mudar o status e remover tarefas, além de gerar um resumo (total, contagem por status e tarefas atrasadas).
- **Papel no TP:** o sistema serve de objeto para as atividades de GC. Ele tem lógica testável (REQ-004) e é empacotável em contêiner para o pipeline de CI/CD.

## 2. Arquitetura

Duas camadas, com dependência em um único sentido (HTTP → domínio):

| Camada | Diretório | Responsabilidade | Autor |
|---|---|---|---|
| Domínio | `src/domain/` | Regras de negócio, validação e armazenamento em memória. Não conhece HTTP. | Marcos |
| HTTP | `src/` (rotas e controladores) | Traduz requisições em chamadas ao `TaskService` e erros do domínio em códigos HTTP. | Carlos |

Decisões:
- **Repositório atrás de interface** (`TaskRepository`): hoje há só a implementação em memória, mas o serviço pode ser testado e trocado sem mudança de regras.
- **Relógio e gerador de ids injetáveis** no `TaskService`: testes determinísticos, sem depender de data real nem de UUID aleatório.
- **Erros tipados** (`ValidationError`, `NotFoundError`): a camada HTTP mapeia para 400 e 404 sem inspecionar mensagens.
- **Sem banco de dados:** o escopo do TP é GC e pipeline, então a persistência foi mantida simples. Os dados se perdem ao reiniciar o servidor.

## 3. Estrutura do código de domínio

| Arquivo | Conteúdo |
|---|---|
| `src/domain/task.ts` | Tipos `Task`, `TaskStatus`, `TaskPriority`, entradas e filtros |
| `src/domain/errors.ts` | `ValidationError`, `NotFoundError` |
| `src/domain/validation.ts` | `validateTitle`, `validatePriority`, `validateStatus`, `validateDueDate` |
| `src/domain/task-repository.ts` | Interface `TaskRepository` e `InMemoryTaskRepository` (`save`, `findById`, `findAll`, `delete`, `clear`) |
| `src/domain/task-service.ts` | `TaskService` (`create`, `get`, `list`, `update`, `changeStatus`, `remove`, `summary`) |

## 4. Contrato com a camada HTTP

A camada HTTP usa apenas `TaskService`. Regras de cada operação:

| Operação | Sucesso | Erro |
|---|---|---|
| `create(input)` | `Task` criada com status `todo` e prioridade `medium` por padrão | `ValidationError` |
| `get(id)` | `Task` | `NotFoundError` |
| `list(filter?)` | `Task[]` (filtros opcionais: status, prioridade) | — |
| `update(id, changes)` | `Task` com os campos alterados | `ValidationError`, `NotFoundError` |
| `changeStatus(id, status)` | `Task` | `ValidationError`, `NotFoundError` |
| `remove(id)` | `void` | `NotFoundError` |
| `summary()` | `{ total, byStatus, overdue }` | — |

## 5. Evidência de tamanho (REQ-002 e REQ-003)

Contagem só de código de produção em `src/domain/` (a camada HTTP do Carlos se soma a ela):

- **Arquivos:** 5 em `src/domain/` (mais `src/app.ts` e `src/server.ts` já existentes).
- **Funções e métodos:** 16 (4 em `validation.ts`, 5 em `task-repository.ts`, 7 em `task-service.ts`), sem contar construtores nem o handler de `/health`.
- **Reprodução:** `git ls-files 'src/*.ts' 'src/**/*.ts' | wc -l` conta os arquivos (depois do commit). Para funções e métodos, o grupo ainda precisa acordar um método de contagem (script ou análise estática) e registrá-lo no plano.

## 6. Testes de unidade desta metade

`tests/unit/validation.test.ts`, `task-repository.test.ts` e `task-service.test.ts` (34 casos). Execução: `npm run test:unit`.

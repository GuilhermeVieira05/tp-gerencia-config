# Seção do Plano de GC — Qualidade e Aceitação (Mateus)

> Insumo para o Plano de GC (modelo RUP): alimenta **3.2 Controle de Configuração e Mudanças** (critério para aceitar uma mudança na baseline), **3.4 Gestão de Releases** (critério para liberar uma release) e a parte de garantia de qualidade do pipeline (etapa de Aceitação).

## 1. Visão geral

A etapa de Aceitação é a segunda etapa do pipeline em `.github/workflows/pipeline.yml` (job `acceptance-stage`). Ela fica entre a etapa de Commit e a de Lançamento e responde a uma pergunta: **o artefato que vai ser liberado faz o que o usuário espera?**

```
push na main / tag vX.Y.Z
        │
        ▼
Etapa de Commit ──▶ Etapa de Aceitação ──────────────────────▶ Etapa de Lançamento
(build, unidade,    ├─ build da imagem Docker                   (só em tag; só se a
 integração)        ├─ sobe o contêiner                          aceitação passar)
                    ├─ espera /health
                    ├─ roda os testes de aceitação via HTTP
                    └─ em falha: publica os logs do contêiner
```

| Item | Escolha |
|---|---|
| Objeto testado | A imagem Docker gerada pelo `Dockerfile`, o mesmo artefato que a etapa de Lançamento publica |
| Forma de teste | Caixa-preta: só requisições HTTP, sem importar código de `src/` |
| Ferramentas | Jest + `fetch` nativo do Node 20 |
| Código | `tests/acceptance/tasks.acceptance.test.ts` |
| Configuração | `jest.acceptance.config.js` (alvo definido pela variável `BASE_URL`) |
| Gatilho | Todo push na `main` e toda tag `vX.Y.Z` |
| Efeito de falha | O pipeline fica vermelho e a etapa de Lançamento não roda |

## 2. Os três níveis de teste do projeto

| Nível | Pasta | O que exercita | Como roda | Responsável |
|---|---|---|---|---|
| Unidade | `tests/unit/` | Funções e classes do domínio, isoladas | Em processo, sem rede | Marcos e Carlos |
| Integração | `tests/integration/` | Rotas HTTP ligadas ao domínio | Em processo, com `supertest` | Carlos |
| **Aceitação** | `tests/acceptance/` | **Aplicação inteira, empacotada** | **Contêiner real, via rede** | **Mateus** |

O que só a aceitação pega: erro no `Dockerfile` (arquivo que não entra na imagem, dependência de produção faltando), porta ou variável de ambiente errada, rota registrada na ordem errada e qualquer diferença entre "funciona no `npm test`" e "funciona no artefato que vai para produção".

## 3. Critérios de aceitação

Cada critério vira um bloco `describe` no código, com cenários no formato **Dado / Quando / Então**.

| ID | Critério | Cenários |
|---|---|---|
| CA01 | A aplicação implantada responde ao health check | `/health` → 200 `{status: "ok", version}`; no pipeline, `version` deve ser igual à do `package.json` |
| CA02 | O usuário cria tarefas e entradas inválidas são recusadas | Criação com padrões (`todo`, `medium`) → 201; todos os campos → 201; sem título, título em branco, título > 100 caracteres, prioridade inválida, data inválida → 400 |
| CA03 | O usuário consulta e filtra tarefas | Por id → 200; id inexistente → 404; filtro por prioridade; filtro por status |
| CA04 | O usuário edita uma tarefa sem perder os outros campos | Edição parcial → 200 e campos não enviados preservados; título inválido → 400 sem alterar a tarefa; id inexistente → 404 |
| CA05 | O usuário move a tarefa entre os status | `todo → doing → done`; status inválido → 400; id inexistente → 404 |
| CA06 | O resumo reflete as tarefas | Total, contagem por status e atrasadas (tarefa concluída não conta como atrasada) |
| CA07 | O usuário remove tarefas | Remoção → 204 e depois 404; id inexistente → 404 |
| CA08 | Jornada completa | Criar → listar → editar → concluir → remover |

Ao todo são **22 cenários**.

### Contrato HTTP assumido

Os critérios foram escritos a partir do contrato do `TaskService` (seção do Marcos, item 4) e da tabela de rotas acordada com a camada HTTP:

| Método e rota | Sucesso | Erros |
|---|---|---|
| `GET /health` | 200 | — |
| `POST /tasks` | 201 + tarefa | 400 |
| `GET /tasks?status=&priority=` | 200 + lista | 400 (filtro inválido; coberto só pela integração) |
| `GET /tasks/summary` | 200 + resumo | — |
| `GET /tasks/:id` | 200 + tarefa | 404 |
| `PATCH /tasks/:id` | 200 + tarefa | 400, 404 |
| `PATCH /tasks/:id/status` (corpo `{status}`) | 200 + tarefa | 400, 404 |
| `DELETE /tasks/:id` | 204 | 404 |

Qualquer mudança nessa tabela é uma mudança de contrato. Por isso, ela precisa atualizar a camada HTTP e os testes de aceitação **no mesmo pull request**.

## 4. Decisões de projeto dos testes

- **Independentes do estado do servidor.** A API guarda os dados em memória e o servidor é compartilhado por todos os cenários. Por isso cada cenário cria os próprios dados com títulos únicos e verifica só o que criou. O resumo (CA06) é conferido por **diferença** (antes × depois), não por valor absoluto.
- **Sem dependência de código interno.** Os testes não importam nada de `src/`. Os tipos `Task` e `Summary` são redeclarados no próprio teste, como faria um cliente externo. Assim, uma refatoração interna não quebra a aceitação, mas uma mudança de comportamento externo quebra.
- **Espera ativa.** Antes do primeiro cenário, o teste consulta `/health` por até 30 s. O workflow também espera o contêiner antes de chamar o Jest.
- **Alvo configurável.** Com `BASE_URL`, o mesmo conjunto roda contra o contêiner do CI, contra um `npm start` local ou contra o ambiente do Render.
- **Separado do `npm test`.** `jest.config.js` ignora `tests/acceptance/`. Assim, `npm test` continua rodando sem servidor no ar, e a aceitação roda só com `npm run test:acceptance`.

## 5. Como rodar localmente

Com Docker, como no pipeline:

```bash
docker build -t tp-gerencia-config .
docker run -d --name app -p 3000:3000 tp-gerencia-config
npm run test:acceptance
docker rm -f app
```

Sem Docker:

```bash
npm run build && npm start &          # sobe a API na porta 3000
npm run test:acceptance
```

Contra outro endereço:

```bash
BASE_URL=https://tp-gerencia-config.onrender.com npm run test:acceptance
```

## 6. Critérios de qualidade (gates do pipeline)

Uma mudança só entra na baseline (`main`) e uma versão só é liberada se passar, em ordem, por:

1. **Revisão de código** no pull request (proteção da `main`).
2. **Etapa de Commit:** compila sem erro e os testes de unidade e de integração passam.
3. **Etapa de Aceitação:** o contêiner sobe, responde ao `/health` e todos os 22 cenários passam.
4. **Etapa de Lançamento** (só em tag): versão da tag igual à do `package.json` e smoke test do contêiner antes de publicar.

Se qualquer etapa falhar, as seguintes não rodam (`needs`). Uma tag criada sobre um commit que não passa na aceitação não gera release.

## 7. Evidências para auditoria

- Execução de cada etapa e logs: aba *Actions* do repositório, por commit.
- Em falha da aceitação, o job publica os logs do contêiner (`docker logs`) no próprio log do Actions.
- A imagem testada recebe `APP_VERSION` (versão do `package.json`) e o label OCI `org.opencontainers.image.revision` com o SHA do commit, o que liga o resultado do teste ao commit exato.

## 8. Limitações conhecidas

- Os dados ficam em memória, então os testes não cobrem persistência nem reinício do servidor (o que está fora do escopo do projeto).
- O conjunto valida o comportamento funcional. Desempenho, carga e segurança não são testados.
- A imagem é construída **uma única vez**, na Aceitação, e salva como artefato do workflow (`app-image`). O Lançamento a carrega, confere o ID e publica a mesma imagem. Assim, o que foi testado é exatamente o que é publicado.

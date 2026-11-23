# Como rodar o projeto

Guia para instalar, executar, testar e empacotar a API `tp-gerencia-config` na sua máquina. Para uma visão geral do projeto, veja o [README](../README.md).

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê | Verificar |
|---|---|---|---|
| Git | qualquer recente | Clonar o repositório | `git --version` |
| Node.js | **20** (a mesma do pipeline e da imagem Docker) | Compilar, rodar e testar | `node -v` |
| npm | o que vem com o Node 20 | Instalar dependências | `npm -v` |
| Docker | opcional | Rodar a aplicação como em produção e os testes de aceitação | `docker -v` |
| curl | opcional | Fazer requisições de exemplo | `curl --version` |

Versões mais novas do Node (testado no 24) também compilam e passam nos testes, mas o pipeline e a imagem usam a 20. Em caso de diferença de comportamento, vale a do Node 20.

## 2. Obter o código

```bash
git clone https://github.com/GuilhermeVieira05/tp-gerencia-config.git
cd tp-gerencia-config
```

## 3. Instalar as dependências

```bash
npm ci
```

Use `npm ci`, e não `npm install`. O `npm ci` instala exatamente as versões registradas no `package-lock.json` e falha se ele estiver inconsistente com o `package.json`. É o mesmo comando usado no pipeline e no `Dockerfile`, o que garante que todos compilam e testam com as mesmas dependências.

## 4. Compilar e executar

```bash
npm run build   # compila src/ para dist/
npm start       # roda node dist/server.js
```

Saída esperada:

```
Servidor na porta 3000
```

Para usar outra porta, defina a variável `PORT`:

```bash
PORT=8080 npm start                    # Linux, macOS, Git Bash
```

```powershell
$env:PORT = "8080"; npm start          # PowerShell
```

Para parar, use `Ctrl+C`. Como os dados ficam em memória, as tarefas criadas são perdidas ao parar o servidor.

> Depois de alterar algo em `src/`, rode `npm run build` de novo antes do `npm start`. O `start` executa o JavaScript de `dist/`, não o TypeScript.

## 5. Variáveis de ambiente

| Variável | Padrão | Usada por | Descrição |
|---|---|---|---|
| `PORT` | `3000` | `src/server.ts` | Porta HTTP da API |
| `APP_VERSION` | `dev` | Imagem Docker | Versão da aplicação, injetada pelo pipeline a partir da tag |
| `NODE_ENV` | — (na imagem: `production`) | Express | Modo de execução |
| `BASE_URL` | `http://localhost:3000` | Testes de aceitação | Endereço da API a ser testada |

Nenhuma variável é obrigatória para rodar localmente. O projeto não usa arquivo `.env` versionado; se você criar um, ele já está no `.gitignore`.

## 6. Testar a API manualmente

Com o servidor no ar, em outro terminal (exemplos para Bash ou Git Bash):

```bash
# Saúde
curl http://localhost:3000/health

# Criar uma tarefa
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Escrever o README","priority":"high","dueDate":"2026-12-01"}'

# Listar todas, ou filtrar por status e prioridade
curl http://localhost:3000/tasks
curl "http://localhost:3000/tasks?status=todo&priority=high"

# Consultar, editar, mudar status e remover (troque <id> pelo id retornado na criação)
curl http://localhost:3000/tasks/<id>
curl -X PATCH http://localhost:3000/tasks/<id> \
  -H "Content-Type: application/json" -d '{"description":"Inclui como rodar"}'
curl -X PATCH http://localhost:3000/tasks/<id>/status \
  -H "Content-Type: application/json" -d '{"status":"done"}'
curl -X DELETE http://localhost:3000/tasks/<id>

# Resumo
curl http://localhost:3000/tasks/summary
```

No PowerShell, `Invoke-RestMethod` é mais prático que o `curl`:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/tasks -ContentType "application/json" -Body '{"title":"Escrever o README"}'
```

Campos aceitos na criação e na edição:

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `title` | texto | Sim (na criação) | Não pode ser vazio. Máximo de 100 caracteres |
| `description` | texto | Não | — |
| `priority` | `low`, `medium`, `high` | Não | Padrão `medium` |
| `dueDate` | data ISO 8601 ou `null` | Não | `null` limpa a data |

O status começa como `todo` e só muda pela rota `PATCH /tasks/:id/status` (`todo`, `doing`, `done`). Campos desconhecidos, como `id` ou `createdAt`, são ignorados.

## 7. Rodar os testes

| Comando | O que roda | Precisa da API no ar? |
|---|---|---|
| `npm run test:unit` | `tests/unit/` | Não |
| `npm run test:integration` | `tests/integration/` | Não |
| `npm test` | Unidade e integração | Não |
| `npm run test:acceptance` | `tests/acceptance/` | **Sim**, em `BASE_URL` |

Para medir a cobertura:

```bash
npx jest --coverage --collectCoverageFrom='src/**/*.ts'
```

O relatório fica em `coverage/` (ignorado pelo Git).

### Testes de aceitação

São caixa-preta: falam com a API só por HTTP. Por isso, a API precisa estar rodando antes, de preferência dentro do contêiner, como no pipeline:

```bash
docker build -t tp-gerencia-config .
docker run -d --name tp-api -p 3000:3000 tp-gerencia-config
npm run test:acceptance
docker rm -f tp-api
```

Para testar outro endereço, como a aplicação implantada:

```bash
BASE_URL=https://<endereco-da-aplicacao> npm run test:acceptance
```

## 8. Rodar com Docker

A imagem é o mesmo artefato que vai para produção.

```bash
docker build -t tp-gerencia-config .
docker run --rm -p 3000:3000 tp-gerencia-config
```

Opções úteis:

```bash
# Outra porta no host (a API continua em 3000 dentro do contêiner)
docker run --rm -p 8080:3000 tp-gerencia-config

# Simular a versão injetada pelo pipeline
docker build --build-arg APP_VERSION=0.1.1 -t tp-gerencia-config:0.1.1 .

# Ver o estado do HEALTHCHECK
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Para rodar uma versão já publicada no GHCR, sem compilar:

```bash
docker run --rm -p 3000:3000 ghcr.io/guilhermevieira05/tp-gerencia-config:<versao>
```

## 9. Reproduzir o pipeline localmente

A etapa de Commit do GitHub Actions equivale a:

```bash
npm ci
npm run build
npm run test:unit
npm run test:integration
```

Se esses quatro comandos passam na sua máquina, a etapa de Commit deve passar no pipeline. A etapa de Aceitação equivale à seção 7 (build da imagem, contêiner no ar e `npm run test:acceptance`).

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Error: Cannot find module '.../dist/server.js'` | Projeto não compilado | `npm run build` antes do `npm start` |
| `EADDRINUSE: address already in use :::3000` | Porta ocupada (outro servidor ou contêiner) | Pare o outro processo, ou use `PORT=3001` / `-p 3001:3000` |
| `npm ci` falha dizendo que o lock está fora de sincronia | `package.json` alterado sem atualizar o `package-lock.json` | Rode `npm install` uma vez e versione o `package-lock.json` junto |
| Testes de aceitação falham com `fetch failed` / `ECONNREFUSED` | API não está no ar em `BASE_URL` | Suba o contêiner (seção 7) e confira com `curl $BASE_URL/health` |
| `failed to connect to the docker API` | Docker Desktop (ou o daemon) não está rodando | Abra o Docker Desktop e espere ele iniciar |
| Mudança no código não aparece | `dist/` antigo ou imagem antiga | `npm run build`, ou `docker build` de novo |
| `curl` no PowerShell pede parâmetros estranhos | No Windows PowerShell 5.1, `curl` é um apelido de `Invoke-WebRequest` | Use `curl.exe` ou `Invoke-RestMethod` |
| As tarefas sumiram | Os dados ficam em memória | Comportamento esperado: reiniciar o servidor apaga tudo |

## 11. Gerar uma release

Releases são criadas por tag `vX.Y.Z` e publicadas pela etapa de Lançamento. O procedimento está em [Release e implantação](plano/secao-release-implantacao.md) e as regras de versionamento em [Introdução, itens de configuração, nomenclatura e versionamento](plano/secao-introducao-configuracao.md).

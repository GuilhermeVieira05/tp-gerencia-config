# Seção do Plano de GC — Release e Implantação (Bernardo)

> Insumo para o Plano de GC (modelo RUP): alimenta **3.1 Identificação** (artefatos de release), **3.4 Gestão de Releases** e a parte de implantação do pipeline (etapa de Lançamento).

## 1. Visão geral

A etapa de Lançamento (CD) é a terceira etapa do pipeline em `.github/workflows/pipeline.yml` (job `release-stage`). Ela transforma um commit aprovado nas etapas anteriores em uma **release versionada, imutável e implantada**:

```
tag vX.Y.Z  ──▶  Etapa de Commit  ──▶  Etapa de Aceitação  ──▶  Etapa de Lançamento
                 (build + testes)      (teste de aceitação)     ├─ valida versão
                                                                ├─ carrega a imagem aprovada (sem rebuild)
                                                                ├─ smoke test do contêiner
                                                                ├─ publica no GHCR
                                                                ├─ cria GitHub Release
                                                                ├─ deploy no Render
                                                                └─ verifica /health em produção
```

| Item | Escolha |
|---|---|
| Artefato de release | Imagem Docker (`Dockerfile` na raiz) |
| Registro de artefatos | GitHub Container Registry — `ghcr.io/guilhermevieira05/tp-gerencia-config` |
| Ambiente de produção | Render (Web Service a partir de imagem) |
| Gatilho | Push de tag semver `vX.Y.Z` |
| Aprovação | GitHub Environment `production` (pode exigir revisor) |

## 2. Gatilho e política de release

- **Push na `main`** roda apenas Commit e Aceitação: valida a integração contínua, mas não implanta.
- **Push de tag `vX.Y.Z`** roda o pipeline completo, incluindo o Lançamento.
- O job só executa se as etapas anteriores passarem (`needs`). Uma tag criada sobre um commit quebrado não gera release.
- A tag deve ser igual à versão do `package.json` (`v` + `version`). Se forem diferentes, o primeiro passo do job falha. Assim, a versão declarada no código e a versão publicada nunca divergem.

**Como gerar uma release:**

```bash
npm version 1.0.0 --no-git-tag-version   # atualiza package.json e package-lock.json
git commit -am "chore: release v1.0.0"
# abrir PR, revisar e fazer merge na main
git checkout main && git pull
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 3. Versionamento do artefato

Versionamento semântico (`MAJOR.MINOR.PATCH`). Cada release publica a mesma imagem com várias tags (geradas por `docker/metadata-action`):

| Tag da imagem | Exemplo | Mutável? | Uso |
|---|---|---|---|
| `X.Y.Z` | `1.0.0` | Não | Referência oficial da release; é a tag implantada |
| `X.Y` | `1.0` | Sim | Última correção da linha 1.0 |
| `sha-<commit>` | `sha-e51f277` | Não | Rastreabilidade direta ao commit |
| `latest` | `latest` | Sim | Última release publicada |

A imagem também carrega a variável de ambiente `APP_VERSION` e labels OCI (`org.opencontainers.image.version`, `.revision`, `.source`). Com isso, uma imagem em execução pode ser rastreada até a tag e o commit que a geraram (auditoria).

## 4. Dockerfile

Build em dois estágios sobre `node:20-alpine`:

1. **build**: `npm ci` com todas as dependências e `npm run build` (gera `dist/`).
2. **runtime**: só dependências de produção (`npm ci --omit=dev`) e `dist/`. TypeScript, Jest e o código-fonte não entram na imagem final.

Outras decisões:
- Roda como usuário `node`, não como root.
- Porta lida de `PORT` (padrão 3000), compatível com o Render, que injeta a própria porta.
- `HEALTHCHECK` consulta `/health`.
- `.dockerignore` deixa fora `node_modules`, testes, docs e `.git`. O build fica menor e reproduzível, já que as dependências vêm sempre do `package-lock.json`.

Execução local:

```bash
docker build -t tp-gerencia-config .
docker run --rm -p 3000:3000 tp-gerencia-config
curl http://localhost:3000/health
```

## 5. Passos da etapa de Lançamento

| Passo | O que faz | Falha quando |
|---|---|---|
| Validar tag | Compara a tag com o `package.json` | Versões diferentes |
| Carregar a imagem aprovada | Baixa o artefato `app-image` gerado na Aceitação, faz `docker load` e compara o ID da imagem com o ID testado | IDs diferentes ou artefato ausente |
| Smoke test | Sobe o contêiner e chama `/health` | Contêiner não responde em ~30 s |
| Publicar no GHCR | Aplica as tags da seção 3 (`docker tag`) à **mesma** imagem e faz push, sem reconstruir | Falha de autenticação ou de rede |
| GitHub Release | Cria a release com notas geradas a partir dos commits/PRs. Num re-run, mantém a existente | Falha na API do GitHub |
| Deploy no Render | Chama o deploy hook com `imgURL` apontando para `X.Y.Z` | Secret ausente ou hook inválido |
| Verificar implantação | Faz polling de `RENDER_APP_URL/health` por até 5 min | Produção não responde |

O smoke test acontece **antes** do push. Uma imagem que nem sobe nunca chega ao registro.

## 6. Secrets e variáveis

Ficam configurados no GitHub Environment **`production`** (Settings → Environments), e não no código:

| Nome | Tipo | Conteúdo |
|---|---|---|
| `GITHUB_TOKEN` | Automático | Fornecido pelo Actions. Autentica no GHCR e cria o Release (permissões `packages: write` e `contents: write`, declaradas no job) |
| `RENDER_DEPLOY_HOOK_URL` | Secret | URL do deploy hook do serviço no Render (contém a chave de deploy) |
| `RENDER_APP_URL` | Variable | URL pública da aplicação (ex.: `https://tp-gerencia-config.onrender.com`). Usada na verificação pós-deploy e no link do environment |

Regras:
- Nenhuma credencial é versionada. O `.env` está no `.gitignore`.
- O workflow recebe só as permissões mínimas de que precisa.
- Os secrets do environment só ficam disponíveis para jobs que o declaram (`environment: production`), ou seja, só para o `release-stage`.

## 7. Configuração única do ambiente (fazer uma vez)

1. **GHCR**: depois da primeira release, a imagem aparece em *Packages* do repositório. O repositório é público, mas o pacote do GHCR nasce privado por padrão; confira a visibilidade em *Packages*.
2. **Render**: criar um *Web Service* → *Existing Image* → `ghcr.io/guilhermevieira05/tp-gerencia-config:latest`.
   - Se o pacote estiver privado, cadastrar em *Registry Credentials* um GitHub PAT (classic) com escopo `read:packages`. Outra opção é tornar o pacote público no GHCR.
   - Plano *Free*. Health check path: `/health`.
3. Em *Settings → Deploy Hook* do Render, copiar a URL para o secret `RENDER_DEPLOY_HOOK_URL`.
4. No GitHub, criar o environment `production`, cadastrar o secret e a variável `RENDER_APP_URL`. Opcionalmente, marcar *Required reviewers* para exigir aprovação manual antes de cada implantação.

## 8. Rollback

Toda release fica disponível no GHCR com tag imutável. Para voltar a uma versão anterior:

- **Pelo Render:** *Manual Deploy* → informar a imagem `ghcr.io/guilhermevieira05/tp-gerencia-config:<versão anterior>`.
- **Pelo hook:** `curl -X POST -G "$RENDER_DEPLOY_HOOK_URL" --data-urlencode "imgURL=ghcr.io/guilhermevieira05/tp-gerencia-config:1.0.0"`.

A correção definitiva entra como nova release de patch (`vX.Y.Z+1`). Tags publicadas nunca são reescritas.

## 9. Limitações conhecidas

- O plano gratuito do Render hiberna o serviço após inatividade. A primeira requisição pode levar até ~1 min, o que a verificação pós-deploy tolera.
- `/health` não informa a versão. Por isso a verificação pós-deploy confirma que a aplicação está no ar, mas não que a versão nova já substituiu a anterior. Uma melhoria possível é incluir `APP_VERSION` na resposta de `/health` (camada HTTP).
- **Artefato único:** a imagem é construída uma só vez, na Aceitação, e passada ao Lançamento como artefato do workflow (`app-image`, retenção de 7 dias). O Lançamento confere o ID da imagem antes de publicar. Se o artefato expirar, é preciso reexecutar o pipeline da tag.
- O Lançamento só roda em tag (a tag é a baseline). Push na `main` executa apenas Commit e Aceitação.

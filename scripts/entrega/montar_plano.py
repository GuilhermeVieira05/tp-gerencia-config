#!/usr/bin/env python3
"""Monta docs/plano/PLANO_DE_CM.md na estrutura do modelo (secoes 1 a 6) a partir dos fragmentos
em docs/plano/. Os fragmentos continuam sendo a fonte; este arquivo e gerado.
Uso: python3 scripts/entrega/montar_plano.py"""
import re, pathlib, subprocess

D = pathlib.Path('docs/plano')

def ler(nome): return (D / nome).read_text(encoding='utf-8')

def nivel(l): return len(re.match(r'#+', l).group(0))

def secao(nome, titulo_ini, shift=0, sem_titulo=True):
    """Corpo da secao cujo titulo comeca com titulo_ini, ate o proximo titulo de nivel <= ao dela."""
    linhas = ler(nome).split('\n')
    i = next(k for k, l in enumerate(linhas) if l.startswith('#') and l.lstrip('#').strip().startswith(titulo_ini))
    n = nivel(linhas[i]); j = len(linhas)
    for k in range(i + 1, len(linhas)):
        if linhas[k].startswith('#') and nivel(linhas[k]) <= n:
            j = k; break
    corpo = linhas[(i + 1 if sem_titulo else i):j]
    saida, em_codigo = [], False
    for l in corpo:
        if l.startswith('```'): em_codigo = not em_codigo
        if not em_codigo and l.startswith('#'):
            l = '#' * min(6, nivel(l) + shift) + l.lstrip('#')
        saida.append(l)
    return '\n'.join(saida).strip('\n')

def sub(texto, pares):
    for a, b in pares: texto = texto.replace(a, b)
    return texto

INTRO, CTRL, AUD, MARCOS, REL, ARQ, TEST, QUAL, BKP = (
    'secao-introducao-configuracao.md', 'secao-controle-mudancas.md', 'secao-auditorias.md',
    'secao-marcos-treinamento-fornecedores.md', 'secao-release-implantacao.md',
    'secao-projeto-arquitetura.md', 'secao-estrategia-testes.md', 'secao-qualidade-aceitacao.md',
    'secao-backup-recuperacao.md')

cap = ler('secao-capa-historico.md')
capa = cap.split('## Histórico de revisão')[0].replace('# Plano de Gerenciamento de Configuração', '').strip()
hist_linhas = [l for l in cap.split('## Histórico de revisão')[1].split('## Índice')[0].strip().split('\n')]
hist_linhas.append('| 2026-11-22 | 1.1 | Plano consolidado na estrutura do modelo; seção 3.3.1 (backup, retenção e recuperação); artefato único no pipeline; contagem por AST; correção de divergências apontadas na auditoria 2 | Grupo |')
hist_linhas.append('| 2026-11-22 | 1.2 | Rodada final de correção (auditoria 3): distinção entre o procedimento definido e a prática realizada (proteção da `main`, reviews, CCB, merge, rastreabilidade); papéis × registro no Git; `/health` com versão e verificação pós-deploy por versão; esclarecimento de entrega contínua e do artefato único; baseline `v0.1.2`; números atualizados | Marcos |')
hist = '\n'.join(hist_linhas)
ARQUIVOS = len(subprocess.run(['git', 'ls-files'], capture_output=True, text=True, check=True).stdout.split())

out = []
A = out.append
A('# Plano de Gerenciamento de Configuração\n')
A(capa.replace('| **Versão do plano** | 1.0 |', '| **Versão do plano** | 1.2 |') + '\n')
A('## Histórico de revisão\n'); A(hist + '\n')

A('## Índice\n')
A('''1. Introdução (1.1 Objetivo · 1.2 Escopo · 1.3 Definições, acrônimos e abreviações · 1.4 Referências · 1.5 Visão geral)
2. Gerenciamento de Configuração de Software (2.1 Organização, responsabilidades e interfaces · 2.2 Ferramentas, ambiente e infraestrutura)
3. O Programa de Gerenciamento de Configuração
    - 3.1 Identificação da Configuração (3.1.1 Métodos de identificação · 3.1.2 Linhas de base do projeto)
    - 3.2 Configuração e controle de alterações (3.2.1 Processamento e aprovação de mudanças · 3.2.2 CCB)
    - 3.3 Contabilidade do status de configuração (3.3.1 Armazenamento de mídia e processo de release · 3.3.2 Relatórios e auditorias)
4. Marcos
5. Treinamento e recursos
6. Controle de software do subfornecedor e do fornecedor

Apêndices: A. O projeto e sua arquitetura · B. Testes e critérios de aceitação · C. Pipeline como materialização do plano
''')

# ---------- 1 ----------
A('## 1. Introdução\n')
A('Este plano descreve como o grupo gerencia a configuração do sistema `tp-gerencia-config`, uma API REST de tarefas em TypeScript/Node.js, usando Git/GitHub, um pipeline de CI/CD (GitHub Actions) e contêineres Docker. Ele foi escrito a partir do modelo de Plano de Gerenciamento de Configuração (RUP) e descreve o que de fato está implementado.\n')
A('### 1.1 Objetivo\n'); A(secao(INTRO, '1.1 Propósito') + '\n')
A('### 1.2 Escopo\n'); A(secao(INTRO, '1.2 Escopo') + '\n')
A('### 1.3 Definições, acrônimos e abreviações\n'); A(secao(INTRO, '1.3 Definições') + '\n')
A('Outros termos usados: **CCB** (comitê que analisa e aprova mudanças), **pipeline** (sequência automatizada Commit → Aceitação → Lançamento), **artefato** (resultado de uma etapa, aqui a imagem Docker), **release** (versão liberada aos usuários), **DevOps** (integração entre desenvolvimento e operação por automação e feedback rápido), **rollback** (voltar a uma versão anterior).\n')
A('### 1.4 Referências\n'); A(secao(INTRO, '1.4 Referências').replace('| Demais seções deste plano (`docs/plano/`) | Arquitetura, testes, aceitação, release e implantação |', '| Enunciado do TP1 e modelo de plano da disciplina | Requisitos e estrutura |\n| Guia *Docker Build in CI* (docs.docker.com/build/ci) | Referência para empacotamento no pipeline |\n| Apêndices A a C deste plano | Arquitetura, testes e pipeline |') + '\n')
A('### 1.5 Visão geral\n')
A('''| Parte | Conteúdo |
|---|---|
| 1. Introdução | Objetivo, escopo, definições, referências |
| 2. Gerenciamento de Configuração | Papéis, ferramentas, ambientes |
| 3.1 Identificação | Itens de configuração, nomenclatura, versionamento e baselines |
| 3.2 Controle de alterações | Fluxo de mudança e CCB |
| 3.3 Contabilidade de status | Armazenamento, backup, release, relatórios e auditorias |
| 4, 5, 6 | Marcos, treinamento e recursos, fornecedores |
| Apêndices | Projeto e arquitetura, testes, ligação entre o pipeline e o plano |
''')

# ---------- 2 ----------
A('## 2. Gerenciamento de Configuração de Software\n')
A('### 2.1 Organização, responsabilidades e interfaces\n')
A('''O grupo tem sete integrantes, trabalhando de forma remota sobre um repositório único. As responsabilidades de CM são:

| Papel | Integrante | Responsabilidade de CM |
|---|---|---|
| Presidente do CCB e dono do repositório | Guilherme | Convoca o CCB, desempata, mantém a proteção da `main` e a etapa de Commit do pipeline |
| Gerente de configuração | Rafael | Mantém a lista de ICs, conduz as auditorias, revisa PRs |
| Responsável por pipeline e releases | Bernardo | `Dockerfile`, etapa de Lançamento, tags, deploy no Render |
| Qualidade e aceitação | Mateus | Testes de aceitação e a etapa de Aceitação |
| Domínio e testes de unidade | Marcos | Camada de domínio, testes de unidade, contagem de requisitos |
| Camada HTTP e testes de integração | Carlos | Camada HTTP, testes de unidade e de integração |
| Documentação | Gabriela | README, guia de execução, introdução e identificação de configuração |

**Papéis × registro no Git.** A tabela acima é o **papel definido**. O que o histórico mostra (verificado em 2026-11-22, commit `69b137f`; `git log` e GitHub) é:

| Integrante | Registro no Git e no GitHub |
|---|---|
| Guilherme | 1 commit (estrutura inicial da API e etapa de Commit do pipeline); dono do repositório |
| Marcos | Camada de domínio e testes de unidade; PRs #13, #14 e #16 (integração da Aceitação, script de implantação, plano consolidado, artefato único, slides, release `v0.1.2`) |
| Carlos | PR #5: camada HTTP, testes de unidade e de integração |
| Mateus | Autor dos 3 commits do PR #4 (etapa de Aceitação e os 22 cenários), fechado sem merge; o conteúdo foi integrado pelo PR #13 (squash), onde consta como `Co-authored-by` |
| Bernardo | PRs #2, #3 e #6: `Dockerfile`, etapa de Lançamento, idempotência e release `v0.1.1` |
| Gabriela | PR #7: README, guia de execução e a introdução do plano |
| Rafael | Nenhum commit, PR ou review registrado até esta data |

Onde a prática difere do papel definido, vale esta tabela. Em especial, **não há reviews de PR registradas** (3.2.1).

**Interfaces:** o código deve entrar pela `main` por PR; o pipeline é a interface entre o desenvolvimento e a operação (GitHub Actions → GHCR → Render); o professor avalia o plano, o repositório e a apresentação.
''')
A('### 2.2 Ferramentas, ambiente e infraestrutura\n')
A('''| Ferramenta | Versão | Uso |
|---|---|---|
| Git e GitHub | — | Controle de versão, PRs, issues, Actions, Releases, GHCR |
| Node.js | 20 | Execução e build |
| TypeScript | 5 (`strict`) | Linguagem; `tsc` gera `dist/` |
| npm | `npm ci` com `package-lock.json` | Dependências reproduzíveis |
| Express | 4 | Framework HTTP |
| Jest, `ts-jest`, `supertest` | 29 | Testes de unidade, integração e aceitação |
| Docker | Dockerfile em dois estágios sobre `node:20-alpine` | Empacotamento |
| GitHub Actions | `.github/workflows/pipeline.yml` | CI/CD |
| GHCR | — | Registro de imagens das releases |
| Render | Plano gratuito | Produção (imagem implantada por *deploy hook*) |

| Ambiente | Onde | Para quê |
|---|---|---|
| Desenvolvimento | Máquina de cada integrante (`npm start`, `docker run`) | Escrever e testar antes do PR |
| Integração contínua | Runner `ubuntu-latest` do GitHub Actions | Build, testes e Aceitação a cada push e PR |
| Produção | Render, `https://tp-gerencia-config.onrender.com` | Sistema entregue aos usuários |

**Volume e distribuição:** repositório pequeno (**@@ARQUIVOS@@** arquivos versionados, conforme `git ls-files`), sete pessoas em máquinas distintas, um único servidor remoto (GitHub). O Render hiberna após inatividade; a primeira requisição pode levar cerca de 1 minuto. Procedimentos de controle de versão estão em 3.1 e 3.2.
''')

# ---------- 3.1 ----------
A('## 3. O Programa de Gerenciamento de Configuração\n')
A('### 3.1 Identificação da Configuração\n')
A('#### 3.1.1 Métodos de identificação\n')
ic = secao(INTRO, '2. Itens de configuração', shift=2, sem_titulo=True)
nome = secao(INTRO, '3. Nomenclatura', shift=2)
ver = secao(INTRO, '4. Versionamento', shift=2)
ver_sem_baseline = re.sub(r'##### 4\.4 Baselines.*?(?=##### 4\.5)', '', ver, flags=re.S)
ver_sem_baseline = ver_sem_baseline.replace('##### 4.5 Rastreabilidade', '##### Rastreabilidade')
A('##### Itens de configuração\n'); A(re.sub(r'^##### \d\.\d ', '###### ', ic, flags=re.M) + '\n')
A('##### Nomenclatura\n'); A(re.sub(r'^##### \d\.\d ', '###### ', nome, flags=re.M) + '\n')
A('##### Versionamento\n'); A(re.sub(r'^##### \d\.\d ', '###### ', ver_sem_baseline, flags=re.M) + '\n')
A('#### 3.1.2 Linhas de base do projeto\n')
A(secao(INTRO, '4.4 Baselines') + '\n')
A('**Quem autoriza:** presidente do CCB e responsável por releases (ver 3.2.2). **O que contém:** todos os ICs do repositório naquele commit, mais os itens derivados (imagem, Release, registro de execução).\n')

# ---------- 3.2 ----------
A('### 3.2 Configuração e controle de alterações\n')
A('#### 3.2.1 Processamento e aprovação de controles de mudança\n'); A(secao(CTRL, '3.2.1') + '\n')
A('#### 3.2.2 CCB (Comitê de Controle de Configuração)\n'); A(secao(CTRL, '3.2.2') + '\n')

# ---------- 3.3 ----------
A('### 3.3 Contabilidade do status de configuração\n')
A('#### 3.3.1 Armazenamento de mídia do projeto e processo de release\n')
A('##### Armazenamento, backup, retenção e recuperação\n')
bk = ler(BKP).split('\n', 2)[2]
A(re.sub(r'^## ', '###### ', bk, flags=re.M).strip() + '\n')
A('##### Processo de release\n')
A('**Conteúdo da release:** imagem Docker `ghcr.io/guilhermevieira05/tp-gerencia-config:X.Y.Z` (com as tags `X.Y`, `sha-<commit>` e `latest`), GitHub Release com notas geradas dos PRs e a aplicação implantada no Render. **Público-alvo:** usuários da API (neste TP, o professor e o grupo). **Instalação:** `docker run --rm -p 3000:3000 ghcr.io/guilhermevieira05/tp-gerencia-config:X.Y.Z` ou acesso à URL do Render. **Problemas conhecidos:** ver o fim desta subseção.\n')
A('###### Gatilho e política de release\n'); A(secao(REL, '2. Gatilho') + '\n')
A('###### Versionamento do artefato\n'); A(secao(REL, '3. Versionamento do artefato') + '\n')
A('###### Passos da etapa de Lançamento\n'); A(secao(REL, '5. Passos') + '\n')
A('###### Secrets e variáveis\n'); A(secao(REL, '6. Secrets') + '\n')
A('###### Configuração única do ambiente\n'); A(secao(REL, '7. Configuração única') + '\n')
A('###### Rollback\n'); A(secao(REL, '8. Rollback') + '\n')
A('###### Problemas conhecidos\n'); A(secao(REL, '9. Limitações') + '\n')
A('#### 3.3.2 Relatórios e auditorias\n')
A('##### Relatórios\n'); A(secao(AUD, 'Relatórios') + '\n')
A('##### Auditorias de configuração\n'); A(secao(AUD, 'Auditorias de configuração') + '\n')

# ---------- 4,5,6 ----------
A('## 4. Marcos\n'); A(secao(MARCOS, '4. Marcos') + '\n')
A('## 5. Treinamento e recursos\n'); A(secao(MARCOS, '5. Treinamento') + '\n')
A('## 6. Controle de software do subfornecedor e do fornecedor\n'); A(secao(MARCOS, '6. Controle') + '\n')

# ---------- apendices ----------
A('## Apêndice A. O projeto e sua arquitetura\n')
A(secao(ARQ, '1. O projeto', shift=1, sem_titulo=False).replace('REQ-005', 'P-05') + '\n')
A(secao(ARQ, '2. Arquitetura', shift=1, sem_titulo=False) + '\n')
A(secao(ARQ, '3. Estrutura', shift=1, sem_titulo=False) + '\n')
A(secao(ARQ, '5. Evidência', shift=1, sem_titulo=False).replace('REQ-002 e REQ-003', 'P-01 e P-02') + '\n')

A('## Apêndice B. Testes e critérios de aceitação\n')
A('### Níveis de teste\n'); A(secao(TEST, '2. Níveis de teste', shift=1) + '\n')
A('### Critérios de aceitação\n'); A(secao(QUAL, '3. Critérios de aceitação', shift=1) + '\n')
A('### Gates de qualidade do pipeline\n'); A(secao(QUAL, '6. Critérios de qualidade', shift=1) + '\n')
A('### Limitações dos testes\n'); A(secao(QUAL, '8. Limitações', shift=1) + '\n')

A('## Apêndice C. Pipeline como materialização do plano\n')
A('''```
push na main / PR / tag vX.Y.Z
   |
   v
[1. COMMIT]    npm ci -> build -> testes de unidade -> testes de integração
   |  (falhou? nada avança)
   v
[2. ACEITAÇÃO] constrói a imagem UMA vez -> sobe o contêiner -> 22 cenários via HTTP -> salva a imagem como artefato
   |  (falhou? não há lançamento)
   v
[3. LANÇAMENTO] (só em tag) carrega a MESMA imagem, confere o ID -> smoke test -> GHCR -> GitHub Release -> deploy.sh -> /health com a versão esperada
```

| Seção do plano | Onde aparece no pipeline |
|---|---|
| 2.2 Ferramentas | Runner, Node 20, Docker, GHCR, Render |
| 3.1 Identificação | Validação tag × `package.json`; tags e labels da imagem (`APP_VERSION`, `revision`, `source`) |
| 3.2 Controle de mudanças | Pipeline em PR e na `main`; Commit e Aceitação verdes antes do merge |
| 3.3.1 Release | Etapa de Lançamento e `scripts/deploy.sh` |
| 3.3.2 Auditoria | Registros de execução; artefato único (ID conferido) |
| 6 Fornecedores | `npm ci` com lockfile; imagens e actions com versão fixada |

**Artefato único:** a imagem Docker é construída apenas na Aceitação (o `tsc` da Etapa de Commit é só validação de compilação). O Lançamento a recebe como artefato do workflow, compara o ID com o testado e só então aplica as tags e publica. O mesmo `scripts/deploy.sh` entregue ao professor é o chamado pelo pipeline.
''')

texto = '\n'.join(out)
texto = re.sub(r'^(### )\d\. ', r'\1', texto, flags=re.M)
texto = sub(texto, [
 ('@@ARQUIVOS@@', str(ARQUIVOS)),
 ('(ver seção 2.4)', '(ver "Itens de configuração fora do Git", em 3.1.1)'),
 ('(seção 4)', '(ver "Versionamento", em 3.1.1)'),
 ('(seção 2.4)', '(em "Itens de configuração fora do Git", 3.1.1)'),
 ('Todos os ICs da seção 2.2 são versionados', 'Todos os ICs listados acima são versionados'),
 ('Todos os ICs da seção 2.2', 'Todos os ICs versionados'),
 ('da seção 2.2', 'versionados'),
 ('Tabela em `secao-introducao-configuracao.md` (4.4)', 'Tabela em 3.1.2'),
 ('O procedimento para criar uma release, as aprovações e a auditoria das baselines estão nas seções de Release e Implantação (Bernardo) e de Gestão de Releases (Rafael).', 'O procedimento para criar uma release está em 3.3.1 e a auditoria das baselines em 3.3.2.'),
 ('(seção de auditorias)', '(3.3.2)'),
 ('`secao-release-implantacao.md`', 'a subseção 3.3.1'),
 ('`secao-estrategia-testes.md` e `secao-qualidade-aceitacao.md`', 'o Apêndice B'),
 ('Seção 3 da introdução e `docs/como-rodar.md`', 'Seção 3.1 e `docs/como-rodar.md`'),
 ('`docs/auditoria_configuracao.md`', '`docs/auditoria_configuracao.md` e `docs/auditoria_rodada2.md`'),
 ('(seção de Release, itens 3 e 4)', '(3.3.1, "Configuração única do ambiente", itens 3 e 4)'),
 ('(seção de Release, item 8)', '(3.3.1, "Rollback")'),
 ('Seção do Plano', 'Plano'),
 ('O sistema em si é descrito na seção de Projeto e Arquitetura (Marcos).', 'O sistema em si é descrito no Apêndice A.'),
 ('Aplica as tags da seção 3', 'Aplica as tags de "Versionamento do artefato"'),
 ('(REQ-004)', '(P-03)'),
 ('É descrita na seção de Qualidade e Aceitação (Mateus).', 'É descrita nos critérios de aceitação deste apêndice.'),
 ('Documentação oficial; a subseção 3.3.1', 'Documentação oficial; subseção 3.3.1'),
])
pathlib.Path('docs/plano/PLANO_DE_CM.md').write_text(texto + '\n', encoding='utf-8')
print('ok', len(texto.split('\n')), 'linhas')

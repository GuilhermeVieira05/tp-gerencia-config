# Evidência: proteção da branch `main`

**Verificado em:** 2026-11-23 · **Por:** conta `marcosffp` (permissão de escrita, não administradora) · **Ativada por:** Guilherme (dono do repositório), conforme comentário na issue #11.

## O que a API mostra a qualquer integrante

`gh api repos/GuilhermeVieira05/tp-gerencia-config/branches/main --jq '{protected, protection}'`:

```json
{"protected":true,"protection":{"enabled":true,
 "required_status_checks":{"contexts":["Etapa de Commit","Etapa de Aceitacao"],"enforcement_level":"non_admins"}}}
```

- `protected: true`.
- Status checks obrigatórios: **Etapa de Commit** e **Etapa de Aceitacao**.
- `enforcement_level: non_admins`: **a regra não se aplica ao administrador** (*bypass* habilitado).

Antes da ativação: a proteção não existia segundo a issue #11 (aberta até o dono ativá-la) e a declaração do dono. A auditoria 3 (2026-11-22) registrou 404 em `GET .../branches/main/protection` e `[]` em `GET .../rulesets`, mas o 404 **não prova** a ausência: esse endpoint exige permissão de administrador e responde 404 às demais contas mesmo com a proteção ativa.

## O que o print mostra

`docs/evidencias/protecao-main.png`: tela *Settings → Branches → Branch protection rule* do repositório, regra para o padrão `main` ("Applies to 1 branch"), enviada pelo grupo a partir de uma conta com acesso a *Settings* (a do dono). Itens visíveis:

| Item | Estado no print |
|---|---|
| Require a pull request before merging | **Marcado** |
| Require approvals | **Marcado**, 1 aprovação |
| Dismiss stale pull request approvals when new commits are pushed | Desmarcado (uma aprovação continua valendo depois de novos commits) |
| Require status checks to pass before merging | **Marcado**: `Etapa de Commit` e `Etapa de Aceitacao` (GitHub Actions) |
| Require branches to be up to date before merging | Desmarcado |
| Require conversation resolution / signed commits / linear history | Desmarcados |
| Do not allow bypassing the above settings | **Desmarcado**: administradores podem contornar PR, aprovação e checks |
| Allow force pushes / Allow deletions (seção "Rules applied to everyone including administrators") | **Desmarcados**: *force-push* e deleção bloqueados, inclusive para administradores |

Limitações: é uma tela de edição da regra, sem data visível; o estado salvo foi confirmado também por `protected: true` e pelos dois checks na API (acima). A aprovação não é invalidada por commits novos (*dismiss stale* desmarcado): quem altera um PR depois da review deve pedir nova review, como foi feito no #20.

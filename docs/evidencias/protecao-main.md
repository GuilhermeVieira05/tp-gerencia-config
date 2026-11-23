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

## O que depende da declaração do dono

Na issue #11, o dono declarou: PR obrigatório com 1 aprovação, force-push e deleção bloqueados, administrador pode contornar. Esses itens **não são visíveis** para contas sem permissão de administrador; a verificação direta é *Settings → Branches*. Por isso, o README e o plano os tratam como declaração do dono, não como fato verificado.

## Pendente

- Print de *Settings → Branches* em `docs/evidencias/protecao-main.png`, a ser feito pelo dono (o checklist da auditoria física, 3.3.2, o pede).

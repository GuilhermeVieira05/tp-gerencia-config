# Seção do Plano de GC — Controle de Alterações e CCB (3.2)

## 3.2.1 Processamento e aprovação de mudanças

Toda mudança em um Item de Configuração (código, testes, pipeline, `Dockerfile`, documentação) segue o mesmo caminho. Não há commit direto na `main`.

| Passo | O que acontece | Quem | Registro |
|---|---|---|---|
| 1. Solicitação | Abre-se uma **issue** descrevendo o problema ou a melhoria, com tipo (`feat`, `fix`, `docs`, `ci`...) e prioridade | Qualquer integrante | Issue no GitHub |
| 2. Triagem | O CCB aceita, adia ou rejeita a solicitação e define o responsável | CCB | Comentário e rótulo na issue |
| 3. Implementação | Cria-se a branch `<autor>/<assunto>` a partir da `main` atualizada e commita-se no padrão Conventional Commits | Responsável | Histórico Git |
| 4. Verificação local | `npm run build` e `npm test` passam antes de abrir o PR | Responsável | Descrição do PR |
| 5. Pull request | Título no padrão do commit, descrição com o quê, por quê e como foi testado, e `Closes #N` | Responsável | PR |
| 6. Verificação automática | O pipeline roda a Etapa de Commit e a de Aceitação; ambas precisam estar verdes | GitHub Actions | Execução do workflow |
| 7. Revisão | Um revisor que **não seja o autor** aprova ou pede mudanças | Revisor (Rafael por padrão) | Review no PR |
| 8. Integração | Merge por *squash* na `main`; a branch é apagada | Autor, após aprovação | Commit na `main` com `(#N)` |
| 9. Release (se aplicável) | Atualiza-se `package.json`, cria-se a tag `vX.Y.Z` e o pipeline publica a imagem | Bernardo | Tag, GitHub Release, imagem no GHCR |

**Critérios de aprovação de um PR:** pipeline verde; ao menos 1 aprovação de outro integrante; mensagem no padrão; testes novos para comportamento novo; documentação atualizada quando o contrato da API ou um IC muda; nenhum segredo no diff.

**Mudança urgente (hotfix):** segue o mesmo fluxo, com issue de prioridade alta, revisão imediata e release `PATCH`. O CCB é avisado depois, e a decisão é registrada na própria issue.

**Rastreabilidade:** issue → branch → commits → PR → commit na `main` → tag → imagem (`APP_VERSION` e labels OCI) → release. Com isso é possível ir de uma versão em execução até o pedido que a originou.

**Proteção técnica da `main`:** exige PR, a aprovação mencionada e os status checks "Etapa de Commit" e "Etapa de Aceitação". A configuração fica em *Settings → Branches* e deve ser conferida a cada auditoria (seção de auditorias).

## 3.2.2 CCB (Comitê de Controle de Configuração)

| Papel | Integrante | Atribuição |
|---|---|---|
| Presidente | Guilherme | Convoca reuniões, tem o voto de desempate, dono do repositório e da proteção da `main` |
| Gerente de configuração | Rafael | Mantém a lista de ICs, conduz as auditorias, revisa PRs |
| Responsável pelo pipeline e releases | Bernardo | Avalia impacto no pipeline e aprova a criação de tags |
| Membro técnico (rodízio) | Marcos, Carlos, Mateus ou Gabriela | Um integrante por mudança, sempre diferente do autor |

**Quórum:** 3 membros, sendo o autor da mudança excluído do voto. **Decisão:** maioria simples; empate resolvido pelo presidente.

**Procedimento:**
1. Mudanças comuns são decididas no próprio PR: a aprovação do revisor registra a decisão do CCB.
2. Mudanças que afetam **contrato da API, pipeline, `Dockerfile`, versionamento ou baseline** exigem aprovação explícita de pelo menos 2 membros do CCB no PR.
3. **Criação de baseline (tag):** só com aprovação do presidente e do responsável por releases, pipeline verde na `main` e `package.json` na versão da tag.
4. Reuniões: curtas, ao fim de cada marco (seção 4), para revisar issues abertas e a pauta da próxima baseline. A ata fica como comentário na issue do marco.
5. Mudanças rejeitadas ficam registradas na issue com a justificativa.

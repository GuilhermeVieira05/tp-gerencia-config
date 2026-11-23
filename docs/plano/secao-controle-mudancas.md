# Seção do Plano de GC — Controle de Alterações e CCB (3.2)

## 3.2.1 Processamento e aprovação de mudanças

Toda mudança em um Item de Configuração (código, testes, pipeline, `Dockerfile`, documentação) deve seguir o caminho abaixo, que é o **procedimento definido**. O que foi **efetivamente praticado** até aqui, e onde difere do definido, está em "Procedimento definido × prática realizada", ao fim desta seção. Regra: não há commit direto na `main`.

| Passo | O que acontece | Quem | Registro |
|---|---|---|---|
| 1. Solicitação | Abre-se uma **issue** descrevendo o problema ou a melhoria, com tipo (`feat`, `fix`, `docs`, `ci`...) e prioridade | Qualquer integrante | Issue no GitHub |
| 2. Triagem | O CCB aceita, adia ou rejeita a solicitação e define o responsável | CCB | Comentário e rótulo na issue |
| 3. Implementação | Cria-se a branch `<autor>/<assunto>` a partir da `main` atualizada e commita-se no padrão Conventional Commits | Responsável | Histórico Git |
| 4. Verificação local | `npm run build` e `npm test` passam antes de abrir o PR | Responsável | Descrição do PR |
| 5. Pull request | Título no padrão do commit, descrição com o quê, por quê e como foi testado, e `Closes #N` | Responsável | PR |
| 6. Verificação automática | O pipeline roda a Etapa de Commit e a de Aceitação; ambas precisam estar verdes | GitHub Actions | Execução do workflow |
| 7. Revisão | Um revisor que **não seja o autor** aprova ou pede mudanças | Revisor (Rafael por padrão) | Review no PR |
| 8. Integração | Merge por *squash* na `main` (regra para os próximos PRs; ver "Estratégia de merge"); a branch é apagada | Autor, após aprovação | Commit na `main` com `(#N)` |
| 9. Release (se aplicável) | Atualiza-se `package.json`, cria-se a tag `vX.Y.Z` e o pipeline publica a imagem | Bernardo | Tag, GitHub Release, imagem no GHCR |

**Critérios de aprovação de um PR:** pipeline verde; ao menos 1 aprovação de outro integrante; mensagem no padrão; testes novos para comportamento novo; documentação atualizada quando o contrato da API ou um IC muda; nenhum segredo no diff.

**Mudança urgente (hotfix):** segue o mesmo fluxo, com issue de prioridade alta, revisão imediata e release `PATCH`. O CCB é avisado depois, e a decisão é registrada na própria issue.

**Rastreabilidade:** issue → branch → commits → PR → commit na `main` → tag → imagem (`APP_VERSION` e labels OCI) → release. Com isso é possível ir de uma versão em execução até o pedido que a originou.

**Proteção técnica da `main` (definida):** exigir PR, a aprovação mencionada e os status checks "Etapa de Commit" e "Etapa de Aceitação", e bloquear *force-push*. A configuração fica em *Settings → Branches* e deve ser conferida a cada auditoria (3.3.2). **Estado: ativa desde 2026-11-23** (ver abaixo e `docs/evidencias/protecao-main.md`). Até o PR #18 ela não existia.

#### Procedimento definido × prática realizada

Verificado em 2026-11-23 no GitHub (`gh api`) e no histórico Git, sobre o commit `fdcc342` (a `main` após o PR #18). Onde o estado mudou durante a rodada de correção, a linha diz a data:

| Tema | Definido neste plano | Realizado até 2026-11-23 |
|---|---|---|
| Proteção da `main` | PR, aprovação e dois status checks obrigatórios; sem *force-push* | **Ativa desde 2026-11-23**, configurada pelo dono (Guilherme; issue #11, fechada). Verificável por qualquer integrante: `gh api repos/<dono>/<repo>/branches/main` retorna `protected: true` e os status checks "Etapa de Commit" e "Etapa de Aceitacao" como obrigatórios. Pelo comentário do dono na issue, também exige PR com 1 aprovação e bloqueia *force-push* e deleção; esses itens **não** aparecem para contas sem permissão de administrador. **O administrador pode contornar a regra** (*bypass* habilitado); isso é um risco aceito e deve ser usado só em emergência, com registro no PR ou na issue. Até o PR #18 a `main` não tinha proteção (a API respondia 404) |
| Revisão de PR | Aprovação de outro integrante; 2 aprovações do CCB para contrato, pipeline, `Dockerfile` ou baseline | **Nenhuma review registrada nos PRs #1 a #7 e #13 a #16** (11 PRs, contando os fechados sem merge #4 e #15). **O PR #18 é o primeiro com review registrada** (Rafael, aprovado, com validação local descrita na review). O portão efetivo foi o pipeline verde; as decisões de merge não ficaram registradas como aprovação do CCB. Alterações de `pipeline.yml` e `Dockerfile` (PRs #2, #3, #13, #14) entraram sem as 2 aprovações previstas |
| Quem revisa | Rafael, por padrão | Rafael não tem commit nem PR; fez a **primeira review registrada**, no PR #18 (aprovado) |
| Issue → PR (`Closes #N`) | Todo PR referencia uma issue | PRs #1 a #7 anteriores às issues; só o #13 tem `Closes #N`; #14, #15 e #16 não têm; a rodada de correção usa a issue #17 |
| Estratégia de merge | *Squash* | Mista: *merge commit* nos PRs #1, #5 e #7; *squash* nos PRs #2, #3, #6, #13, #14 e #16 (PRs #4 e #15 fechados sem merge) |

**Estratégia de merge:** para os próximos PRs vale **somente *squash***: um commit por PR na `main`, com `(#N)` no título. Os PRs #1, #5 e #7 permanecem como *merge commit*; o histórico não é reescrito. A restrição técnica (desabilitar *merge commit* e *rebase* em *Settings → General*) também depende do dono do repositório.

**Rastreabilidade a partir daqui:** todo PR novo cita a issue que o originou (`Closes #N`, ou `Refs #N` quando a issue deve continuar aberta). Os PRs sem vínculo listados acima não são corrigidos retroativamente; são rastreados pelo número do PR e pelo histórico de commits.

**Revisão a partir do PR #18:** a aprovação de outro integrante deve ficar registrada como *review* no GitHub. Um PR integrado sem *review* registra o desvio na sua descrição.

## 3.2.2 CCB (Comitê de Controle de Configuração)

| Papel | Integrante | Atribuição |
|---|---|---|
| Presidente | Guilherme | Convoca reuniões, tem o voto de desempate, dono do repositório e da proteção da `main` |
| Gerente de configuração | Rafael | Mantém a lista de ICs, conduz as auditorias, revisa PRs |
| Responsável pelo pipeline e releases | Bernardo | Avalia impacto no pipeline e aprova a criação de tags |
| Membro técnico (rodízio) | Marcos, Carlos, Mateus ou Gabriela | Um integrante por mudança, sempre diferente do autor |

**Quórum:** 3 membros, sendo o autor da mudança excluído do voto. **Decisão:** maioria simples; empate resolvido pelo presidente.

**Procedimento (definido):**
1. Mudanças comuns são decididas no próprio PR: a aprovação do revisor registra a decisão do CCB.
2. Mudanças que afetam **contrato da API, pipeline, `Dockerfile`, versionamento ou baseline** exigem aprovação explícita de pelo menos 2 membros do CCB no PR.
3. **Criação de baseline (tag):** só com aprovação do presidente e do responsável por releases, pipeline verde na `main` e `package.json` na versão da tag.
4. Reuniões: curtas, ao fim de cada marco (seção 4), para revisar issues abertas e a pauta da próxima baseline. A ata fica como comentário na issue do marco.
5. Mudanças rejeitadas ficam registradas na issue com a justificativa.

**Prática até 2026-11-23:** não há atas nem votações do CCB registradas; a única aprovação registrada é a review do Rafael no PR #18, e fora isso o registro de verificação das mudanças é o resultado do pipeline. As três tags criadas (`v0.1.0` a `v0.1.2`) também não têm registro de aprovação do presidente e do responsável por releases além da própria tag anotada e do GitHub Release. Daqui em diante, as decisões do CCB são registradas no PR ou na issue correspondente.

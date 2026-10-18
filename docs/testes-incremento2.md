# Evidências de teste – Incremento 2 (Check-in diário)

Escopo: **UC04** (check-in diário) e **UC10 parcial** (histórico dos últimos 30 dias), cards PB11–PB15.
Todos os testes rodam no CI (GitHub Actions) em cada Pull Request e em cada push na `main`.
Como executar: ver [`testes-incremento1.md`](testes-incremento1.md#como-executar).

## Resumo (18/10/2026 – projeto inteiro, incrementos 1 e 2)

| Suíte | Arquivos | Testes | Resultado |
|---|---|---|---|
| Back-end – unitários | 7 | 58 | ✅ |
| Back-end – integração/e2e (PostgreSQL) | 9 | 76 | ✅ |
| App – componentes, telas e sessão | 7 | 45 | ✅ |
| **Total** | **23** | **179** | ✅ |

Cobertura (camada de serviços `Apl...` + guards de segurança): **98,3% das linhas** (mínimo: 60% – CQ08).

**Tempo de resposta do histórico de 30 dias (CQ04, limite 2 s)** – 20 requisições locais com 30 check-ins de observação longa:
mediana **6,5 ms**, p95 **8,9 ms**, máximo **11,9 ms** (`incremento2.e2e-spec.ts`, medição de 18/10/2026; ver também o teste com mais 50 pacientes no banco em `historico.e2e-spec.ts`).

## Critérios de aceitação × testes

### PB11 – API de check-in (UC04)
| Critério | Onde é verificado |
|---|---|
| Humor e energia 1–5, sono 0–24, observação ≤ 500 | `checkin.dto.spec.ts` (faixas válidas e inválidas), `checkins.e2e-spec.ts` (400 e limites) |
| Faixas garantidas também no banco (CHECK) | `incremento2.e2e-spec.ts` – "defesa em profundidade" |
| Um check-in por dia: novo envio atualiza | `apl-checkin.service.spec.ts`, `checkins.e2e-spec.ts`, `incremento2.e2e-spec.ts`; unicidade no banco também testada |
| Dia no fuso America/Sao_Paulo | `apl-checkin.service.spec.ts` (`dataLocal`) |
| Só paciente com TCLE aceito (403); sem token (401) | `checkins.e2e-spec.ts`, `incremento2.e2e-spec.ts` |
| Vínculo sempre com o paciente do token | `checkins.e2e-spec.ts`, `incremento2.e2e-spec.ts` (`pacienteId` no corpo → 400) |

### PB12 – API de histórico (UC10 parcial)
| Critério | Onde é verificado |
|---|---|
| `GET /checkins?dias=30` só do próprio paciente, do mais recente ao mais antigo | `apl-checkin.service.spec.ts`, `historico.e2e-spec.ts`, `incremento2.e2e-spec.ts` |
| Paciente A nunca vê dados de B | `historico.e2e-spec.ts`, `incremento2.e2e-spec.ts` |
| Resposta ≤ 2 s com 30 dias de dados | `historico.e2e-spec.ts`, `incremento2.e2e-spec.ts` (mediana/p95 acima) |

### PB13 / PB14 – Telas (app)
| Critério | Onde é verificado |
|---|---|
| Home mostra se o check-in de hoje foi feito | `checkin.test.tsx` |
| Seletores 1–5, sono e observação; mensagem de sucesso/erro | `checkin.test.tsx` |
| Check-in em menos de 30 s | `checkin.test.tsx` – fluxo mínimo de **3 toques** (humor, energia, Registrar) |
| Histórico por data com humor, energia, sono e observação | `historico.test.tsx` |
| Estado vazio com convite para o primeiro check-in | `historico.test.tsx` |
| Sem escores ou tendências (R07) | `historico.test.tsx` (verifica a ausência de termos interpretativos) |

## Jornada completa (PB15)

`backend/test/incremento2.e2e-spec.ts`, só pela API HTTP:

1. paciente com TCLE aceito começa com histórico vazio
2. check-in do dia → 201; aparece no histórico com os mesmos valores
3. novo envio no mesmo dia → 200; o histórico continua com 1 registro, atualizado
4. check-ins de dias anteriores aparecem do mais recente ao mais antigo

Privacidade: A e B registram valores diferentes, cada um só vê o seu; tentativas de apontar `pacienteId` para o outro (no corpo ou na URL) → 400; sem token → 401.
Banco: CHECKs de faixa e unicidade (paciente, dia) recusam dados inválidos mesmo inseridos fora da API.

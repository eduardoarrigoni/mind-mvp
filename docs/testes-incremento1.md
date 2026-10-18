# Evidências de teste – Incremento 1 (Acesso e consentimento)

Escopo: **UC01** (cadastro e login do paciente) e **UC13** (TCLE), cards PB01–PB10.
Todos os testes rodam no CI (GitHub Actions) em cada Pull Request e em cada push na `main`.

## Como executar

```bash
docker compose up -d                  # PostgreSQL (mind e mind_test)
cd backend
npm test                              # unitários
npm run test:cov                      # unitários + cobertura (mínimo 60% – CQ08)
npm run test:e2e                      # integração e ponta a ponta (banco mind_test)
cd ../app && npm test                 # app (Jest + jest-expo)
```

## Resumo (17/10/2026)

| Suíte | Arquivos | Testes | Resultado |
|---|---|---|---|
| Back-end – unitários | 5 | 33 | ✅ |
| Back-end – integração/e2e (PostgreSQL) | 6 | 39 | ✅ |
| App – componentes, telas e sessão | 5 | 32 | ✅ |
| **Total** | **16** | **104** | ✅ |

Cobertura (camada de serviços `Apl...` + guards de segurança): **97,9% das linhas** (mínimo exigido: 60% – CQ08).

## Critérios de aceitação × testes

### PB05 / PB06 – Cadastro e login (UC01)
| Critério | Onde é verificado |
|---|---|
| Cadastro cria paciente; senha com bcrypt custo ≥ 12, nunca devolvida | `apl-autenticacao.service.spec.ts`, `cadastro.e2e-spec.ts` (confere o hash no banco) |
| E-mail duplicado → 409 (sem diferenciar maiúsculas) | `cadastro.e2e-spec.ts`, `incremento1.e2e-spec.ts` |
| Dados inválidos → 400; campos extras (ex.: `papel`) recusados | `cadastro.e2e-spec.ts` |
| Login devolve JWT com id e PAPEL | `login.service.spec.ts`, `login.e2e-spec.ts` |
| Credenciais inválidas → 401 sem revelar o campo (resposta idêntica) | `login.service.spec.ts`, `login.e2e-spec.ts`, `incremento1.e2e-spec.ts` |
| Rotas protegidas exigem token (401); token adulterado/expirado → 401 | `guards.spec.ts`, `incremento1.e2e-spec.ts` |
| Guard de PAPEL (403 para papel não permitido) | `guards.spec.ts`, `login.e2e-spec.ts` |

### PB07 – API do TCLE (UC13 / RN08)
| Critério | Onde é verificado |
|---|---|
| `GET /tcle/vigente` retorna texto e versão | `apl-consentimento.service.spec.ts`, `tcle.e2e-spec.ts` |
| `POST /tcle/aceite` registra usuário, versão e data/hora | `tcle.e2e-spec.ts` (confere a linha no banco) |
| Aceite idempotente; versão desatualizada → 409 | `apl-consentimento.service.spec.ts`, `tcle.e2e-spec.ts` |
| `GET /auth/me` informa se o TCLE foi aceito | `login.service.spec.ts`, `tcle.e2e-spec.ts` |
| Registro clínico sem aceite → 403 | `apl-consentimento.service.spec.ts` (TcleGuard), `tcle.e2e-spec.ts`, `incremento1.e2e-spec.ts` |

### PB08 / PB09 – Telas (app)
| Critério | Onde é verificado |
|---|---|
| Formulários validam campos com mensagens claras | `validacao.test.ts`, `acesso.test.tsx` |
| Erros da API exibidos (401, 409) | `acesso.test.tsx` |
| Token salvo no SecureStore; sessão restaurada; token inválido descartado | `acesso.test.tsx` |
| Após login: TCLE se pendente, senão Home; botão Sair | `acesso.test.tsx` |
| TCLE: texto e versão; "Li e aceito" só após confirmar | `tcle.test.tsx` |
| Sem aceite não acessa a Home; aceite não é pedido de novo | `tcle.test.tsx` |

### PB02 – Persistência
| Critério | Onde é verificado |
|---|---|
| Esquema criado só por migrations e igual às entidades | `persistencia.int-spec.ts` |
| Herança Paciente/Profissional, unicidade de e-mail, rollback de todas as migrations | `persistencia.int-spec.ts` |

## Jornada completa (PB10)

`backend/test/incremento1.e2e-spec.ts` executa, só pela API HTTP:

1. cadastro → 201 (sem expor a senha)
2. login → 200, JWT, `tcleAceito: false`
3. registro clínico → **403** (TCLE pendente)
4. leitura do TCLE vigente e aceite → 201
5. `/auth/me` com `tcleAceito: true`; registro clínico liberado → 201
6. novo login não pede o TCLE de novo

Casos negativos: e-mail duplicado (409), senha errada e e-mail inexistente (401 idêntico), três rotas protegidas sem token (401), token com payload adulterado (401), token expirado (401) e aceite individual (outro paciente sem aceite continua com 403).

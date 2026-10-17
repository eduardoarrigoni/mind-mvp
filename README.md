# Mind – MVP

[![CI](https://github.com/eduardoarrigoni/mind-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/eduardoarrigoni/mind-mvp/actions/workflows/ci.yml)

Sistema de apoio ao acompanhamento de saúde mental. O paciente registra sua rotina e seu estado de saúde e acompanha o próprio progresso; o profissional de saúde acompanha seus pacientes conforme as permissões concedidas.

> O Mind é **complementar** à atuação do profissional: não substitui avaliação, diagnóstico ou decisão clínica.

**Disciplina:** Gerência de Projetos de Software – IFES Campus Serra
**Equipe:** Felipe Soeiro Accioly (GP/Analista) · Eduardo Souza Arrigoni (Arquiteto/Back-end) · Heloísa Borghardt Hand (Front-end/UX) · Gabriela Demezio Azeredo (QA)
**Quadro Kanban:** Trello – "Mind – Entrega 2"

## Stack

| Camada | Tecnologia |
|---|---|
| App mobile | React Native + Expo (TypeScript), código único Android/iOS |
| Back-end | NestJS (TypeScript), API REST |
| Banco | PostgreSQL + TypeORM (migrations, `synchronize: false`) |
| Testes | Vitest + Supertest (back-end) |
| Qualidade | oxlint (back-end), ESLint (app), Prettier, GitHub Actions |

## Estrutura

```
mind-mvp/
├── backend/   API NestJS
└── app/       App React Native/Expo
```

## Pré-requisitos

- Node.js 20+ e npm
- Docker (para o PostgreSQL local)
- App **Expo Go** no celular (opcional; o app também roda no navegador)

## Como executar

```bash
# 1. Instalar dependências
npm run install:all

# 2. Banco PostgreSQL (cria também o banco de testes mind_test)
docker compose up -d

# 3. Criar/atualizar o esquema do banco (somente por migrations)
cd backend
npm run migration:run       # migration:revert desfaz a última; migration:show lista

# 4. Back-end (porta 3000)
npm run start:dev

# 5. App (em outro terminal)
cd app
npm start          # escaneie o QR code com o Expo Go
npm run web        # ou abra no navegador
```

## Qualidade

```bash
npm run lint        # lint do back-end e do app
npm run typecheck   # checagem de tipos
npm test            # testes unitários do back-end

# Testes de integração e e2e (precisam do docker compose up -d)
cd backend && npm run test:e2e
```

## Integração contínua

O workflow `.github/workflows/ci.yml` roda em todo push na `main` e em todo Pull Request:

- **Back-end:** lint, checagem de tipos, build, testes unitários com cobertura (mínimo de **60%** de linhas na camada de lógica de negócio – CQ08) e testes de integração/e2e contra um PostgreSQL de serviço.
- **App:** lint e checagem de tipos.
- O resumo da cobertura aparece na página da execução e o relatório HTML fica disponível como artefato (`cobertura-backend`).

## Persistência

- Esquema criado **somente por migrations** (`synchronize: false`), registradas em `backend/src/database/migrations/index.ts`.
- Camada `utilitarioPersistencia`: `ObjetoPersistente` (UUID + carimbos de data), interface `DAO` e `DAOTypeORM` genérico; DAOs concretos estendem `DAOTypeORM` (ex.: `UsuarioDAO`).
- `Usuario` usa herança em tabela única: `Paciente` e `Profissional`, discriminados pela coluna enumerada `papel`.
- Os testes de integração recriam o banco `mind_test` do zero e verificam que o esquema das migrations corresponde às entidades.

## Fluxo de trabalho

- Cada card do Trello vira uma branch `card-XX-descricao` (ex.: `card-01-monorepo`).
- Merge na `main` **somente via Pull Request**, revisado por outro membro e com CI verde.
- O link do PR é comentado no card correspondente.

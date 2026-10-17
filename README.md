# Mind – MVP

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

# 2. Back-end (porta 3000)
cd backend
npm run start:dev

# 3. App (em outro terminal)
cd app
npm start          # escaneie o QR code com o Expo Go
npm run web        # ou abra no navegador
```

## Qualidade

```bash
npm run lint        # lint do back-end e do app
npm run typecheck   # checagem de tipos
npm test            # testes do back-end
```

## Fluxo de trabalho

- Cada card do Trello vira uma branch `card-XX-descricao` (ex.: `card-01-monorepo`).
- Merge na `main` **somente via Pull Request**, revisado por outro membro e com CI verde.
- O link do PR é comentado no card correspondente.

# Valorant Duel

Plataforma web para organizar e acompanhar campeonatos amistosos de Valorant 1x1. Organizadores autenticados administram inscrições, partidas e resultados; participantes e espectadores acompanham o torneio por um link público, sem precisar criar uma conta.

## Funcionalidades

- Múltiplos torneios por organizador
- Autenticação de organizadores com Clerk
- Inscrição pública por código ou link
- Acompanhamento privado do status da inscrição
- Aprovação e rejeição de participantes
- Geração automática do formato competitivo:
  - 3 a 6 participantes: todos contra todos
  - 7 ou mais participantes: sistema suíço
- Playoffs em eliminação simples
- Metas de 15 rounds na classificatória, 25 nos playoffs e 30 na Grande Final
- Placares editáveis com progressão automática
- Classificação com critérios de desempate
- Chaveamento responsivo para desktop e dispositivos móveis
- Navegação por fase e rodada persistida na URL
- Separação de dados entre organizadores

## Regras e consistência

As operações críticas são executadas em transações PostgreSQL e serializadas por torneio. O registro de um placar e toda a progressão decorrente — criação de rodadas, geração dos playoffs, avanço automático por bye e propagação de vencedores — são confirmados ou revertidos juntos.

Tokens de acompanhamento de inscrição são gerados de forma aleatória. O navegador recebe o token completo, enquanto o banco armazena somente seu hash SHA-256.

## Tecnologias

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Hook Form e Zod
- Wouter
- Clerk

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- Clerk
- Pino

### Workspace

- pnpm workspaces
- OpenAPI
- Cliente React e validadores Zod gerados a partir do contrato da API
- Testes com o executor nativo do Node.js

## Estrutura

```text
artifacts/
├── api-server/          API Express e regras competitivas
├── valorant-duel/       Aplicação React
└── mockup-sandbox/      Ambiente interno de prototipação visual
lib/
├── api-client-react/    Cliente React gerado
├── api-spec/            Contrato OpenAPI
├── api-zod/             Schemas Zod gerados
└── db/                  Schema e conexão PostgreSQL
```

## Requisitos

- Node.js 24 ou versão compatível
- pnpm
- PostgreSQL
- Aplicação Clerk configurada

## Variáveis de ambiente

Configure estas variáveis no ambiente de execução. Nunca envie seus valores para o Git:

```env
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
SESSION_SECRET=
```

No Replit, use Secrets para valores confidenciais.

## Instalação

```bash
pnpm install
```

Atualize o schema do banco:

```bash
pnpm --filter @workspace/db run push
```

## Desenvolvimento

Inicie a API:

```bash
pnpm --filter @workspace/api-server run dev
```

Em outro terminal, inicie o frontend:

```bash
pnpm --filter @workspace/valorant-duel run dev
```

## Validação

Execute os testes:

```bash
pnpm run test
```

Execute o typecheck completo:

```bash
pnpm run typecheck
```

Crie uma build de produção:

```bash
pnpm run build
```

## Fluxo de uso

1. O organizador entra com sua conta.
2. Cria um torneio e compartilha o link público.
3. Participantes enviam seus nicknames e acompanham a aprovação pelo protocolo armazenado no navegador.
4. O organizador aprova o elenco e inicia o torneio.
5. A plataforma gera os confrontos conforme a quantidade de participantes.
6. Cada placar registrado atualiza a classificação e a progressão.
7. Ao fim da classificatória, o chaveamento eliminatório é gerado automaticamente.

## Licença

Este projeto está licenciado sob a licença MIT.
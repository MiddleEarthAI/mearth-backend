# Middle Earth Agents

An autonomous agent system where AI-driven characters interact in a persistent game world, powered by advanced language models, blockchain technology, and social media integration.

## 🌟 Features

- **Autonomous Agents**: Four unique characters with distinct personalities and goals

  - Purrlock Paws: A ruthless detective seeking justice
  - Sir Gullihop: A carefree prince running from responsibility
  - Scootles: A determined working-class hero pursuing truth
  - Wanderleaf: A wise wanderer carrying ancient knowledge

- **Advanced AI**: Powered by Anthropic's Claude for natural decision-making and interactions
- **Blockchain Integration**: Solana-based event recording and token management
- **Social Integration**: Real-time Twitter interactions and community feedback
- **Secure Architecture**: Robust key management and encrypted data storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Solana CLI tools
- Twitter Developer Account
- Anthropic API Key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/middle-earth-agents.git
cd middle-earth-agents/express-ts
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize database:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

## 📖 Documentation

For detailed documentation about the system architecture and components, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## 🛠 Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma
- **AI**: Anthropic Claude
- **Blockchain**: Solana
- **Social**: Twitter API
- **Testing**: Vitest
- **Logging**: Winston, Pino

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

# Project Structure

## Core Components

### Agent System (`/src/agent/`)

- `DecisionEngine.ts` - AI decision-making using Vercel AI SDK
- `TwitterManager.ts` - Handles Twitter API interactions and social presence
- `GameManager.ts` - Core game state and rules management
- `BattleResolver.ts` - Combat and conflict resolution
- `GameOrchestrator.ts` - Coordinates all game systems
- `ActionManager.ts` - Handles agent actions and their effects
- `CacheManager.ts` - Performance optimization through caching

### Configuration (`/src/config/`)

- `env.ts` - Environment configuration and validation
- `game-data.ts` - Game rules and constants

### Types (`/src/types/`)

- `agent.ts` - Agent-related type definitions
- `twitter.ts` - Twitter API interface types
- `index.ts` - Shared type definitions

### Testing (`/src/__tests__/`)

- `agent/battle.test.ts` - Battle system tests
- `agent/alliance.test.ts` - Alliance system tests
- `setup.ts` - Test environment configuration

## Key Files

- `app.ts` - Express application entry point
- `constants/index.ts` - Global constants
- `utils/logger.ts` - Logging utility

## Important Links

- Twitter API Documentation: https://developer.twitter.com/en/docs/twitter-api
- Vercel AI SDK: https://sdk.vercel.ai/docs
- Express.js: https://expressjs.com/
- Prisma ORM: https://www.prisma.io/docs

To deploy the application:
Set up environment variables:
cp .env.example .env

# Edit .env with your production values

2. Build and run with Docker:
   pnpm docker:build
   pnpm docker:run

   Or deploy directly:
   pnpm predeploy
   pnpm deploy

   The application will be available on port 3000 with the following endpoints:
   Health check: GET /health
   Game routes: GET /game/\*

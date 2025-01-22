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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Anthropic for Claude AI
- Solana Foundation
- Twitter Developer Platform
- All contributors and community members

## 🔗 Links

- [Documentation](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

# AI App Builder

Plataforma de geração de apps via prompts, similar ao Lovable/AI Studio.

## Features

- 💬 Chat interface para descrever apps
- 🤖 Geração de código via IA (Claude)
- 📝 Editor de código com Monaco
- 👁️ Preview em tempo real
- 📁 Gerenciamento de arquivos
- 🚀 Deploy com um clique

## Setup

1. Clone o repositório
2. Instale dependências:
   ```bash
   npm install
   ```

3. Copie o arquivo de variáveis:
   ```bash
   cp .env.example .env.local
   ```

4. Adicione sua API key da Anthropic no `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

5. Inicie o servidor:
   ```bash
   npm run dev
   ```

6. Abra http://localhost:3000

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Claude API (Anthropic)
- Monaco Editor
- Zustand

## Uso

1. Digite um prompt descrevendo o app que você quer criar
2. Aguarde a geração do código
3. Edite o código no editor se necessário
4. Veja o preview em tempo real
5. Faça deploy quando estiver satisfeito

## Desenvolvimento

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Licença

MIT

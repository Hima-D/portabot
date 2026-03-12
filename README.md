# PortaBot

A plug-and-play RAG chatbot widget that you can embed on any website in 2 lines of code.

## Quick Start

### 1. Install Dependencies

```bash
cd portabot

# Install all dependencies
npm install

# Or install individually
cd backend && npm install
cd ../dashboard && npm install
```

### 2. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend  # API server on http://localhost:3000
npm run dev:dashboard  # Dashboard on http://localhost:5173
```

### 3. Use the Widget

Copy the embed code from the dashboard (Settings → Customize) and add it to your website:

```html
<script>
  window.PortaBotConfig = { botId: "demo-bot-123" };
</script>
<script src="https://cdn.portabot.io/widget.js" async></script>
```

## Project Structure

```
portabot/
├── widget/           # Embeddable JS widget
├── backend/          # Node.js API server
│   ├── api/          # REST API routes
│   ├── rag/          # RAG pipeline
│   ├── knowledge/   # Document ingestion
│   └── models/      # Data models & LLM
└── dashboard/        # React admin panel
```

## Features

- **Embed in 2 lines** - Add AI support to any site instantly
- **RAG-powered** - Grounded answers from your documents
- **Customizable** - Colors, persona, behavior
- **Analytics** - Track usage and performance
- **Human handoff** - Escalate to real agents

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express + WebSocket
- **RAG**: Custom embedding + retrieval pipeline
- **LLM**: Anthropic Claude / OpenAI (configurable)

## License

MIT

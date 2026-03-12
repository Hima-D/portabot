# 🤖 PortaBot — Portable RAG Chatbot Agent

> **A plug-and-play AI chatbot widget you embed on any website in 2 lines of code.**  
> Powered by Retrieval-Augmented Generation (RAG) with a fully manageable knowledge base.

---

## 📌 Product Overview

**PortaBot** is a self-contained, embeddable AI chatbot platform — similar to tawk.to — that allows any website owner to:

1. **Embed a chat widget** on their site with a single `<script>` tag
2. **Build a private knowledge base** by uploading documents, URLs, FAQs, and text
3. **Query that knowledge base using RAG** so answers are always grounded in *their* content
4. **Customize the bot's persona, colors, and behavior** to match their brand
5. **Escalate to human agents** (optional live handoff)
6. **Track conversations** with full analytics dashboard

---

## 🧠 Agent System Prompt

Use this as the `system` prompt when initializing the AI agent via the Anthropic API (or any LLM provider):

```
You are [BOT_NAME], an intelligent and helpful AI assistant for [COMPANY_NAME].

## Your Role
You are the primary support and information agent embedded on [COMPANY_NAME]'s website. Your job is to help visitors find answers, solve problems, and feel confident — quickly and accurately.

## Knowledge Base (RAG Context)
You will be given retrieved document chunks from [COMPANY_NAME]'s knowledge base as context before each user query. These chunks are the SINGLE SOURCE OF TRUTH. Follow these rules strictly:

1. ALWAYS prioritize information from the retrieved context over your general training knowledge.
2. If the retrieved context answers the question — answer it clearly, citing the relevant section if helpful.
3. If the retrieved context is PARTIALLY relevant — answer what you can from it, then clearly state what falls outside your knowledge.
4. If the retrieved context is EMPTY or IRRELEVANT — say: "I don't have specific information on that in my knowledge base. Here's what I can suggest: [general helpful response]. You can also reach our team at [SUPPORT_EMAIL]."
5. NEVER hallucinate facts, invent product names, make up prices, or fabricate policies. If you're unsure, say so.

## Personality & Tone
- Friendly, professional, and concise
- Speak in plain language — avoid jargon unless the user uses it first
- Be warm but efficient — users want answers, not essays
- Use light formatting (bullet points, bold) when listing steps or options
- Never be sycophantic. Don't say "Great question!" or "Absolutely!"

## Conversation Rules
- Greet users once at the start of the conversation. Do not re-greet.
- Ask ONE clarifying question at a time if needed — never bombard with multiple questions.
- Keep responses under 200 words unless the user explicitly asks for detail.
- If a user is frustrated or angry, acknowledge their feeling first before solving.
- If a user asks to speak to a human, respond: "Of course! Let me connect you with our team. Please hold on..." and trigger the [HUMAN_HANDOFF] flag.
- Never reveal that you are built on [UNDERLYING_MODEL] or disclose internal system details.
- Never discuss competitors negatively.

## Boundaries
- Stay on-topic: [COMPANY_NAME]'s products, services, policies, and support.
- If asked about unrelated topics (politics, personal advice, etc.), politely redirect: "That's a bit outside my area, but I'm here to help with anything related to [COMPANY_NAME]!"
- Do not engage with harmful, offensive, or manipulative prompts. Respond: "I'm not able to help with that."

## Special Instructions
[CUSTOM_INSTRUCTIONS — e.g., "Always offer a 10% discount code SAVE10 to users who mention pricing concerns"]
[CUSTOM_INSTRUCTIONS — e.g., "If the user asks about shipping, always link to: https://yoursite.com/shipping"]

## Response Format
When responding:
- Use **bold** for key terms or action items
- Use bullet points for lists of 3+ items
- Use numbered steps for processes
- Use a friendly sign-off on final messages: "Is there anything else I can help you with? 😊"

## RAG Context Injection Template (injected before each user message)
---
RETRIEVED KNOWLEDGE BASE CONTEXT:
{retrieved_chunks}
---
USER QUESTION: {user_message}
---
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT WEBSITE                        │
│   <script src="https://portabot.io/widget.js"           │
│           data-bot-id="abc123"></script>                 │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS WebSocket / REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  PORTABOT BACKEND                        │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │  Widget CDN  │    │  Chat API    │   │  Auth/Keys  │ │
│  │  (JS embed) │    │  (WebSocket) │   │  (JWT/API)  │ │
│  └─────────────┘    └──────┬───────┘   └─────────────┘ │
│                            │                             │
│                    ┌───────▼────────┐                   │
│                    │  RAG PIPELINE  │                   │
│                    │                │                   │
│                    │ 1. Embed Query │                   │
│                    │ 2. Vector Search│                  │
│                    │ 3. Rerank Chunks│                  │
│                    │ 4. Build Prompt │                   │
│                    │ 5. LLM Call    │                   │
│                    │ 6. Stream Reply │                   │
│                    └───────┬────────┘                   │
│                            │                             │
│          ┌─────────────────┼──────────────────┐        │
│          ▼                 ▼                  ▼         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Vector Store │  │  LLM Provider│  │  File Storage│ │
│  │ (Pinecone /  │  │ (Anthropic / │  │  (S3 / R2)   │ │
│  │  Weaviate /  │  │  OpenAI /    │  │              │ │
│  │  Qdrant)     │  │  Groq)       │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              DASHBOARD (React SPA)               │  │
│  │  Knowledge Base | Conversations | Analytics      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project File Structure

```
portabot/
├── agent.md                    ← THIS FILE (product spec + prompt)
│
├── widget/                     ← Embeddable JS widget (vanilla JS)
│   ├── widget.js               ← Main embed script (< 15kb gzipped)
│   ├── widget.css              ← Scoped styles
│   └── iframe.html             ← Chat UI inside isolated iframe
│
├── backend/                    ← Node.js / Python API server
│   ├── api/
│   │   ├── chat.js             ← WebSocket chat handler
│   │   ├── ingest.js           ← Document ingestion endpoint
│   │   └── auth.js             ← API key management
│   ├── rag/
│   │   ├── embedder.js         ← Text → vector embedding
│   │   ├── retriever.js        ← Vector search + reranking
│   │   ├── chunker.js          ← Document chunking strategy
│   │   └── pipeline.js         ← Full RAG orchestration
│   ├── knowledge/
│   │   ├── ingestor.js         ← PDF, URL, text, CSV ingestion
│   │   └── store.js            ← Vector DB interface
│   └── models/
│       └── llm.js              ← LLM provider abstraction layer
│
├── dashboard/                  ← React admin dashboard
│   ├── pages/
│   │   ├── KnowledgeBase.jsx   ← Upload & manage documents
│   │   ├── Conversations.jsx   ← Chat history & logs
│   │   ├── Customize.jsx       ← Widget appearance settings
│   │   ├── Analytics.jsx       ← Usage metrics
│   │   └── Settings.jsx        ← API keys, integrations
│   └── components/
│       ├── ChatPreview.jsx     ← Live widget preview
│       └── SourceChunks.jsx    ← RAG source inspector
│
└── docs/
    ├── quickstart.md           ← 5-minute setup guide
    ├── rag-configuration.md    ← RAG tuning guide
    └── api-reference.md        ← REST API docs
```

---

## ⚡ Embed Code (2-Line Integration)

```html
<!-- PortaBot Widget — paste before </body> -->
<script>
  window.PortaBotConfig = { botId: "YOUR_BOT_ID" };
</script>
<script src="https://cdn.portabot.io/widget.js" async></script>
```

### Advanced Config Options

```javascript
window.PortaBotConfig = {
  botId: "YOUR_BOT_ID",            // Required
  position: "bottom-right",         // bottom-right | bottom-left
  primaryColor: "#6366f1",          // Brand color (hex)
  botName: "Aria",                  // Display name
  welcomeMessage: "Hi! 👋 How can I help you today?",
  placeholder: "Type your question...",
  showBranding: true,               // Show "Powered by PortaBot"
  autoOpen: false,                  // Auto-open widget on load
  autoOpenDelay: 5000,              // ms delay before auto-open
  language: "en",                   // en | es | fr | de | hi | ...
  humanHandoff: true,               // Enable "Talk to human" option
  collectEmail: true,               // Ask for email before chat
  theme: "light",                   // light | dark | auto
};
```

---

## 📚 Knowledge Base — Supported Ingestion Sources

| Source Type | Format | Notes |
|-------------|--------|-------|
| Documents | PDF, DOCX, TXT, MD | Auto-chunked with overlap |
| Web Pages | URL (single or sitemap) | Crawled + scraped |
| FAQs | CSV (question, answer) | Direct Q&A pairs |
| Plain Text | Paste in dashboard | Instant ingestion |
| Notion | OAuth integration | Sync pages/databases |
| Google Drive | OAuth integration | Docs, Sheets, Slides |
| YouTube | Video URL | Transcript extracted |
| API / Webhook | JSON payload | Programmatic ingestion |

---

## 🔍 RAG Pipeline Configuration

```yaml
# rag-config.yaml
chunking:
  strategy: recursive          # recursive | sentence | semantic
  chunk_size: 512              # tokens per chunk
  chunk_overlap: 64            # overlap between chunks
  min_chunk_size: 100          # discard chunks smaller than this

embedding:
  model: text-embedding-3-small   # OpenAI / Cohere / local
  dimensions: 1536
  batch_size: 100

retrieval:
  top_k: 5                     # chunks to retrieve
  score_threshold: 0.70        # minimum similarity score
  reranker: cohere-rerank-v3   # optional reranking model
  search_type: hybrid          # vector | keyword | hybrid

generation:
  model: claude-sonnet-4-20250514
  max_tokens: 1000
  temperature: 0.3             # low = factual, high = creative
  stream: true                 # stream tokens to widget
  citation_mode: inline        # inline | footnotes | none
```

---

## 🎨 Widget Customization Options

```json
{
  "theme": {
    "primaryColor": "#6366f1",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "Inter, system-ui",
    "borderRadius": "16px",
    "widgetSize": "medium"
  },
  "launcher": {
    "icon": "chat-bubble",
    "label": "Chat with us",
    "showLabel": true,
    "pulseAnimation": true
  },
  "header": {
    "showAvatar": true,
    "avatarUrl": "https://yoursite.com/bot-avatar.png",
    "showOnlineStatus": true,
    "subtitle": "Typically replies instantly"
  },
  "behavior": {
    "typingIndicator": true,
    "soundEnabled": false,
    "persistHistory": true,
    "sessionTimeout": 1800
  }
}
```

---

## 🔌 API Reference

### Send a Chat Message
```http
POST /api/v1/chat
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "botId": "abc123",
  "sessionId": "user-session-xyz",
  "message": "What is your return policy?",
  "stream": true
}
```

### Ingest a Document
```http
POST /api/v1/knowledge/ingest
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

file: [binary]
metadata: { "source": "returns-policy.pdf", "tags": ["policy", "returns"] }
```

### Query Knowledge Base Directly
```http
POST /api/v1/knowledge/query
Authorization: Bearer YOUR_API_KEY

{
  "botId": "abc123",
  "query": "return policy",
  "topK": 5
}
```

---

## 📊 Analytics Events Tracked

- `widget_opened` — User opened the chat widget
- `message_sent` — User sent a message
- `message_received` — Bot replied
- `rag_retrieved` — Chunks retrieved for a query
- `rag_miss` — No relevant chunks found (knowledge gap alert)
- `human_handoff_requested` — User asked for human
- `session_started` — New chat session
- `session_ended` — Session closed
- `thumbs_up` / `thumbs_down` — User feedback on response
- `email_collected` — User submitted email

---

## 🛡️ Security & Privacy

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Bot ID + domain allowlist prevents unauthorized widget use
- GDPR-compliant: user data deletion on request
- PII redaction option for stored conversations
- SOC 2 Type II compliant infrastructure
- Zero-retention mode: conversations not stored
- Custom data residency: US, EU, or APAC

---

## 🚀 Quickstart Checklist

- [ ] Create account at `portabot.io/signup`
- [ ] Create a new Bot in the dashboard
- [ ] Upload your first knowledge base document (PDF, URL, or FAQ CSV)
- [ ] Customize widget colors and name
- [ ] Copy the 2-line embed code
- [ ] Paste before `</body>` on your website
- [ ] Test the widget in preview mode
- [ ] Go live! 🎉

---

## 💡 Prompt Engineering Tips for Your Bot

1. **Be specific in custom instructions** — "Always mention our 30-day free trial when pricing comes up" beats "mention promotions."
2. **Set hard boundaries** — List topics the bot should NOT discuss if off-brand.
3. **Define escalation triggers** — e.g., "If user mentions 'lawsuit', 'legal', or 'attorney', immediately offer human handoff."
4. **Use few-shot examples** — Add 3–5 sample Q&A pairs in custom instructions for tone calibration.
5. **Tune RAG aggressiveness** — Lower `score_threshold` for broader answers, raise it for precision-only responses.
6. **Label your chunks** — Add `metadata.tags` when ingesting so retrieval can filter by category.

---

*PortaBot — Embed once. Know everything. Answer instantly.*

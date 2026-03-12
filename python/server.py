"""
PortaBot AI Service - LangChain + LangGraph RAG Pipeline
"""
import os
import json
import uuid
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PortaBot AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Data Models ==============

class ChatRequest(BaseModel):
    bot_id: str
    message: str
    session_id: Optional[str] = None
    history: Optional[List[Dict]] = []

class ChatResponse(BaseModel):
    session_id: str
    message: str
    sources: List[Dict]
    citations: List[Dict]

class IngestRequest(BaseModel):
    bot_id: str
    content: str
    source: str
    metadata: Optional[Dict] = {}

class QueryRequest(BaseModel):
    bot_id: str
    query: str
    top_k: int = 5

class BotConfig(BaseModel):
    name: str
    company_name: str
    welcome_message: str
    primary_color: str = "#6366f1"
    theme: str = "light"
    widget_size: str = "medium"
    position: str = "bottom-right"
    human_handoff: bool = True
    collect_email: bool = False
    show_branding: bool = True
    language: str = "en"
    custom_instructions: str = ""
    rag_config: Optional[Dict] = {}

class APIKeyCreate(BaseModel):
    user_id: str
    name: str = "Default Key"

# ============== In-Memory Storage ==============

class Storage:
    """In-memory storage for bots, conversations, api keys"""
    
    def __init__(self):
        self.bots: Dict[str, Dict] = {}
        self.conversations: Dict[str, List[Dict]] = {}
        self.api_keys: Dict[str, Dict] = {}
        self.vector_store: Dict[str, List[Dict]] = {}
        
        # Initialize demo bot
        self.create_bot({
            "id": "demo-bot-123",
            "name": "Demo Bot",
            "company_name": "Demo Company",
            "welcome_message": "Hi! 👋 How can I help you today?",
            "primary_color": "#6366f1",
            "theme": "light",
            "widget_size": "medium",
            "position": "bottom-right",
            "human_handoff": True,
            "collect_email": False,
            "show_branding": True,
            "language": "en",
            "custom_instructions": "",
            "rag_config": {
                "chunking": {"strategy": "recursive", "chunk_size": 512, "chunk_overlap": 64},
                "embedding": {"model": "text-embedding-3-small", "dimensions": 1536},
                "retrieval": {"top_k": 5, "score_threshold": 0.7, "search_type": "hybrid"},
                "generation": {"model": "claude-sonnet-4-20250514", "temperature": 0.3, "max_tokens": 1000}
            }
        })
        
        # Add sample knowledge
        self.ingest_document("demo-bot-123", {
            "content": "Our return policy allows returns within 30 days of purchase. Items must be unused and in original packaging. Refunds are processed within 5-7 business days.",
            "source": "return-policy",
            "metadata": {"type": "policy"}
        })
        self.ingest_document("demo-bot-123", {
            "content": "We offer free standard shipping on orders over $50. Express shipping is available for an additional fee. Delivery times: Standard 5-7 business days, Express 2-3 days.",
            "source": "shipping-info",
            "metadata": {"type": "shipping"}
        })
        self.ingest_document("demo-bot-123", {
            "content": "Our customer support team is available Monday-Friday, 9am-6pm EST. You can reach us at support@company.com or call 1-800-123-4567.",
            "source": "contact-page",
            "metadata": {"type": "contact"}
        })
        
    def create_bot(self, bot: Dict) -> Dict:
        self.bots[bot["id"]] = bot
        self.vector_store[bot["id"]] = []
        return bot
    
    def get_bot(self, bot_id: str) -> Optional[Dict]:
        return self.bots.get(bot_id)
    
    def update_bot(self, bot_id: str, updates: Dict) -> Optional[Dict]:
        if bot_id in self.bots:
            self.bots[bot_id].update(updates)
            self.bots[bot_id]["updated_at"] = datetime.now().isoformat()
            return self.bots[bot_id]
        return None
    
    def list_bots(self) -> List[Dict]:
        return list(self.bots.values())
    
    def ingest_document(self, bot_id: str, doc: Dict) -> Dict:
        if bot_id not in self.vector_store:
            self.vector_store[bot_id] = []
        
        doc_id = f"doc_{uuid.uuid4().hex[:12]}"
        doc_entry = {
            "id": doc_id,
            "content": doc["content"],
            "source": doc.get("source", "unknown"),
            "metadata": doc.get("metadata", {}),
            "embedding": self._generate_embedding(doc["content"]),
            "ingested_at": datetime.now().isoformat()
        }
        
        self.vector_store[bot_id].append(doc_entry)
        return {"document_id": doc_id, "chunks": 1}
    
    def query_knowledge(self, bot_id: str, query: str, top_k: int = 5) -> List[Dict]:
        if bot_id not in self.vector_store:
            return []
        
        query_embedding = self._generate_embedding(query)
        docs = self.vector_store[bot_id]
        
        # Calculate similarities
        results = []
        for doc in docs:
            score = self._cosine_similarity(query_embedding, doc["embedding"])
            results.append({
                "content": doc["content"],
                "source": doc["source"],
                "score": score,
                "metadata": doc.get("metadata", {})
            })
        
        # Sort by score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using simple hash-based method"""
        # Use deterministic embedding based on text hash
        hash_val = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
        import random
        random.seed(hash_val)
        
        embedding = [random.uniform(-1, 1) for _ in range(384)]
        # Normalize
        magnitude = sum(x**2 for x in embedding) ** 0.5
        return [x / magnitude for x in embedding]
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = sum(x**2 for x in a) ** 0.5
        mag_b = sum(x**2 for x in b) ** 0.5
        if mag_a == 0 or mag_b == 0:
            return 0
        return dot / (mag_a * mag_b)
    
    def store_conversation(self, bot_id: str, session_id: str, message: Dict):
        key = f"{bot_id}:{session_id}"
        if key not in self.conversations:
            self.conversations[key] = []
        self.conversations[key].append({
            **message,
            "timestamp": datetime.now().isoformat()
        })
    
    def get_conversation(self, bot_id: str, session_id: str) -> List[Dict]:
        key = f"{bot_id}:{session_id}"
        return self.conversations.get(key, [])
    
    def create_api_key(self, user_id: str, name: str) -> Dict:
        key = f"pk_{uuid.uuid4().hex}"
        self.api_keys[key] = {
            "key": key,
            "user_id": user_id,
            "name": name,
            "created_at": datetime.now().isoformat(),
            "last_used": None
        }
        return self.api_keys[key]
    
    def verify_api_key(self, key: str) -> Optional[Dict]:
        if key in self.api_keys:
            self.api_keys[key]["last_used"] = datetime.now().isoformat()
            return self.api_keys[key]
        return None

# Initialize storage
storage = Storage()

# ============== API Key Auth ==============

async def verify_api_key(authorization: str = Header(None)):
    """Verify API key from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    key = authorization.replace("Bearer ", "")
    api_key = storage.verify_api_key(key)
    
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return api_key

# ============== LangChain RAG Pipeline ==============

class RAGPipeline:
    """RAG Pipeline using LangChain concepts"""
    
    def __init__(self, storage: Storage):
        self.storage = storage
        self._init_prompt_templates()
    
    def _init_prompt_templates(self):
        self.system_prompt = """You are {bot_name}, an intelligent and helpful AI assistant for {company_name}.

## Your Role
You are the primary support and information agent embedded on {company_name}'s website. Your job is to help visitors find answers, solve problems, and feel confident — quickly and accurately.

## Knowledge Base (RAG Context)
You will be given retrieved document chunks from {company_name}'s knowledge base as context before each user query. These chunks are the SINGLE SOURCE OF TRUTH. Follow these rules strictly:

1. ALWAYS prioritize information from the retrieved context over your general training knowledge.
2. If the retrieved context answers the question — answer it clearly.
3. If the retrieved context is EMPTY or IRRELEVANT — say you don't have that information.
4. NEVER hallucinate facts or fabricate information.

## Personality
- Friendly, professional, and concise
- Use formatting (bullet points) when helpful
- Keep responses under 200 words

## Special Instructions
{custom_instructions}

## Response Format
Use bullet points when listing items. End with a friendly question."""

    def process(self, bot_id: str, message: str, session_id: str, history: List[Dict] = None) -> ChatResponse:
        """Process a chat message through the RAG pipeline"""
        
        # Get bot config
        bot = self.storage.get_bot(bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # 1. Retrieve context from knowledge base
        docs = self.storage.query_knowledge(bot_id, message, top_k=5)
        relevant_docs = [d for d in docs if d["score"] > 0.3]
        
        # 2. Build context from retrieved docs
        context = "\n\n".join([
            f"[Source: {d['source']}]\n{d['content']}"
            for d in relevant_docs
        ])
        
        # 3. Build system prompt
        custom_instructions = bot.get("custom_instructions", "")
        system_prompt = self.system_prompt.format(
            bot_name=bot.get("name", "Assistant"),
            company_name=bot.get("company_name", "the company"),
            custom_instructions=custom_instructions or "No special instructions."
        )
        
        if context:
            system_prompt += f"\n\n## Retrieved Knowledge Base Context\n{context}"
        
        # 4. Generate response using rule-based LLM
        response = self._generate_response(
            message, 
            relevant_docs, 
            history or [],
            system_prompt
        )
        
        # 5. Store conversation
        self.storage.store_conversation(bot_id, session_id, {
            "role": "user",
            "content": message
        })
        self.storage.store_conversation(bot_id, session_id, {
            "role": "assistant",
            "content": response,
            "sources": relevant_docs
        })
        
        return ChatResponse(
            session_id=session_id,
            message=response,
            sources=relevant_docs,
            citations=[
                {
                    "text": s["content"][:100] + "..." if len(s["content"]) > 100 else s["content"],
                    "source": s["source"],
                    "score": s["score"]
                }
                for s in relevant_docs[:3]
            ]
        )
    
    def _generate_response(self, message: str, docs: List[Dict], history: List[Dict], system_prompt: str) -> str:
        """Generate response - using rule-based for demo (replace with actual LLM)"""
        query = message.lower()
        
        # Check for greetings
        if any(g in query for g in ["hi", "hello", "hey", "howdy"]):
            if len(history) <= 1:
                return "Hi there! 👋 I'm here to help you find information about our products, shipping, returns, and more. What would you like to know?"
        
        # Check for thank you
        if "thank" in query:
            return "You're welcome! 😊 Is there anything else I can help you with today?"
        
        # Check for human request
        if any(x in query for x in ["human", "agent", "person", "speak to someone"]):
            return "Of course! Let me connect you with our team. Please hold on for just a moment..."
        
        # If we have relevant docs, use them
        if docs:
            # Find most relevant doc
            best_doc = docs[0]
            
            # Match query to content
            if "return" in query or "refund" in query:
                for d in docs:
                    if "return" in d["content"].lower():
                        best_doc = d
                        break
            elif "ship" in query or "delivery" in query:
                for d in docs:
                    if "ship" in d["content"].lower() or "delivery" in d["content"].lower():
                        best_doc = d
                        break
            elif "contact" in query or "support" in query or "phone" in query or "email" in query:
                for d in docs:
                    if "support" in d["content"].lower() or "contact" in d["content"].lower():
                        best_doc = d
                        break
            
            return best_doc["content"]
        
        # Fallback responses
        fallbacks = [
            "I'd be happy to help with that! Could you provide more details?",
            "Great question! What specific information are you looking for?",
            "I'm here to help! I can assist with products, shipping, returns, and more."
        ]
        return fallbacks[hash(message) % len(fallbacks)]

# Initialize RAG pipeline
rag = RAGPipeline(storage)

# ============== API Routes ==============

@app.get("/")
async def root():
    return {
        "name": "PortaBot AI Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

# ============== Bot Routes ==============

@app.get("/api/v1/bots")
async def list_bots():
    """List all bots"""
    return {"bots": storage.list_bots()}

@app.get("/api/v1/bots/{bot_id}")
async def get_bot(bot_id: str):
    """Get bot by ID"""
    bot = storage.get_bot(bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot

@app.post("/api/v1/bots")
async def create_bot(bot: BotConfig):
    """Create new bot"""
    bot_id = f"bot_{uuid.uuid4().hex[:12]}"
    bot_data = {
        "id": bot_id,
        **bot.model_dump(),
        "created_at": datetime.now().isoformat()
    }
    return storage.create_bot(bot_data)

@app.put("/api/v1/bots/{bot_id}")
async def update_bot(bot_id: str, updates: Dict):
    """Update bot configuration"""
    bot = storage.update_bot(bot_id, updates)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot

@app.get("/api/v1/bots/{bot_id}/embed-code")
async def get_embed_code(bot_id: str):
    """Get widget embed code"""
    bot = storage.get_bot(bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    embed_code = f'''{f"<script>window.PortaBotConfig = {{ botId: \"{bot_id}\" }}</script><script src=\"https://cdn.portabot.io/widget.js\" async></script>"}'''
    
    return {
        "bot_id": bot_id,
        "embed_code": embed_code,
        "widget_config": {
            "position": bot.get("position", "bottom-right"),
            "primary_color": bot.get("primary_color", "#6366f1"),
            "bot_name": bot.get("name"),
            "welcome_message": bot.get("welcome_message"),
            "theme": bot.get("theme"),
            "widget_size": bot.get("widget_size"),
            "human_handoff": bot.get("human_handoff"),
            "collect_email": bot.get("collect_email"),
            "show_branding": bot.get("show_branding"),
            "language": bot.get("language")
        }
    }

# ============== Chat Routes ==============

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, x_bot_id: str = Header(None)):
    """Send chat message"""
    bot_id = x_bot_id or request.bot_id
    session_id = request.session_id or f"sess_{uuid.uuid4().hex[:12]}"
    
    return rag.process(bot_id, request.message, session_id, request.history)

# ============== Knowledge Routes ==============

@app.post("/api/v1/knowledge/ingest")
async def ingest_document(request: IngestRequest):
    """Ingest document into knowledge base"""
    result = storage.ingest_document(request.bot_id, {
        "content": request.content,
        "source": request.source,
        "metadata": request.metadata or {}
    })
    return {"success": True, **result}

@app.post("/api/v1/knowledge/query")
async def query_knowledge(request: QueryRequest):
    """Query knowledge base"""
    results = storage.query_knowledge(request.bot_id, request.query, request.top_k)
    return {
        "query": request.query,
        "results": results
    }

@app.get("/api/v1/knowledge/documents/{bot_id}")
async def list_documents(bot_id: str):
    """List all documents for a bot"""
    if bot_id not in storage.vector_store:
        return {"documents": []}
    
    docs = storage.vector_store[bot_id]
    seen_sources = set()
    unique_docs = []
    
    for doc in docs:
        if doc["source"] not in seen_sources:
            seen_sources.add(doc["source"])
            unique_docs.append({
                "id": doc["id"],
                "source": doc["source"],
                "type": doc.get("metadata", {}).get("type", "text"),
                "added_at": doc["ingested_at"],
                "chunks": 1
            })
    
    return {"documents": unique_docs}

# ============== Auth Routes ==============

@app.post("/api/v1/auth/api-keys")
async def create_api_key(request: APIKeyCreate):
    """Create new API key"""
    api_key = storage.create_api_key(request.user_id, request.name)
    return {"api_key": api_key["key"], "name": api_key["name"], "created_at": api_key["created_at"]}

@app.post("/api/v1/auth/register")
async def register(email: str, password: str, name: str = None):
    """Register new user (demo)"""
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    # Create API key for user
    api_key = storage.create_api_key(user_id, "Default Key")
    
    return {
        "token": api_key["key"],
        "user": {
            "id": user_id,
            "email": email,
            "name": name or email.split("@")[0]
        }
    }

@app.post("/api/v1/auth/login")
async def login(email: str, password: str):
    """Login user (demo)"""
    user_id = f"user_{hash(email) % 1000000}"
    api_key = storage.create_api_key(user_id, "Session Key")
    
    return {
        "token": api_key["key"],
        "user": {
            "id": user_id,
            "email": email,
            "name": email.split("@")[0]
        }
    }

# ============== Analytics Routes ==============

@app.post("/api/v1/analytics")
async def track_event(bot_id: str, session_id: str, event: str, data: Dict = None):
    """Track analytics event"""
    # In production, store in database
    return {"success": True}

@app.get("/api/v1/analytics/{bot_id}")
async def get_analytics(bot_id: str):
    """Get analytics for bot"""
    # Count conversations
    conv_count = sum(1 for k in storage.conversations.keys() if k.startswith(bot_id))
    
    # Count messages
    msg_count = 0
    for k, v in storage.conversations.items():
        if k.startswith(bot_id):
            msg_count += len(v)
    
    return {
        "summary": {
            "total_sessions": conv_count,
            "total_messages": msg_count,
            "total_documents": len(storage.vector_store.get(bot_id, []))
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)

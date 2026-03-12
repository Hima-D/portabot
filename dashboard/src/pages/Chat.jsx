import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';

function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', content: 'Hi! 👋 How can I help you today?', sources: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Id': 'demo-bot-123'
        },
        body: JSON.stringify({
          message: input,
          sessionId: sessionId || undefined
        })
      });

      const data = await response.json();
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      const botMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: data.message,
        sources: data.sources || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        sources: []
      }]);
    }

    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{ id: 1, role: 'bot', content: 'Hi! 👋 How can I help you today?', sources: [] }]);
    setSessionId(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Chat</h1>
            <p className="page-description">Test your bot with the RAG-powered chat interface</p>
          </div>
          <button className="btn btn-secondary" onClick={clearChat}>
            <Trash2 size={18} />
            Clear Chat
          </button>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {msg.role === 'bot' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={20} color="white" />
                </div>
              )}
              
              <div style={{
                maxWidth: '70%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? '#6366f1' : '#f1f5f9',
                color: msg.role === 'user' ? 'white' : '#1e293b',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
                
                {msg.sources?.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.3)' : '#e2e8f0'}` }}>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '6px' }}>Sources:</div>
                    {msg.sources.map((source, i) => (
                      <div key={i} style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                        📄 {source.source} ({(source.score * 100).toFixed(0)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={20} color="#64748b" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={20} color="white" />
              </div>
              <div style={{
                padding: '14px 18px',
                borderRadius: '18px 18px 18px 4px',
                background: '#f1f5f9',
              }}>
                <Loader2 size={20} color="#6366f1" className="spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '12px',
          background: 'white'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '14px 18px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              border: 'none',
              background: input.trim() ? '#6366f1' : '#e2e8f0',
              color: input.trim() ? 'white' : '#94a3b8',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Chat;

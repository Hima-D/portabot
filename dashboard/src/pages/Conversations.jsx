import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { useBot } from '../context/BotContext';

function Conversations() {
  const { bot } = useBot();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bot?.id) {
      fetchSessions();
    }
  }, [bot?.id]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/bots/${bot.id}/sessions`, {
        headers: { 'x-bot-id': bot.id }
      });
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
    setLoading(false);
  };

  const fetchSessionHistory = async (sessionId) => {
    try {
      const response = await fetch(`/api/v1/bots/${bot.id}/sessions/${sessionId}`, {
        headers: { 'x-bot-id': bot.id }
      });
      const data = await response.json();
      setSessionHistory(data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Conversations</h1>
        <p className="page-description">View and manage chat sessions</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" className="input-field" placeholder="Search conversations..." style={{ paddingLeft: 40, width: 300 }} />
            </div>
            <button className="btn btn-secondary">
              <Filter size={18} />
              Filter
            </button>
          </div>
          <button className="btn btn-secondary">
            <Download size={18} />
            Export
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Last Message</th>
              <th>Messages</th>
              <th>Started</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={5}>No conversations yet</td></tr>
            ) : sessions.map(session => (
              <tr key={session.sessionId} onClick={() => { setSelectedSession(session.sessionId); fetchSessionHistory(session.sessionId); }} style={{ cursor: 'pointer' }}>
                <td>
                  <code style={{ fontSize: 12, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>{session.sessionId}</code>
                </td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.lastMessage || 'No messages'}
                </td>
                <td>{session.messageCount}</td>
                <td>{formatTimeAgo(session.started)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-icon" title="View" onClick={(e) => { e.stopPropagation(); setSelectedSession(session.sessionId); fetchSessionHistory(session.sessionId); }}>
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Session Details</h3>
          </div>
          {selectedSession ? (
            <div>
              <div className="detail-row">
                <span className="detail-label">Session ID</span>
                <code>{selectedSession}</code>
              </div>
              <div className="detail-row">
                <span className="detail-label">Messages</span>
                <span>{sessionHistory?.messages?.length || 0}</span>
              </div>
              {sessionHistory?.messages?.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Started</span>
                  <span>{formatTimeAgo(sessionHistory.messages[0].timestamp)}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>Select a session to view details</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Messages</h3>
          </div>
          {sessionHistory?.messages?.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {sessionHistory.messages.map((msg, i) => (
                <div key={i} style={{ 
                  padding: '8px 12px', 
                  marginBottom: 8, 
                  borderRadius: 8,
                  background: msg.role === 'user' ? '#e0e7ff' : '#f1f5f9',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    {msg.role}
                  </div>
                  <div style={{ fontSize: 14 }}>{msg.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>Select a session to view messages</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Conversations;

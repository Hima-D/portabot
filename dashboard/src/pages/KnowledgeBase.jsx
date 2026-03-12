import React, { useState, useEffect } from 'react';
import { useBot } from '../context/BotContext';
import { Upload, FileText, Link as LinkIcon, Trash2, Plus, Search, Loader2 } from 'lucide-react';

function KnowledgeBase() {
  const { bot } = useBot();
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('text');
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textSource, setTextSource] = useState('');
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [bot?.id]);

  const loadDocuments = async () => {
    if (!bot?.id) return;
    try {
      const response = await fetch(`http://localhost:3000/api/v1/knowledge/documents`, {
        headers: { 'X-Bot-Id': bot.id }
      });
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textContent.trim()) return;
    
    setLoading(true);
    try {
      await fetch('http://localhost:3000/api/v1/knowledge/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Id': bot.id
        },
        body: JSON.stringify({
          content: textContent,
          source: textSource || 'text-input',
          metadata: { type: 'text' }
        })
      });
      
      setTextContent('');
      setTextSource('');
      loadDocuments();
    } catch (error) {
      console.error('Failed to add text:', error);
    }
    setLoading(false);
  };

  const handleTestQuery = async () => {
    if (!testQuery.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Id': bot.id
        },
        body: JSON.stringify({
          query: testQuery,
          topK: 3
        })
      });
      const data = await response.json();
      setTestResults(data.results || []);
    } catch (error) {
      console.error('Failed to query:', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Knowledge Base</h1>
        <p className="page-description">Manage your bot's knowledge sources - add content, documents, URLs</p>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
          Plain Text
        </div>
        <div className={`tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
          Documents
        </div>
        <div className={`tab ${activeTab === 'urls' ? 'active' : ''}`} onClick={() => setActiveTab('urls')}>
          URLs
        </div>
        <div className={`tab ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>
          FAQ
        </div>
      </div>

      {activeTab === 'text' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Add Text Content</h3>
          </div>
          <form onSubmit={handleTextSubmit}>
            <div className="input-group">
              <label className="input-label">Content</label>
              <textarea
                className="input-field textarea-field"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your content here... (e.g., Our return policy allows returns within 30 days...)"
                rows={6}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Source Name (optional)</label>
              <input
                type="text"
                className="input-field"
                value={textSource}
                onChange={(e) => setTextSource(e.target.value)}
                placeholder="e.g. return-policy, about-us, contact-page"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !textContent.trim()}>
              {loading ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
              Add to Knowledge Base
            </button>
          </form>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upload Documents</h3>
          </div>
          <div className="upload-form">
            <div className="input-group">
              <label className="input-label">Upload File (PDF, TXT, MD, CSV)</label>
              <input type="file" className="input-field" accept=".pdf,.txt,.md,.csv" />
            </div>
            <div className="input-group">
              <label className="input-label">Tags (comma separated)</label>
              <input type="text" className="input-field" placeholder="e.g. policy, returns, support" />
            </div>
            <button className="btn btn-primary">
              <Upload size={18} />
              Upload
            </button>
          </div>
        </div>
      )}

      {activeTab === 'urls' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Add URL</h3>
          </div>
          <div className="input-group">
            <label className="input-label">Website URL</label>
            <input type="url" className="input-field" placeholder="https://example.com/page" />
          </div>
          <button className="btn btn-primary">
            <LinkIcon size={18} />
            Fetch & Add
          </button>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Add FAQ</h3>
          </div>
          <div className="input-group">
            <label className="input-label">Question</label>
            <input type="text" className="input-field" placeholder="Enter question" />
          </div>
          <div className="input-group">
            <label className="input-label">Answer</label>
            <textarea className="input-field textarea-field" placeholder="Enter answer" rows={3} />
          </div>
          <button className="btn btn-primary">
            <Plus size={18} />
            Add FAQ
          </button>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Test Knowledge Base</h3>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            className="input-field"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Enter a test query..."
            onKeyPress={(e) => e.key === 'Enter' && handleTestQuery()}
          />
          <button className="btn btn-primary" onClick={handleTestQuery}>
            <Search size={18} />
            Test
          </button>
        </div>
        {testResults && testResults.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {testResults.map((result, i) => (
              <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  Source: {result.source} (Score: {(result.score * 100).toFixed(0)}%)
                </div>
                <div style={{ fontSize: 14 }}>{result.content}</div>
              </div>
            ))}
          </div>
        )}
        {testResults && testResults.length === 0 && (
          <p style={{ marginTop: 16, color: '#94a3b8' }}>No results found</p>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Added Content ({documents.length} items)</h3>
        </div>
        {documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No content added yet</h3>
            <p>Add text, documents, or URLs above to build your knowledge base</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr key={i}>
                  <td>{doc.source || 'Unknown'}</td>
                  <td><span className="badge badge-info">{doc.type || 'text'}</span></td>
                  <td>{doc.addedAt ? new Date(doc.addedAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default KnowledgeBase;

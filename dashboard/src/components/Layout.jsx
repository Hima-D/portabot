import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useBot } from '../context/BotContext';
import {
  MessageSquare,
  Book,
  History,
  Palette,
  BarChart3,
  Settings,
  Bot,
  ChevronDown,
  MessageCircle,
  Plus,
  Sparkles
} from 'lucide-react';
import './Layout.css';

function Layout() {
  const location = useLocation();
  const { bot, bots, selectBot, createBot } = useBot();
  const [showBotSelector, setShowBotSelector] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newBotName, setNewBotName] = React.useState('');
  const [newBotCompany, setNewBotCompany] = React.useState('');

  const handleCreateBot = async () => {
    if (!newBotName.trim()) return;
    await createBot({
      name: newBotName,
      companyName: newBotCompany || newBotName,
      companyUrl: 'https://example.com'
    });
    setNewBotName('');
    setNewBotCompany('');
    setShowCreateModal(false);
    setShowBotSelector(false);
  };

  const navItems = [
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/dashboard', icon: MessageSquare, label: 'Dashboard' },
    { path: '/knowledge', icon: Book, label: 'Knowledge Base' },
    { path: '/conversations', icon: History, label: 'Conversations' },
    { path: '/customize', icon: Palette, label: 'Customize' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Bot size={28} />
            <span>PortaBot</span>
          </div>
        </div>

        <div className="bot-selector" onClick={() => setShowBotSelector(!showBotSelector)}>
          <div className="bot-selector-current">
            <div className="bot-avatar" style={{ backgroundColor: bot?.primaryColor }}>
              {bot?.name?.charAt(0) || 'B'}
            </div>
            <div className="bot-info">
              <span className="bot-name">{bot?.name || 'Select Bot'}</span>
              <span className="bot-company">{bot?.companyName || ''}</span>
            </div>
            <ChevronDown size={16} />
          </div>
          {showBotSelector && (
            <div className="bot-selector-dropdown">
              {bots.map(b => (
                <div key={b.id} className="bot-option" onClick={(e) => { e.stopPropagation(); selectBot(b.id); setShowBotSelector(false); }}>
                  <div className="bot-avatar-small" style={{ backgroundColor: b.primaryColor }}>{b.name.charAt(0)}</div>
                  <span>{b.name}</span>
                </div>
              ))}
              <div className="bot-option bot-option-create" onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}>
                <Plus size={16} />
                <span>Create New Bot</span>
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link to="/create" className="nav-item create-btn">
            <Sparkles size={20} />
            <span>Create AI Bot</span>
          </Link>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="embed-code">
            <span className="embed-label">Embed Code</span>
            <code>{`<script>window.PortaBotConfig={botId:"${bot?.id}"}</script><script src="https://cdn.portabot.io/w.js" async></script>`}</code>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Bot</h2>
            <p style={{ color: '#64748b', marginBottom: 20 }}>Add a new company or chatbot</p>
            
            <div className="input-group">
              <label className="input-label">Bot Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Support Bot"
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Company Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Acme Inc."
                value={newBotCompany}
                onChange={(e) => setNewBotCompany(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateBot} style={{ flex: 1 }}>
                Create Bot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;

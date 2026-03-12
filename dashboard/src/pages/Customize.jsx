import React, { useState, useEffect } from 'react';
import { useBot } from '../context/BotContext';
import { Eye, Check, X, MessageSquare, Send } from 'lucide-react';

function Customize() {
  const { bot, updateBot, loading } = useBot();
  const [config, setConfig] = useState({
    name: '',
    companyName: '',
    welcomeMessage: '',
    primaryColor: '#6366f1',
    theme: 'light',
    widgetSize: 'medium',
    position: 'bottom-right',
    language: 'en',
    showBranding: true,
    humanHandoff: true,
    collectEmail: false,
    companyUrl: ''
  });

  useEffect(() => {
    if (bot) {
      setConfig({
        name: bot.name || 'PortaBot',
        companyName: bot.companyName || 'My Company',
        welcomeMessage: bot.welcomeMessage || 'Hi! 👋 How can I help you today?',
        primaryColor: bot.primaryColor || '#6366f1',
        theme: bot.theme || 'light',
        widgetSize: bot.widgetSize || 'medium',
        position: bot.position || 'bottom-right',
        language: bot.language || 'en',
        showBranding: bot.showBranding !== false,
        humanHandoff: bot.humanHandoff !== false,
        collectEmail: bot.collectEmail || false,
        companyUrl: bot.companyUrl || ''
      });
    }
  }, [bot]);

  const handleSave = () => {
    updateBot(config);
  };

  const updateConfig = (key, value) => {
    setConfig({ ...config, [key]: value });
  };

  const SIZES = {
    small: { width: 280, height: 380 },
    medium: { width: 340, height: 460 },
    large: { width: 400, height: 540 }
  };

  const size = SIZES[config.widgetSize] || SIZES.medium;
  const isDark = config.theme === 'dark';
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#1e2937';
  const inputBg = isDark ? '#374151' : '#f3f4f6';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customize</h1>
        <p className="page-description">Personalize your widget - preview updates automatically</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24 }}>
        {/* Settings Panel */}
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title">🎨 Appearance</h3>
            </div>

            <div className="input-group">
              <label className="input-label">Bot Name</label>
              <input
                type="text"
                className="input-field"
                value={config.name}
                onChange={(e) => updateConfig('name', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Company Name</label>
              <input
                type="text"
                className="input-field"
                value={config.companyName}
                onChange={(e) => updateConfig('companyName', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Primary Color</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig('primaryColor', e.target.value)}
                  style={{ width: 50, height: 40, border: 'none', cursor: 'pointer', borderRadius: 8 }}
                />
                <input
                  type="text"
                  className="input-field"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig('primaryColor', e.target.value)}
                  style={{ width: 100 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateConfig('primaryColor', color)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: color,
                        border: config.primaryColor === color ? `2px solid ${textColor}` : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Theme</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['light', 'dark'].map(theme => (
                  <button
                    key={theme}
                    className={`btn ${config.theme === theme ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateConfig('theme', theme)}
                  >
                    {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Widget Size</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['small', 'medium', 'large'].map(s => (
                  <button
                    key={s}
                    className={`btn ${config.widgetSize === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateConfig('widgetSize', s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Position</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['bottom-right', 'bottom-left'].map(pos => (
                  <button
                    key={pos}
                    className={`btn ${config.position === pos ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateConfig('position', pos)}
                  >
                    {pos.includes('right') ? '↘ Right' : '↙ Left'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title">⚙️ Behavior</h3>
            </div>

            <div className="input-group">
              <label className="input-label">Welcome Message</label>
              <textarea
                className="input-field textarea-field"
                value={config.welcomeMessage}
                onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Language</label>
              <select
                className="input-field"
                value={config.language}
                onChange={(e) => updateConfig('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div className="toggle-row">
              <div>
                <div className="toggle-label">Show Branding</div>
                <div className="toggle-description">Show "Powered by PortaBot"</div>
              </div>
              <div
                className={`toggle ${config.showBranding ? 'active' : ''}`}
                onClick={() => updateConfig('showBranding', !config.showBranding)}
              >
                <div className="toggle-knob"></div>
              </div>
            </div>

            <div className="toggle-row">
              <div>
                <div className="toggle-label">Human Handoff</div>
                <div className="toggle-description">Allow "Talk to Human" button</div>
              </div>
              <div
                className={`toggle ${config.humanHandoff ? 'active' : ''}`}
                onClick={() => updateConfig('humanHandoff', !config.humanHandoff)}
              >
                <div className="toggle-knob"></div>
              </div>
            </div>

            <div className="toggle-row">
              <div>
                <div className="toggle-label">Collect Email</div>
                <div className="toggle-description">Ask for email before chat</div>
              </div>
              <div
                className={`toggle ${config.collectEmail ? 'active' : ''}`}
                onClick={() => updateConfig('collectEmail', !config.collectEmail)}
              >
                <div className="toggle-knob"></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📝 Embed Code</h3>
            </div>
            <pre style={{ background: '#1e293b', color: '#22d3ee', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: '11px' }}>
{`<script>
  window.PortaBotConfig = { 
    botId: "${bot?.id || 'YOUR_BOT_ID'}"
  };
</script>
<script src="https://cdn.portabot.io/w.js" async></script>`}
            </pre>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ marginTop: 20, width: '100%' }} 
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>

        {/* Live Preview Panel */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              background: isDark ? '#0f172a' : '#f8fafc', 
              padding: '12px 16px',
              borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: textColor }}>👁️ Live Preview</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Updates automatically</span>
            </div>
            
            {/* Preview Container */}
            <div style={{ 
              height: '500px', 
              background: isDark ? '#0f172a' : '#e2e8f0',
              position: 'relative',
              display: 'flex',
              justifyContent: config.position.includes('right') ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              padding: 16
            }}>
              {/* Chat Widget Preview */}
              <div style={{
                position: 'absolute',
                bottom: 16,
                right: config.position.includes('right') ? 16 : 'auto',
                left: config.position.includes('left') ? 16 : 'auto',
                width: size.width,
                height: size.height,
                background: bgColor,
                borderRadius: 16,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                {/* Header */}
                <div style={{
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: config.primaryColor,
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{config.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>Online</div>
                    </div>
                  </div>
                  <div style={{ width: 20, height: 20, cursor: 'pointer' }}>−</div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ maxWidth: '85%', alignSelf: 'flex-start' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      background: isDark ? '#374151' : '#f1f5f9',
                      color: textColor,
                      fontSize: 13,
                      lineHeight: 1.4
                    }}>
                      {config.welcomeMessage}
                    </div>
                  </div>

                  <div style={{ maxWidth: '85%', alignSelf: 'flex-end' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      background: config.primaryColor,
                      color: 'white',
                      fontSize: 13
                    }}>
                      How does shipping work?
                    </div>
                  </div>

                  <div style={{ maxWidth: '85%', alignSelf: 'flex-start' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      background: isDark ? '#374151' : '#f1f5f9',
                      color: textColor,
                      fontSize: 13
                    }}>
                      We offer free standard shipping on orders over $50...
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  padding: 12,
                  borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}>
                  <input 
                    type="text" 
                    placeholder="Type your message..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                      borderRadius: 8,
                      background: inputBg,
                      color: textColor,
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <button style={{
                    width: 36,
                    height: 36,
                    border: 'none',
                    borderRadius: 8,
                    background: config.primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}>
                    <Send size={16} color="white" />
                  </button>
                </div>

                {config.showBranding && (
                  <div style={{
                    textAlign: 'center',
                    padding: 6,
                    fontSize: 10,
                    color: '#94a3b8',
                    background: isDark ? '#1e293b' : '#f8fafc'
                  }}>
                    Powered by <a href="#" style={{ color: config.primaryColor }}>PortaBot</a>
                  </div>
                )}
              </div>

              {/* Launcher Button */}
              <div style={{
                position: 'absolute',
                bottom: config.position.includes('right') ? 16 : 'auto',
                top: config.position.includes('right') ? 'auto' : 16,
                right: config.position.includes('right') ? 16 : 'auto',
                left: config.position.includes('left') ? 16 : 'auto',
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: config.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px ${config.primaryColor}66`,
                cursor: 'pointer'
              }}>
                <MessageSquare size={24} color="white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customize;

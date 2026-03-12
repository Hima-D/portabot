import React, { useState, useEffect } from 'react';
import { useBot } from '../context/BotContext';
import { Key, Shield, Bell, Database, Webhook, Save, Plus, Trash2, Copy, Check } from 'lucide-react';

function Settings() {
  const { bot, updateBot, loading } = useBot();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  const [settings, setSettings] = useState({
    allowedDomains: '',
    piiRedaction: false,
    zeroRetention: false,
    dataRetentionDays: '30',
    emailNotifications: true,
    analyticsReports: true,
    knowledgeGapAlerts: true,
    slackWebhook: '',
    zapierWebhook: '',
    customInstructions: bot?.customInstructions || '',
    companyUrl: bot?.companyUrl || ''
  });

  useEffect(() => {
    if (bot) {
      setSettings({
        allowedDomains: (bot.allowedDomains || []).join('\n'),
        piiRedaction: bot.piiRedaction || false,
        zeroRetention: bot.zeroRetention || false,
        dataRetentionDays: String(bot.dataRetentionDays || 30),
        emailNotifications: bot.emailNotifications !== false,
        analyticsReports: bot.analyticsReports !== false,
        knowledgeGapAlerts: bot.knowledgeGapAlerts !== false,
        slackWebhook: bot.slackWebhook || '',
        zapierWebhook: bot.zapierWebhook || '',
        customInstructions: bot.customInstructions || '',
        companyUrl: bot.companyUrl || ''
      });
    }
    fetchApiKeys();
  }, [bot?.id]);

  const fetchApiKeys = async () => {
    if (!bot?.id) return;
    try {
      const res = await fetch(`/api/v1/bots/${bot.id}/api-keys`);
      const data = await res.json();
      setApiKeys(data.apiKeys || []);
    } catch (e) {
      console.error('Failed to fetch API keys:', e);
    }
  };

  const handleSave = () => {
    const updates = {
      allowedDomains: settings.allowedDomains.split('\n').filter(d => d.trim()),
      piiRedaction: settings.piiRedaction,
      zeroRetention: settings.zeroRetention,
      dataRetentionDays: parseInt(settings.dataRetentionDays),
      emailNotifications: settings.emailNotifications,
      analyticsReports: settings.analyticsReports,
      knowledgeGapAlerts: settings.knowledgeGapAlerts,
      slackWebhook: settings.slackWebhook,
      zapierWebhook: settings.zapierWebhook,
      customInstructions: settings.customInstructions,
      companyUrl: settings.companyUrl
    };
    updateBot(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const createApiKey = async () => {
    if (!bot?.id) return;
    try {
      const res = await fetch(`/api/v1/bots/${bot.id}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Key' })
      });
      const data = await res.json();
      setApiKeys([...apiKeys, data]);
    } catch (e) {
      console.error('Failed to create API key:', e);
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!bot?.id) return;
    try {
      await fetch(`/api/v1/bots/${bot.id}/api-keys/${keyId}`, { method: 'DELETE' });
      setApiKeys(apiKeys.filter(k => k.key !== keyId));
    } catch (e) {
      console.error('Failed to delete API key:', e);
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs = [
    { id: 'general', icon: Database, label: 'General' },
    { id: 'api', icon: Key, label: 'API & Keys' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'integrations', icon: Webhook, label: 'Integrations' }
  ];

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Configure your bot and account settings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        <div className="settings-nav">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </div>
          ))}
        </div>

        <div className="settings-content">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">General Settings</h3>
              </div>

              <div className="input-group">
                <label className="input-label">Company URL</label>
                <input
                  type="url"
                  className="input-field"
                  value={settings.companyUrl}
                  onChange={(e) => updateSetting('companyUrl', e.target.value)}
                  placeholder="https://yourcompany.com"
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  This URL will be used for the branding link in the widget
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Custom Instructions</label>
                <textarea
                  className="input-field textarea-field"
                  value={settings.customInstructions}
                  onChange={(e) => updateSetting('customInstructions', e.target.value)}
                  placeholder="Add any special instructions for your bot..."
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  These instructions will be appended to the bot's system prompt
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Data Retention (days)</label>
                <select
                  className="input-field"
                  value={settings.dataRetentionDays}
                  onChange={(e) => updateSetting('dataRetentionDays', e.target.value)}
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="0">Forever</option>
                </select>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={18} />
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* API & Keys Tab */}
          {activeTab === 'api' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">API Keys</h3>
                <button className="btn btn-primary" onClick={createApiKey}>
                  <Plus size={18} />
                  Create Key
                </button>
              </div>

              <p style={{ color: '#64748b', marginBottom: 16 }}>
                API keys provide full access to your bot's API. Keep them secret!
              </p>

              {apiKeys.length === 0 ? (
                <div className="empty-state">
                  <Key size={48} />
                  <h3>No API keys</h3>
                  <p>Create an API key to access your bot programmatically</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Key</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map(key => (
                      <tr key={key.key}>
                        <td>{key.name}</td>
                        <td>
                          <code style={{ fontSize: 11, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                            {key.key.substring(0, 20)}...
                          </code>
                          <button
                            onClick={() => copyKey(key.key)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                          >
                            {copiedKey === key.key ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          </button>
                        </td>
                        <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                        <td>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <button className="btn-icon" onClick={() => deleteApiKey(key.key)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Security Settings</h3>
              </div>

              <div className="input-group">
                <label className="input-label">Allowed Domains</label>
                <textarea
                  className="input-field textarea-field"
                  value={settings.allowedDomains}
                  onChange={(e) => updateSetting('allowedDomains', e.target.value)}
                  placeholder="example.com&#10;localhost:3000&#10;yoursite.com"
                  rows={4}
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  Widget will only load on these domains. One per line. Leave empty to allow all.
                </p>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">PII Redaction</div>
                  <div className="toggle-description">Automatically redact personal information (emails, phone numbers)</div>
                </div>
                <div
                  className={`toggle ${settings.piiRedaction ? 'active' : ''}`}
                  onClick={() => updateSetting('piiRedaction', !settings.piiRedaction)}
                >
                  <div className="toggle-knob"></div>
                </div>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Zero Retention</div>
                  <div className="toggle-description">Don't store conversations (completely private)</div>
                </div>
                <div
                  className={`toggle ${settings.zeroRetention ? 'active' : ''}`}
                  onClick={() => updateSetting('zeroRetention', !settings.zeroRetention)}
                >
                  <div className="toggle-knob"></div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={18} />
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Notification Preferences</h3>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Email Notifications</div>
                  <div className="toggle-description">Receive email for important events</div>
                </div>
                <div
                  className={`toggle ${settings.emailNotifications ? 'active' : ''}`}
                  onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                >
                  <div className="toggle-knob"></div>
                </div>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Analytics Reports</div>
                  <div className="toggle-description">Weekly analytics digest</div>
                </div>
                <div
                  className={`toggle ${settings.analyticsReports ? 'active' : ''}`}
                  onClick={() => updateSetting('analyticsReports', !settings.analyticsReports)}
                >
                  <div className="toggle-knob"></div>
                </div>
              </div>

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Knowledge Gap Alerts</div>
                  <div className="toggle-description">Alert when bot can't find answers</div>
                </div>
                <div
                  className={`toggle ${settings.knowledgeGapAlerts ? 'active' : ''}`}
                  onClick={() => updateSetting('knowledgeGapAlerts', !settings.knowledgeGapAlerts)}
                >
                  <div className="toggle-knob"></div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={18} />
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Integrations</h3>
              </div>

              <div className="input-group">
                <label className="input-label">Slack Webhook URL</label>
                <input
                  type="url"
                  className="input-field"
                  value={settings.slackWebhook}
                  onChange={(e) => updateSetting('slackWebhook', e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  Send notifications to Slack when users chat with your bot
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Zapier Webhook URL</label>
                <input
                  type="url"
                  className="input-field"
                  value={settings.zapierWebhook}
                  onChange={(e) => updateSetting('zapierWebhook', e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  Connect to 5000+ apps via Zapier
                </p>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={18} />
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;

(function() {
  'use strict';

  const DEFAULT_CONFIG = {
    position: 'bottom-right',
    primaryColor: '#6366f1',
    botName: 'PortaBot',
    welcomeMessage: 'Hi! 👋 How can I help you today?',
    placeholder: 'Type your question...',
    showBranding: true,
    autoOpen: false,
    autoOpenDelay: 5000,
    language: 'en',
    humanHandoff: true,
    collectEmail: false,
    theme: 'light',
    widgetSize: 'medium'
  };

  const SIZES = {
    small: { width: 300, height: 400 },
    medium: { width: 380, height: 500 },
    large: { width: 450, height: 600 }
  };

  class PortaBotWidget {
    constructor(config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.isOpen = false;
      this.messages = [];
      this.sessionId = this._generateSessionId();
      this.email = null;
      this.isTyping = false;
      this.apiBase = this.config.apiBase || 'https://api.portabot.io';
      this._init();
    }

    _generateSessionId() {
      return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    _init() {
      this._createLauncher();
      this._createWidget();
      this._bindEvents();
      if (this.config.autoOpen) {
        setTimeout(() => this.open(), this.config.autoOpenDelay);
      }
    }

    _createLauncher() {
      const launcher = document.createElement('div');
      launcher.id = 'portabot-launcher';
      launcher.innerHTML = `
        <div class="portabot-launcher-button" style="background-color: ${this.config.primaryColor}">
          <svg class="portabot-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <svg class="portabot-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        ${this.config.showLabel ? `<span class="portabot-launcher-label" style="background-color: ${this.config.primaryColor}">${this.config.botName}</span>` : ''}
      `;
      launcher.style.cssText = `
        position: fixed;
        ${this.config.position.includes('right') ? 'right: 20px' : 'left: 20px'};
        bottom: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: ${this.config.position.includes('right') ? 'flex-end' : 'flex-start'};
        gap: 8px;
        font-family: ${this.config.fontFamily || 'Inter, system-ui, sans-serif'};
      `;
      document.body.appendChild(launcher);
      this.launcher = launcher;
    }

    _createWidget() {
      const size = SIZES[this.config.widgetSize] || SIZES.medium;
      const isDark = this.config.theme === 'dark';
      const bgColor = isDark ? '#1f2937' : '#ffffff';
      const textColor = isDark ? '#f9fafb' : '#1f2937';
      const inputBg = isDark ? '#374151' : '#f3f4f6';

      const widget = document.createElement('div');
      widget.id = 'portabot-widget';
      widget.innerHTML = `
        <div class="portabot-header" style="background-color: ${this.config.primaryColor}">
          <div class="portabot-header-content">
            <div class="portabot-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div class="portabot-header-info">
              <span class="portabot-bot-name">${this.config.botName}</span>
              <span class="portabot-status">Online</span>
            </div>
          </div>
          <button class="portabot-minimize-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        <div class="portabot-messages"></div>
        <div class="portabot-email-form" style="display: none">
          <input type="email" placeholder="Enter your email" class="portabot-email-input" />
          <button class="portabot-email-submit">Continue</button>
        </div>
        <div class="portabot-input-area">
          <textarea class="portabot-input" placeholder="${this.config.placeholder}" rows="1"></textarea>
          <button class="portabot-send-btn" style="background-color: ${this.config.primaryColor}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        ${this.config.humanHandoff ? '<button class="portabot-human-btn">Talk to Human</button>' : ''}
        ${this.config.showBranding ? `<div class="portabot-branding">Powered by <a href="${this.config.companyUrl || 'https://portabot.io'}" target="_blank">PortaBot</a></div>` : ''}
      `;

      widget.style.cssText = `
        position: absolute;
        ${this.config.position.includes('right') ? 'right: 0' : 'left: 0'};
        bottom: 70px;
        width: ${size.width}px;
        height: ${size.height}px;
        background: ${bgColor};
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: ${this.config.fontFamily || 'Inter, system-ui, sans-serif'};
        color: ${textColor};
        transition: opacity 0.2s ease;
      `;

      const messagesContainer = widget.querySelector('.portabot-messages');
      messagesContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      `;

      const inputArea = widget.querySelector('.portabot-input-area');
      inputArea.style.cssText = `
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        background: ${bgColor};
      `;

      const input = widget.querySelector('.portabot-input');
      input.style.cssText = `
        flex: 1;
        padding: 12px;
        border: 1px solid ${isDark ? '#4b5563' : '#d1d5db'};
        border-radius: 12px;
        background: ${inputBg};
        color: ${textColor};
        font-size: 14px;
        resize: none;
        outline: none;
        font-family: inherit;
      `;

      const sendBtn = widget.querySelector('.portabot-send-btn');
      sendBtn.style.cssText = `
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.1s;
      `;

      const header = widget.querySelector('.portabot-header');
      header.style.cssText = `
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: white;
      `;

      const launcherBtn = this.launcher.querySelector('.portabot-launcher-button');
      launcherBtn.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px ${this.config.primaryColor}66;
        transition: transform 0.2s;
      `;

      launcherBtn.querySelector('svg').style.cssText = `
        width: 28px;
        height: 28px;
        color: white;
      `;

      document.body.appendChild(widget);
      this.widget = widget;
    }

    _bindEvents() {
      const launcher = this.launcher.querySelector('.portabot-launcher-button');
      launcher.addEventListener('click', () => this.toggle());

      const minimizeBtn = this.widget.querySelector('.portabot-minimize-btn');
      minimizeBtn.addEventListener('click', () => this.close());

      const sendBtn = this.widget.querySelector('.portabot-send-btn');
      sendBtn.addEventListener('click', () => this.sendMessage());

      const input = this.widget.querySelector('.portabot-input');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });

      if (this.config.humanHandoff) {
        const humanBtn = this.widget.querySelector('.portabot-human-btn');
        humanBtn.addEventListener('click', () => this.requestHumanHandoff());
      }

      if (this.config.collectEmail) {
        const emailForm = this.widget.querySelector('.portabot-email-form');
        const emailSubmit = this.widget.querySelector('.portabot-email-submit');
        emailSubmit.addEventListener('click', () => {
          const emailInput = emailForm.querySelector('.portabot-email-input');
          if (emailInput.value && emailInput.value.includes('@')) {
            this.email = emailInput.value;
            emailForm.style.display = 'none';
            this.addMessage({ type: 'system', text: `Thanks! We've saved your email as ${this.email}` });
          }
        });
      }
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.widget.style.display = 'flex';
      this.launcher.querySelector('.portabot-icon-open').style.display = 'none';
      this.launcher.querySelector('.portabot-icon-close').style.display = 'block';
      
      if (this.messages.length === 0) {
        this.addMessage({ type: 'bot', text: this.config.welcomeMessage });
        this._trackEvent('widget_opened');
      }
      
      setTimeout(() => {
        this.widget.querySelector('.portabot-input').focus();
      }, 100);
    }

    close() {
      this.isOpen = false;
      this.widget.style.display = 'none';
      this.launcher.querySelector('.portabot-icon-open').style.display = 'block';
      this.launcher.querySelector('.portabot-icon-close').style.display = 'none';
    }

    addMessage(message) {
      const messagesContainer = this.widget.querySelector('.portabot-messages');
      const messageEl = document.createElement('div');
      messageEl.className = `portabot-message portabot-message-${message.type}`;
      
      const isBot = message.type === 'bot';
      messageEl.style.cssText = `
        max-width: 85%;
        padding: 12px 16px;
        border-radius: ${isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px'};
        background: ${isBot ? (this.config.theme === 'dark' ? '#374151' : '#f3f4f6') : this.config.primaryColor};
        color: ${isBot ? (this.config.theme === 'dark' ? '#f9fafb' : '#1f2937') : 'white'};
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
        animation: portabot-fade-in 0.3s ease;
      `;

      if (message.sources && message.sources.length > 0) {
        const sourcesText = message.sources.map(s => `📄 ${s.source}`).join('\n');
        messageEl.innerHTML = `<div>${message.text}</div><div style="font-size:11px;opacity:0.7;margin-top:8px;border-top:1px solid currentColor;padding-top:8px">Sources:\n${sourcesText}</div>`;
      } else {
        messageEl.textContent = message.text;
      }

      messagesContainer.appendChild(messageEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      this.messages.push(message);
    }

    showTyping() {
      this.isTyping = true;
      const messagesContainer = this.widget.querySelector('.portabot-messages');
      const typingEl = document.createElement('div');
      typingEl.className = 'portabot-typing';
      typingEl.style.cssText = `
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 16px 16px 16px 4px;
        background: ${this.config.theme === 'dark' ? '#374151' : '#f3f4f6'};
        display: flex;
        gap: 4px;
      `;
      
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
          width: 8px;
          height: 8px;
          background: ${this.config.theme === 'dark' ? '#9ca3af' : '#9ca3af'};
          border-radius: 50%;
          animation: portabot-bounce 1.4s infinite ease-in-out;
          animation-delay: ${i * 0.2}s;
        `;
        typingEl.appendChild(dot);
      }
      
      messagesContainer.appendChild(typingEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      this.typingEl = typingEl;
    }

    hideTyping() {
      this.isTyping = false;
      if (this.typingEl) {
        this.typingEl.remove();
        this.typingEl = null;
      }
    }

    async sendMessage() {
      const input = this.widget.querySelector('.portabot-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      input.value = '';
      input.style.height = 'auto';
      
      this.addMessage({ type: 'user', text: message });
      this._trackEvent('message_sent', { message });
      
      this.showTyping();
      
      try {
        const response = await fetch(`${this.apiBase}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Bot-Id': this.config.botId
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            message,
            email: this.email,
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        this.hideTyping();
        
        const data = await response.json();
        this.addMessage({ 
          type: 'bot', 
          text: data.message,
          sources: data.sources
        });
        this._trackEvent('message_received', { sources: data.sources?.length || 0 });
        
      } catch (error) {
        this.hideTyping();
        this.addMessage({ 
          type: 'bot', 
          text: "I'm sorry, I encountered an error. Please try again later." 
        });
        console.error('PortaBot error:', error);
      }
    }

    async requestHumanHandoff() {
      this.addMessage({ type: 'system', text: 'Connecting you with a human agent... Please wait.' });
      this._trackEvent('human_handoff_requested');
      
      try {
        await fetch(`${this.apiBase}/api/v1/handoff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Bot-Id': this.config.botId
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            email: this.email
          })
        });
        
        this.addMessage({ 
          type: 'system', 
          text: 'A human agent will be with you shortly. In the meantime, is there anything else I can help with?' 
        });
      } catch (error) {
        this.addMessage({ 
          type: 'system', 
          text: 'Unable to connect to human agent. Please try again or contact support directly.' 
        });
      }
    }

    _trackEvent(eventName, data = {}) {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          `${this.apiBase}/api/v1/analytics`,
          JSON.stringify({
            event: eventName,
            botId: this.config.botId,
            sessionId: this.sessionId,
            ...data,
            timestamp: new Date().toISOString()
          })
        );
      }
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes portabot-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes portabot-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    .portabot-launcher-button:hover { transform: scale(1.05); }
    .portabot-send-btn:hover { transform: scale(1.05); }
    .portabot-human-btn {
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 8px 16px;
      margin: 0 16px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    .portabot-human-btn:hover { background: #fef2f2; }
    .portabot-branding {
      text-align: center;
      padding: 8px;
      font-size: 11px;
      color: #9ca3af;
      background: #f9fafb;
    }
    .portabot-branding a { color: #6b7280; }
    .portabot-email-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .portabot-email-input {
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
    }
    .portabot-email-submit {
      padding: 10px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    .portabot-minimize-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
    }
    .portabot-minimize-btn svg { width: 20px; height: 20px; color: white; }
  `;
  document.head.appendChild(style);

  function initPortaBot() {
    const config = window.PortaBotConfig || {};
    const scriptTag = document.querySelector('script[data-bot-id]');
    
    if (scriptTag && scriptTag.dataset.botId) {
      config.botId = scriptTag.dataset.botId;
    }
    
    if (!config.botId) {
      console.error('PortaBot: botId is required');
      return;
    }

    window.portabot = new PortaBotWidget(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortaBot);
  } else {
    initPortaBot();
  }

})();

import React, { useState } from 'react';
import { useBot } from '../context/BotContext';
import { Bot, Globe, Code, Check, Copy, Sparkles, ArrowRight, Shield, Zap, MessageSquare } from 'lucide-react';
import './AIBuilder.css';

function AIBuilder() {
  const { bot, createBot, updateBot } = useBot();
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [domain, setDomain] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    
    // Simulate AI generating bot config based on prompt
    setTimeout(() => {
      const config = generateBotConfig(prompt);
      setGenerated(config);
      setGenerating(false);
      setStep(2);
    }, 2000);
  };

  const generateBotConfig = (userPrompt) => {
    const promptLower = userPrompt.toLowerCase();
    
    let name = "AI Assistant";
    let companyName = "Your Company";
    let tone = "friendly";
    let greeting = "Hi! 👋 How can I help you today?";
    let personality = {
      name: "Assistant",
      tone: "friendly",
      greeting: "Hi! 👋",
      traits: ["helpful", "professional", "patient"],
      emojiStyle: "minimal",
      responseStyle: "concise"
    };
    
    if (promptLower.includes('support')) {
      personality.tone = "support";
      personality.greeting = "Hello! I'm here to help.";
      personality.traits = ["empathetic", "patient", "thorough"];
    } else if (promptLower.includes('sales') || promptLower.includes('product')) {
      personality.tone = "friendly";
      personality.greeting = "Hey there! 😊 Let me show you around!";
      personality.traits = ["enthusiastic", "knowledgeable", "helpful"];
    } else if (promptLower.includes('formal') || promptLower.includes('business')) {
      personality.tone = "professional";
      personality.greeting = "Good day. How may I assist you?";
      personality.traits = ["formal", "precise", "respectful"];
    }
    
    if (promptLower.includes('ecommerce') || promptLower.includes('shop')) {
      companyName = "Our Store";
      greeting = "Welcome! 🛍️ Need help finding something?";
    } else if (promptLower.includes('saas') || promptLower.includes('software')) {
      companyName = "Our Platform";
      greeting = "Welcome! 🚀 Let me help you get started.";
    }
    
    return {
      name,
      companyName,
      welcomeMessage: greeting,
      personality,
      suggestedKnowledge: generateKnowledgeSuggestions(promptLower)
    };
  };

  const generateKnowledgeSuggestions = (prompt) => {
    const suggestions = [];
    if (prompt.includes('product')) {
      suggestions.push("Product descriptions and features");
      suggestions.push("Pricing information");
      suggestions.push("Comparison with competitors");
    }
    if (prompt.includes('support')) {
      suggestions.push("FAQ and troubleshooting guides");
      suggestions.push("Return and refund policies");
      suggestions.push("Contact information");
    }
    if (prompt.includes('shipping') || promptLower.includes('deliver')) {
      suggestions.push("Shipping options and costs");
      suggestions.push("Delivery timeframes");
      suggestions.push("International shipping");
    }
    if (prompt.includes('pricing') || prompt.includes('cost')) {
      suggestions.push("Pricing plans");
      suggestions.push("Discounts and promotions");
      suggestions.push("Payment methods");
    }
    if (suggestions.length === 0) {
      suggestions.push("Company information");
      suggestions.push("Products or services");
      suggestions.push("Contact details");
    }
    return suggestions;
  };

  const handleCreateBot = async () => {
    if (!generated) return;
    
    const newBot = await createBot({
      name: generated.name,
      companyName: generated.companyName,
      welcomeMessage: generated.welcomeMessage,
      botPersonality: generated.personality
    });
    
    setStep(3);
  };

  const handleVerifyDomain = async () => {
    if (!domain.trim()) return;
    setVerifying(true);
    
    // Simulate domain verification
    setTimeout(() => {
      setVerified(true);
      setVerifying(false);
    }, 1500);
  };

  const getEmbedCode = () => {
    const botId = bot?.id || 'YOUR_BOT_ID';
    return `<script>
  window.PortaBotConfig = { 
    botId: "${botId}",
    apiBase: "https://api.portabot.io"
  };
</script>
<script src="https://cdn.portabot.io/w.js" async></script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-builder">
      <div className="page-header">
        <h1 className="page-title">
          <Sparkles className="sparkle-icon" />
          AI Bot Builder
        </h1>
        <p className="page-description">
          Describe what you want your bot to do, and we'll create it instantly
        </p>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Describe</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Review</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Deploy</div>
        </div>
      </div>

      {/* Step 1: Describe */}
      {step === 1 && (
        <div className="step-content">
          <div className="prompt-card">
            <label className="input-label">
              What should your bot do? Be as descriptive as you'd like!
            </label>
            <textarea
              className="prompt-input"
              placeholder="e.g., I want a customer support bot for my SaaS product that helps users with billing questions, technical issues, and feature requests. It should be friendly but professional."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
            />
            
            <div className="prompt-suggestions">
              <span>Try:</span>
              <button onClick={() => setPrompt("Customer support bot for an e-commerce store that helps with order tracking, returns, and product questions")}>
                🛒 E-commerce Support
              </button>
              <button onClick={() => setPrompt("SaaS onboarding assistant that guides new users through setup, explains features, and answers pricing questions")}>
                🚀 SaaS Onboarding
              </button>
              <button onClick={() => setPrompt("Hotel booking assistant that helps guests with reservations, amenities, and local recommendations")}>
                🏨 Hotel Concierge
              </button>
            </div>

            <button 
              className="btn btn-primary generate-btn"
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
            >
              {generating ? (
                <>
                  <span className="loading-spinner"></span>
                  Generating your bot...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Generate Bot
                </>
              )}
            </button>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <Bot size={32} />
              <h3>Smart Responses</h3>
              <p>AI understands context and provides accurate answers</p>
            </div>
            <div className="feature-card">
              <Shield size={32} />
              <h3>Domain Verified</h3>
              <p>Secure your bot with domain verification</p>
            </div>
            <div className="feature-card">
              <Code size={32} />
              <h3>Easy Embed</h3>
              <p>One script tag to add anywhere</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && generated && (
        <div className="step-content">
          <div className="review-card">
            <div className="review-header">
              <Bot size={48} className="bot-icon" />
              <div>
                <h2>{generated.name}</h2>
                <p>{generated.companyName}</p>
              </div>
            </div>

            <div className="review-section">
              <h3>🤖 Personality</h3>
              <div className="personality-tags">
                <span className="tag">{generated.personality.tone}</span>
                {generated.personality.traits.map(trait => (
                  <span key={trait} className="tag tag-outline">{trait}</span>
                ))}
              </div>
            </div>

            <div className="review-section">
              <h3>💬 Welcome Message</h3>
              <p className="welcome-preview">{generated.welcomeMessage}</p>
            </div>

            <div className="review-section">
              <h3>📚 Suggested Knowledge Base</h3>
              <ul className="knowledge-list">
                {generated.suggestedKnowledge.map((item, i) => (
                  <li key={i}>
                    <Check size={16} className="check-icon" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="review-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={handleCreateBot}>
                Create Bot →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Deploy */}
      {step === 3 && (
        <div className="step-content">
          <div className="deploy-card">
            <div className="success-header">
              <div className="success-icon">🎉</div>
              <h2>Your Bot is Ready!</h2>
              <p>Now let's verify your domain and get you the embed code</p>
            </div>

            {/* Domain Verification */}
            <div className="domain-section">
              <h3>
                <Globe size={20} />
                Domain Verification
              </h3>
              <p className="domain-desc">
                Verify your domain to prevent unauthorized use and enable security features
              </p>
              
              <div className="domain-input-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="yourdomain.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <button 
                  className="btn btn-secondary"
                  onClick={handleVerifyDomain}
                  disabled={!domain.trim() || verifying || verified}
                >
                  {verifying ? 'Verifying...' : verified ? '✓ Verified' : 'Verify'}
                </button>
              </div>

              {verified && (
                <div className="verified-badge">
                  <Shield size={16} />
                  {domain} is verified ✓
                </div>
              )}

              <div className="domain-methods">
                <details>
                  <summary>How to verify your domain:</summary>
                  <div className="method-content">
                    <p><strong>Method 1:</strong> Add a TXT record to your DNS</p>
                    <code>portabot-verify=yourdomain.com</code>
                    <p><strong>Method 2:</strong> Upload a verification file to your website</p>
                    <code>/portabot-verify.html</code>
                  </div>
                </details>
              </div>
            </div>

            {/* Embed Code */}
            <div className="embed-section">
              <h3>
                <Code size={20} />
                Your Embed Code
              </h3>
              <p className="embed-desc">
                Copy and paste this code into your website's HTML, just before the closing {'</body>'} tag
              </p>
              
              <div className="embed-code-box">
                <pre>{getEmbedCode()}</pre>
                <button className="copy-btn" onClick={copyToClipboard}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="platform-install">
                <h4>Quick Install for:</h4>
                <div className="platform-buttons">
                  <button className="platform-btn">WordPress</button>
                  <button className="platform-btn">Shopify</button>
                  <button className="platform-btn">Webflow</button>
                  <button className="platform-btn">React</button>
                  <button className="platform-btn">Next.js</button>
                </div>
              </div>
            </div>

            <div className="next-steps">
              <h3>📋 Next Steps</h3>
              <ol>
                <li>Add the embed code to your website</li>
                <li>Configure your knowledge base with documents</li>
                <li>Test the widget</li>
                <li>View conversations in the dashboard</li>
              </ol>
              <button className="btn btn-primary" onClick={() => window.location.href = '/knowledge'}>
                Go to Knowledge Base →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIBuilder;

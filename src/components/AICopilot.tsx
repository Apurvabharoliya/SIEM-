import React, { useState } from 'react';
import { Bot, Send, X, TerminalSquare } from 'lucide-react';
import './AICopilot.css';

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICopilot({ isOpen, onClose }: AICopilotProps) {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'SentinelIQ AI Assistant online. How can I assist with your threat hunting today?' }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const query = input;
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      let response = "I've analyzed the recent logs. No immediate anomalies detected in the current timeframe.";
      if (query.toLowerCase().includes('sql') || query.toLowerCase().includes('brute')) {
        response = "I see multiple SQL Injection attempts originating from 45.22.19.11. I recommend updating the WAF ruleset to block this IP subnet immediately.";
      }
      setMessages(prev => [...prev, { role: 'system', content: response }]);
    }, 1000);
  };

  return (
    <div className="ai-copilot-panel animate-slide-in">
      <div className="copilot-header">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-cyan" />
          <h3>Sentinel AI Copilot</h3>
        </div>
        <button onClick={onClose} className="btn-icon">
          <X size={18} />
        </button>
      </div>
      
      <div className="copilot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role === 'user' ? 'message-user' : 'message-system'}`}>
            {msg.role === 'system' && <TerminalSquare size={14} className="message-icon" />}
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      
      <div className="copilot-input-area">
        <input 
          type="text" 
          placeholder="Ask Sentinel AI to analyze threats..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="btn-send" onClick={handleSend}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

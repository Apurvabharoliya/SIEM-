import { useState } from 'react';
import { Bot, Send, X, TerminalSquare } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import './AICopilot.css';

interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICopilot({ isOpen, onClose }: AICopilotProps) {
  const { metrics, threats, incidents } = useGlobalState();
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
      const q = query.toLowerCase();

      if (q.includes('status') || q.includes('report') || q.includes('summary')) {
        response = `Current SOC Status: We are processing ${metrics.eventsPerSecond} events per second across ${metrics.activeEndpoints} endpoints. There are currently ${metrics.criticalAlerts} critical alerts requiring attention.`;
      } else if (q.includes('threat') || q.includes('attack') || q.includes('sql') || q.includes('brute')) {
        const criticalThreats = threats.filter(t => t.severity === 'Critical' || t.severity === 'High');
        if (criticalThreats.length > 0) {
           const latest = criticalThreats[0];
           response = `I've identified ${criticalThreats.length} high/critical threats. The most recent is a [${latest.type}] from ${latest.source}. I recommend investigating this in the Incidents module.`;
        } else {
           response = "I don't see any critical threats in the recent timeline. The environment appears stable.";
        }
      } else if (q.includes('incident') || q.includes('case') || q.includes('open')) {
        const openIncidents = incidents.filter(i => i.status === 'Open');
        if (openIncidents.length > 0) {
           response = `You have ${openIncidents.length} open incidents. The most recent one is "${openIncidents[0].title}". You should assign this to an analyst immediately.`;
        } else {
           response = "There are no open incidents at this time. Great job keeping the queue clean!";
        }
      } else if (metrics.criticalAlerts > 0) {
        response = `I'm monitoring the environment. Please note we have ${metrics.criticalAlerts} critical alerts pending review. Let me know if you want me to analyze a specific vector.`;
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

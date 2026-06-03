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
    
    // Call backend AI API
    const fetchAIResponse = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: query,
            context: { metrics, threats, incidents }
          })
        });

        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        setMessages(prev => [...prev, { role: 'system', content: data.response }]);
      } catch (error) {
        console.error('Failed to get AI response:', error);
        setMessages(prev => [...prev, { role: 'system', content: 'Connection to Sentinel AI backend failed. Please check network status.' }]);
      }
    };

    fetchAIResponse();
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

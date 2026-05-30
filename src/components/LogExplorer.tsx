import { useState } from 'react';
import { Search, Filter, Download, Terminal, Play, Pause, ChevronDown } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import './LogExplorer.css';

export function LogExplorer() {
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { logs } = useGlobalState();
  
  return (
    <div className="log-explorer animate-fade-in">
      <header className="log-header stagger-1">
        <div>
          <h2>Log Explorer & Analytics</h2>
          <p className="text-muted">Query, parse, and analyze system events in real-time</p>
        </div>
        <div className="log-actions flex gap-4">
          <button className={`btn-action flex items-center gap-2 ${isLive ? 'active-live' : ''}`} onClick={() => setIsLive(!isLive)}>
            {isLive ? <Pause size={16} /> : <Play size={16} />}
            {isLive ? 'Pause Live Stream' : 'Go Live'}
          </button>
          <button className="btn-action flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      <div className="search-bar-container stagger-2 glass-panel">
        <div className="search-input-wrapper">
          <Search size={20} className="text-muted search-icon" />
          <input 
            type="text" 
            placeholder="Search logs using KQL or Lucene syntax (e.g., source:WAF AND level:CRITICAL)..." 
            className="search-input mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="search-filters">
          <button className="filter-btn flex items-center gap-2">
            <Filter size={16} /> Filters <ChevronDown size={14} />
          </button>
          <button className="filter-btn flex items-center gap-2">
            Last 15 Minutes <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="log-viewer glass-panel stagger-3">
        <div className="log-viewer-header">
          <Terminal size={18} className="text-cyan" />
          <span>System Stream</span>
          <span className="log-count text-muted">{logs.length} events matched</span>
        </div>
        
        <div className="log-table-container">
          <table className="log-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Level</th>
                <th>Source</th>
                <th>Message</th>
                <th>Path / Context</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="log-row">
                  <td className="mono text-muted whitespace-nowrap">{log.timestamp}</td>
                  <td>
                    <span className={`log-level level-${log.level.toLowerCase()}`}>
                      {log.level}
                    </span>
                  </td>
                  <td><span className="source-badge">{log.source}</span></td>
                  <td className="log-message">{log.message}</td>
                  <td className="mono text-muted truncate-path" title={log.path}>{log.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

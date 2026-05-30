import { useState } from 'react';
import { Search, Filter, Download, Terminal, Play, Pause, ChevronDown } from 'lucide-react';
import './LogExplorer.css';

const MOCK_LOGS = [
  { id: 1, timestamp: '2026-05-30T10:12:45Z', source: 'WAF', level: 'CRITICAL', message: 'SQL Injection attempt detected from 45.22.19.11', path: '/api/v1/auth/login' },
  { id: 2, timestamp: '2026-05-30T10:12:44Z', source: 'System', level: 'INFO', message: 'User admin successfully authenticated', path: '/api/v1/auth/login' },
  { id: 3, timestamp: '2026-05-30T10:12:42Z', source: 'EDR', level: 'WARNING', message: 'Suspicious PowerShell script execution blocked', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' },
  { id: 4, timestamp: '2026-05-30T10:12:35Z', source: 'Network', level: 'INFO', message: 'Connection established with 192.168.1.50', path: '-' },
  { id: 5, timestamp: '2026-05-30T10:12:30Z', source: 'Database', level: 'ERROR', message: 'Connection pool exhausted, waiting for available connection', path: 'db-cluster-eu-west' },
  { id: 6, timestamp: '2026-05-30T10:12:15Z', source: 'WAF', level: 'WARNING', message: 'Rate limit exceeded for IP 104.22.54.12', path: '/api/v1/users' },
  { id: 7, timestamp: '2026-05-30T10:12:00Z', source: 'System', level: 'INFO', message: 'Scheduled backup completed successfully', path: '/var/backups/' },
  { id: 8, timestamp: '2026-05-30T10:11:45Z', source: 'EDR', level: 'CRITICAL', message: 'Malware signature matched: Trojan.Win32.Generic', path: 'C:\\Users\\Public\\Downloads\\update.exe' },
];

export function LogExplorer() {
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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
          <span className="log-count text-muted">{MOCK_LOGS.length} events matched</span>
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
              {MOCK_LOGS.map(log => (
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

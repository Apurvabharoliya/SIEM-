import { useState, useMemo } from 'react';
import { Search, Filter, Download, Terminal, Play, Pause, ChevronDown } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import './LogExplorer.css';

export function LogExplorer() {
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { logs } = useGlobalState();
  
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (!searchQuery) return true;
      try {
        const regex = new RegExp(searchQuery, 'i');
        return regex.test(log.message) || regex.test(log.source) || regex.test(log.level) || regex.test(log.path);
      } catch {
        const q = searchQuery.toLowerCase();
        return log.message.toLowerCase().includes(q) || 
               log.source.toLowerCase().includes(q) || 
               log.level.toLowerCase().includes(q) ||
               log.path.toLowerCase().includes(q);
      }
    }).slice(0, 200); // Truncate to 200 items for performance instead of virtualization
  }, [logs, searchQuery]);

  return (
    <div className="log-explorer animate-fade-in flex flex-col h-full">
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

      <div className="log-viewer glass-panel stagger-3 flex-1 flex flex-col min-h-0">
        <div className="log-viewer-header">
          <Terminal size={18} className="text-cyan" />
          <span>System Stream</span>
          <span className="log-count text-muted">Showing {filteredLogs.length} events</span>
        </div>
        
        <div className="log-table-container flex-1 overflow-auto">
          <table className="log-table w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Level</th>
                <th className="p-2">Source</th>
                <th className="p-2">Message</th>
                <th className="p-2">Path / Context</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={log.id || index} className="log-row border-b border-gray-800">
                  <td className="mono text-muted whitespace-nowrap p-2">{log.timestamp}</td>
                  <td className="p-2">
                    <span className={`log-level level-${log.level?.toLowerCase() || 'info'}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="p-2"><span className="source-badge">{log.source}</span></td>
                  <td className="log-message p-2 truncate max-w-xs">{log.message}</td>
                  <td className="mono text-muted truncate-path p-2" title={log.path}>{log.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

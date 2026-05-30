import { useState } from 'react';
import { Upload, Link as LinkIcon, Database, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import './DataIngestion.css';

export function DataIngestion() {
  const { ingestData } = useGlobalState();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const processTextAsLogs = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const newLogs: any[] = [];
    const newThreats: any[] = [];
    const newIncidents: any[] = [];
    let criticalCount = 0;

    lines.forEach((line, index) => {
      // Basic heuristic parsing
      const isCritical = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('sql') || line.toLowerCase().includes('attack');
      const isWarning = line.toLowerCase().includes('warn') || line.toLowerCase().includes('timeout');
      const level = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'INFO';
      
      const log = {
        id: `LOG-${Date.now()}-${index}`,
        timestamp: new Date(Date.now() - (lines.length - index) * 60000).toISOString(),
        source: line.includes('WAF') ? 'WAF' : line.includes('http') ? 'Network' : 'System',
        level,
        message: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
        path: '-'
      };
      newLogs.push(log);

      if (isCritical) {
        criticalCount++;
        newThreats.push({
          id: `THR-${Date.now()}-${index}`,
          time: 'Just now',
          source: 'Extracted from Log',
          type: line.toLowerCase().includes('sql') ? 'SQL Injection' : 'Anomaly',
          severity: 'Critical',
          status: 'Open'
        });
        
        if (criticalCount % 3 === 0) {
          newIncidents.push({
            id: `INC-${Date.now()}-${index}`,
            title: `High severity pattern detected: ${log.message.substring(0, 30)}`,
            status: 'Open',
            severity: 'High',
            assignee: 'Unassigned',
            created: 'Just now',
            type: 'Heuristic Match'
          });
        }
      }
    });

    return {
      logs: newLogs,
      threats: newThreats,
      incidents: newIncidents,
      metrics: {
        criticalAlerts: criticalCount,
        eventsPerSecond: Math.floor(newLogs.length / 60) || 5,
        activeEndpoints: 142
      }
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('processing');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        let parsedData;
        
        // Try parsing as JSON first
        try {
          const json = JSON.parse(result);
          if (json.logs || json.incidents) {
             parsedData = json;
          } else {
             // It's JSON but maybe array of strings or unknown
             parsedData = processTextAsLogs(result);
          }
        } catch {
          // If not JSON, parse as raw text lines
          parsedData = processTextAsLogs(result);
        }

        ingestData(parsedData);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to parse file.');
      }
    };
    reader.onerror = () => {
      setStatus('error');
      setErrorMessage('Failed to read file.');
    };
    
    reader.readAsText(file);
  };

  const handleUrlIngest = () => {
    if (!url) return;
    setStatus('processing');
    
    // Simulate fetching from URL since we can't easily bypass CORS on client side
    // In a real app this would call a backend proxy
    setTimeout(() => {
      const mockFetchedData = processTextAsLogs(`Connected to ${url}\nReceived HTTP 200 OK\nWARN: High latency detected from upstream\nINFO: Syncing resources...`);
      ingestData(mockFetchedData);
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="ingestion-module animate-fade-in">
      <header className="dashboard-header stagger-1">
        <div>
          <h2>Data Ingestion</h2>
          <p className="text-muted">Connect your environment logs and external sites</p>
        </div>
      </header>

      <div className="ingestion-layout stagger-2">
        <div className="glass-panel upload-card">
          <div className="card-icon text-cyan">
            <Upload size={32} />
          </div>
          <h3>Upload Log File</h3>
          <p className="text-muted">Upload raw .txt, .csv, or .json log files. The system will automatically parse the data, extract threats, and populate the dashboard.</p>
          
          <div className="upload-zone">
            <input type="file" id="file-upload" className="hidden-input" onChange={handleFileUpload} accept=".txt,.json,.csv,.log" />
            <label htmlFor="file-upload" className="btn-upload flex items-center gap-2">
              <FileText size={16} /> Select File
            </label>
          </div>
        </div>

        <div className="glass-panel upload-card">
          <div className="card-icon text-purple">
            <LinkIcon size={32} />
          </div>
          <h3>Connect Website URL</h3>
          <p className="text-muted">Enter a target URL to ingest access logs and telemetry data directly into the SOC.</p>
          
          <div className="url-input-group">
            <input 
              type="url" 
              placeholder="https://example.com/logs" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="url-input"
            />
            <button className="btn-action" onClick={handleUrlIngest} disabled={status === 'processing'}>
              Connect
            </button>
          </div>
        </div>
      </div>

      {status === 'processing' && (
        <div className="status-message info stagger-3 glass-panel">
          <Database className="spin" size={20} />
          <span>Processing and parsing data streams...</span>
        </div>
      )}

      {status === 'success' && (
        <div className="status-message success stagger-3 glass-panel">
          <CheckCircle size={20} className="text-green" />
          <span>Data successfully ingested! The dashboard, logs, and incident modules are now live.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="status-message error stagger-3 glass-panel">
          <AlertTriangle size={20} className="text-red" />
          <span>Error parsing data: {errorMessage}</span>
        </div>
      )}
    </div>
  );
}

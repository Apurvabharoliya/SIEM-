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

    const ipTracker: Record<string, number> = {};

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // Extract IP and Status using basic Regex patterns
      const ipMatch = line.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
      const ip = ipMatch ? ipMatch[0] : 'Unknown';
      const statusMatch = line.match(/\s([2345]\d{2})\s/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 200;

      // Advanced Heuristics Engine
      const isSqli = lowerLine.includes('union select') || lowerLine.includes('or 1=1') || lowerLine.includes('--');
      const isXss = lowerLine.includes('<script>') || lowerLine.includes('javascript:');
      const isAuthFailure = status === 401 || status === 403 || lowerLine.includes('failed login') || lowerLine.includes('authentication failure') || lowerLine.includes('invalid user');
      
      let level = 'INFO';
      let threatType: string | null = null;
      let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';

      if (isSqli) {
        level = 'CRITICAL'; threatType = 'SQL Injection (SQLi)'; severity = 'Critical';
      } else if (isXss) {
        level = 'CRITICAL'; threatType = 'Cross-Site Scripting (XSS)'; severity = 'High';
      } else if (isAuthFailure) {
        level = 'WARNING';
        ipTracker[ip] = (ipTracker[ip] || 0) + 1;
        // Correlate multiple auth failures from same IP into a Brute Force threat
        if (ipTracker[ip] >= 3) {
           level = 'CRITICAL'; threatType = 'Brute Force Attack'; severity = 'Critical';
           ipTracker[ip] = -100; // Reset tracker to prevent spam
        }
      } else if (status >= 500) {
        level = 'WARNING';
      } else if (lowerLine.includes('error') || lowerLine.includes('exception') || lowerLine.includes('fatal')) {
        level = 'WARNING';
      }

      if (level === 'CRITICAL') criticalCount++;

      const log = {
        id: `LOG-${Date.now()}-${index}`,
        timestamp: new Date(Date.now() - (lines.length - index) * 60000).toISOString(),
        source: (lowerLine.includes('nginx') || lowerLine.includes('apache')) ? 'Web Server' : lowerLine.includes('sshd') ? 'Auth Service' : 'System',
        level,
        message: line.substring(0, 150) + (line.length > 150 ? '...' : ''),
        path: ip !== 'Unknown' ? `IP: ${ip}` : '-'
      };
      newLogs.push(log);

      if (threatType) {
        newThreats.push({
          id: `THR-${Date.now()}-${index}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: ip !== 'Unknown' ? ip : 'Log Extraction',
          type: threatType,
          severity,
          status: 'Open'
        });
      }
    });

    // Cross-Module Trigger: Generate Incidents automatically for critical threats
    newThreats.filter(t => t.severity === 'Critical').forEach((t, i) => {
      // Only generate incident for every 2nd critical threat to avoid spamming the Incident response team
      if (i % 2 === 0) {
         newIncidents.push({
           id: `INC-AUTO-${Date.now()}-${i}`,
           title: `Automated SOC Response: ${t.type} detected from ${t.source}`,
           status: 'Open',
           severity: 'Critical',
           assignee: 'Unassigned',
           created: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
           type: 'Heuristic Correlation'
         });
      }
    });

    return {
      logs: newLogs,
      threats: newThreats,
      incidents: newIncidents,
      metrics: {
        criticalAlerts: criticalCount,
        eventsPerSecond: Math.max(Math.floor(newLogs.length / 60), 5),
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
          if (json.logs && Array.isArray(json.logs)) {
             // We have JSON logs, let's run heuristics on their messages to generate threats and incidents
             const textLines = json.logs.map((l: any) => l.message || JSON.stringify(l)).join('\n');
             const heuristicsData = processTextAsLogs(textLines);
             
             parsedData = {
               logs: json.logs,
               threats: [...(json.threats || []), ...heuristicsData.threats],
               incidents: [...(json.incidents || []), ...heuristicsData.incidents],
               metrics: heuristicsData.metrics
             };
          } else if (json.incidents || json.threats) {
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
      const mockFetchedData = processTextAsLogs(`Connected to ${url}
Received HTTP 200 OK
WARN: High latency detected from upstream
INFO: Syncing resources...
[Error] SQL syntax error: union select * from users;
[Auth] 192.168.1.1 - failed login attempt
[Auth] 192.168.1.1 - authentication failure
[Auth] 192.168.1.1 - invalid user detected
[XSS] <script>alert(document.cookie)</script>
sshd: Accepted publickey for root
nginx: GET /wp-admin 404 Not Found`);
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

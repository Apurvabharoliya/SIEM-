import { useState } from 'react';
import { Search, AlertTriangle, Play, Clock, CheckCircle, Shield, Activity } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import './Incidents.css';

export function Incidents() {
  const [activeTab, setActiveTab] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const { incidents, setIncidents } = useGlobalState();

  const filteredIncidents = incidents.filter(i => {
     if (activeTab === 'open' && i.status !== 'Open') return false;
     if (activeTab === 'mine' && i.status !== 'Investigating') return false;
     if (activeTab === 'closed' && i.status !== 'Resolved') return false;
     
     if (searchQuery) {
       const q = searchQuery.toLowerCase();
       return i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.type.toLowerCase().includes(q);
     }
     return true;
  });

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);

  const updateStatus = (newStatus: string) => {
    if (!selectedIncidentId) return;
    setIncidents(prev => prev.map(inc => inc.id === selectedIncidentId ? { ...inc, status: newStatus } : inc));
  };

  return (
    <div className="incidents-module animate-fade-in">
      <header className="incidents-header stagger-1">
        <div>
          <h2>Incident Response</h2>
          <p className="text-muted">Triage, investigate, and remediate security alerts</p>
        </div>
        <button className="btn-action flex items-center gap-2">
          <Play size={16} /> Run Playbook
        </button>
      </header>

      <div className="incidents-stats stagger-2">
        <div className="glass-panel stat-box">
          <div className="stat-label">Open Incidents</div>
          <div className="stat-number text-red">{incidents.filter(i => i.status === 'Open').length}</div>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-label">In Progress</div>
          <div className="stat-number text-yellow">{incidents.filter(i => i.status === 'Investigating').length}</div>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-label">Resolved (24h)</div>
          <div className="stat-number text-green">{incidents.filter(i => i.status === 'Resolved').length}</div>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-label">Total Cases</div>
          <div className="stat-number text-cyan">{incidents.length}</div>
        </div>
      </div>

      <div className="incidents-content stagger-3">
        <div className="incidents-sidebar glass-panel">
          <div className="tabs">
            <button className={`tab ${activeTab === 'open' ? 'active' : ''}`} onClick={() => setActiveTab('open')}>Open Alerts</button>
            <button className={`tab ${activeTab === 'mine' ? 'active' : ''}`} onClick={() => setActiveTab('mine')}>My Cases</button>
            <button className={`tab ${activeTab === 'closed' ? 'active' : ''}`} onClick={() => setActiveTab('closed')}>Resolved</button>
          </div>
          
          <div className="search-filter-box">
             <div className="search-input-wrapper">
                <Search size={16} className="text-muted search-icon-sm" />
                <input 
                  type="text" 
                  placeholder="Search ID or Title..." 
                  className="search-input-sm" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

          <div className="incident-list">
            {filteredIncidents.map((inc) => (
              <div 
                key={inc.id} 
                className={`incident-card ${selectedIncidentId === inc.id ? 'active' : ''}`}
                onClick={() => setSelectedIncidentId(inc.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="inc-card-header">
                  <span className="inc-id mono">{inc.id}</span>
                  <span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                </div>
                <div className="inc-title">{inc.title}</div>
                <div className="inc-meta">
                  <span className="flex items-center gap-1 text-muted"><Clock size={12} /> {inc.created}</span>
                  <span className="flex items-center gap-1 text-muted"><AlertTriangle size={12} /> {inc.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="incident-details glass-panel">
          {selectedIncident ? (
            <div className="incident-details-content animate-fade-in">
              <header className="details-header">
                <div>
                  <h3 className="text-xl flex items-center gap-2"><Shield className="text-cyan" /> {selectedIncident.id}</h3>
                  <h4 className="text-muted mt-1">{selectedIncident.title}</h4>
                </div>
                <div className={`status-badge badge-${selectedIncident.severity.toLowerCase()}`}>
                  {selectedIncident.status}
                </div>
              </header>

              <div className="details-grid mt-6">
                 <div className="detail-item">
                    <span className="text-muted text-sm block">Severity</span>
                    <strong>{selectedIncident.severity}</strong>
                 </div>
                 <div className="detail-item">
                    <span className="text-muted text-sm block">Type</span>
                    <strong>{selectedIncident.type}</strong>
                 </div>
                 <div className="detail-item">
                    <span className="text-muted text-sm block">Created</span>
                    <strong>{selectedIncident.created}</strong>
                 </div>
                 <div className="detail-item">
                    <span className="text-muted text-sm block">Assignee</span>
                    <strong>{selectedIncident.assignee}</strong>
                 </div>
              </div>

              <div className="mt-8 border-t border-glass pt-6 flex gap-4">
                {selectedIncident.status === 'Open' && (
                  <button className="btn-action flex items-center gap-2" onClick={() => updateStatus('Investigating')}>
                    <Activity size={16} /> Begin Investigation
                  </button>
                )}
                {selectedIncident.status === 'Investigating' && (
                  <button className="btn-action bg-green-500/20 text-green flex items-center gap-2 hover:bg-green-500/30 transition-all border-none" onClick={() => updateStatus('Resolved')}>
                    <CheckCircle size={16} /> Mark as Resolved
                  </button>
                )}
                {selectedIncident.status === 'Resolved' && (
                   <span className="text-green flex items-center gap-2"><CheckCircle size={16} /> Incident Closed</span>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <AlertTriangle size={48} className="text-muted" />
              <h3>Select an incident</h3>
              <p className="text-muted">Choose an incident from the queue to view details and begin investigation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

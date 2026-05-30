import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, ChevronRight, Play, CheckCircle, Clock } from 'lucide-react';
import './Incidents.css';

const MOCK_INCIDENTS = [
  { id: 'INC-2026-001', title: 'Multiple Failed Login Attempts', status: 'Open', severity: 'High', assignee: 'Unassigned', created: '10 mins ago', type: 'Brute Force' },
  { id: 'INC-2026-002', title: 'Suspicious PowerShell Execution', status: 'Investigating', severity: 'Critical', assignee: 'Alex SOC', created: '1 hour ago', type: 'Malware' },
  { id: 'INC-2026-003', title: 'WAF Rule Triggered: SQLi Payload', status: 'Open', severity: 'High', assignee: 'Unassigned', created: '2 hours ago', type: 'Web Attack' },
  { id: 'INC-2026-004', title: 'Unusual Data Exfiltration Volume', status: 'Resolved', severity: 'Medium', assignee: 'Sarah Lead', created: '1 day ago', type: 'Data Leak' },
  { id: 'INC-2026-005', title: 'New Admin User Created', status: 'Open', severity: 'Low', assignee: 'Unassigned', created: '1 day ago', type: 'Privilege' },
];

export function Incidents() {
  const [activeTab, setActiveTab] = useState('open');

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
          <div className="stat-number text-red">3</div>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-label">In Progress</div>
          <div className="stat-number text-yellow">1</div>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-label">Resolved (24h)</div>
          <div className="stat-number text-green">14</div>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-label">Avg Triage Time</div>
          <div className="stat-number text-cyan">4m 12s</div>
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
                <input type="text" placeholder="Search ID or Title..." className="search-input-sm" />
             </div>
          </div>

          <div className="incident-list">
            {MOCK_INCIDENTS.map((inc, i) => (
              <div key={inc.id} className="incident-card">
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
          <div className="empty-state">
            <AlertTriangle size={48} className="text-muted" />
            <h3>Select an incident</h3>
            <p className="text-muted">Choose an incident from the queue to view details and begin investigation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

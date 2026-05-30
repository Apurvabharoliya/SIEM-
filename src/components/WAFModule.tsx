
import { Globe, Shield, Lock, AlertTriangle, Map } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './WAFModule.css';

const trafficData = [
  { time: '00:00', legitimate: 4000, blocked: 240 },
  { time: '04:00', legitimate: 3000, blocked: 139 },
  { time: '08:00', legitimate: 2000, blocked: 980 },
  { time: '12:00', legitimate: 2780, blocked: 390 },
  { time: '16:00', legitimate: 1890, blocked: 480 },
  { time: '20:00', legitimate: 2390, blocked: 380 },
  { time: '24:00', legitimate: 3490, blocked: 430 },
];

export function WAFModule() {
  return (
    <div className="waf-module animate-fade-in">
      <header className="dashboard-header stagger-1">
        <div>
          <h2>Web Application Firewall</h2>
          <p className="text-muted">Edge security and traffic filtering</p>
        </div>
        <div className="header-actions">
           <button className="btn-report flex items-center gap-2">
            <Lock size={16} /> Update Ruleset
          </button>
        </div>
      </header>

      <div className="stats-grid stagger-2">
        <StatCard icon={Globe} title="Total Requests" value="24.5M" color="var(--accent-blue)" />
        <StatCard icon={Shield} title="Requests Blocked" value="1.2M" color="var(--accent-green)" />
        <StatCard icon={AlertTriangle} title="OWASP Top 10 Hits" value="845" color="var(--accent-red)" />
        <StatCard icon={Map} title="Geo-Blocked IPs" value="14,230" color="var(--accent-yellow)" />
      </div>

      <div className="waf-layout stagger-3">
        <div className="chart-card glass-panel large-chart">
          <div className="chart-header">
            <h3 className="chart-title">Edge Traffic Analysis</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="legitimate" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorLegit)" name="Legitimate Traffic" />
                <Area type="monotone" dataKey="blocked" stroke="var(--accent-red)" fillOpacity={1} fill="url(#colorBlocked)" name="Blocked Traffic" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="side-panel">
          <div className="live-feed-card glass-panel h-full flex-1">
             <div className="chart-header">
              <h3 className="chart-title flex items-center gap-2">
                <Shield size={16} className="text-green" />
                Top Blocked Rules
              </h3>
            </div>
            <div className="feed-list">
              <RuleItem id="941100" name="XSS Attack Detected via libinjection" hits="45,210" severity="high" />
              <RuleItem id="942100" name="SQL Injection Attack Detected" hits="32,155" severity="critical" />
              <RuleItem id="932100" name="Remote Command Execution" hits="12,400" severity="critical" />
              <RuleItem id="949110" name="Inbound Anomaly Score Exceeded" hits="8,902" severity="medium" />
              <RuleItem id="920350" name="Host header is a numeric IP address" hits="4,211" severity="low" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }: any) {
  return (
    <div className="stat-card glass-panel">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className="icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function RuleItem({ id, name, hits, severity }: any) {
  return (
    <div className="feed-item">
      <div className={`feed-indicator indicator-${severity}`}></div>
      <div className="feed-content">
        <div className="feed-top">
          <span className="feed-type">{name}</span>
          <span className="feed-time font-bold">{hits} hits</span>
        </div>
        <div className="feed-src mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rule ID: {id}</div>
      </div>
    </div>
  );
}

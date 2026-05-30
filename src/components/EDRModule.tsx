
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Server, HardDrive, Cpu, ShieldAlert, Activity } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import './EDRModule.css';

const endpointHealthData = [
  { time: '00:00', memory: 40, cpu: 24, io: 24 },
  { time: '04:00', memory: 30, cpu: 13, io: 22 },
  { time: '08:00', memory: 20, cpu: 98, io: 22 },
  { time: '12:00', memory: 27, cpu: 39, io: 20 },
  { time: '16:00', memory: 18, cpu: 48, io: 21 },
  { time: '20:00', memory: 23, cpu: 38, io: 25 },
  { time: '24:00', memory: 34, cpu: 43, io: 21 },
];

const vulnerabilitiesData = [
  { name: 'Critical', value: 12, fill: 'var(--accent-red)' },
  { name: 'High', value: 45, fill: 'var(--accent-yellow)' },
  { name: 'Medium', value: 120, fill: 'var(--accent-blue)' },
  { name: 'Low', value: 340, fill: 'var(--accent-cyan)' },
];

export function EDRModule() {
  const { metrics } = useGlobalState();

  return (
    <div className="edr-module animate-fade-in">
      <header className="dashboard-header stagger-1">
        <div>
          <h2>Endpoint Detection & Response</h2>
          <p className="text-muted">Host-level visibility and threat hunting</p>
        </div>
        <div className="header-actions">
          <div className="status-badge glass-panel text-green">
            <div className="status-dot pulsing" style={{ backgroundColor: 'var(--accent-green)' }}></div>
            <span>All Agents Online</span>
          </div>
        </div>
      </header>

      <div className="stats-grid stagger-2">
        <StatCard icon={Server} title="Total Endpoints" value={metrics.activeEndpoints} color="var(--accent-blue)" />
        <StatCard icon={ShieldAlert} title="Active Quarantines" value="8" color="var(--accent-red)" />
        <StatCard icon={Cpu} title="Avg CPU Load" value="34%" color="var(--accent-purple)" />
        <StatCard icon={HardDrive} title="Storage Scanned" value="4.2 PB" color="var(--accent-cyan)" />
      </div>

      <div className="edr-layout stagger-3">
        <div className="chart-card glass-panel large-chart">
          <div className="chart-header">
            <h3 className="chart-title">Endpoint Resource Utilization</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={endpointHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="cpu" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorCpu)" name="CPU Usage (%)" />
                <Area type="monotone" dataKey="memory" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorMem)" name="Memory Usage (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="side-panel">
          <div className="chart-card glass-panel h-auto">
            <h3 className="chart-title">Endpoint Vulnerabilities</h3>
            <div className="chart-container" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilitiesData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={60} />
                  <Tooltip cursor={{fill: 'var(--bg-glass-hover)'}} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {vulnerabilitiesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="live-feed-card glass-panel flex-1">
             <div className="chart-header">
              <h3 className="chart-title flex items-center gap-2">
                <Activity size={16} className="text-purple" />
                Recent Process Executions
              </h3>
            </div>
            <div className="feed-list">
              <ProcessItem process="powershell.exe" path="C:\Windows\System32" user="NT AUTHORITY\SYSTEM" suspicious />
              <ProcessItem process="chrome.exe" path="C:\Program Files\Google" user="user_desktop" />
              <ProcessItem process="svchost.exe" path="C:\Windows\System32" user="NT AUTHORITY\NETWORK SERVICE" />
              <ProcessItem process="mimikatz.exe" path="C:\Temp" user="user_desktop" suspicious />
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

function ProcessItem({ process, path, user, suspicious }: any) {
  return (
    <div className="feed-item">
      <div className={`feed-indicator ${suspicious ? 'indicator-critical' : 'indicator-low'}`}></div>
      <div className="feed-content">
        <div className="feed-top">
          <span className="feed-type" style={{ color: suspicious ? 'var(--accent-red)' : 'var(--text-primary)' }}>{process}</span>
        </div>
        <div className="feed-src mono" style={{ fontSize: '11px' }}>{path}</div>
        <div className="feed-src text-muted" style={{ fontSize: '10px' }}>User: {user}</div>
      </div>
    </div>
  );
}

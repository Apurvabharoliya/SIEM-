
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, ShieldAlert, Cpu, Network, Server, Globe, Zap, AlertOctagon } from 'lucide-react';
import { useMemo } from 'react';
import { useGlobalState } from '../context/GlobalState';
import './DashboardOverview.css';

export function DashboardOverview() {
  const { metrics, threats } = useGlobalState();

  // Dynamically compute Alert Severity based on real threats
  const alertSeverityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    threats.forEach(t => {
      if (counts[t.severity] !== undefined) counts[t.severity]++;
    });
    return [
      { name: 'Critical', value: counts.Critical, fill: 'var(--accent-red)' },
      { name: 'High', value: counts.High, fill: 'var(--accent-yellow)' },
      { name: 'Medium', value: counts.Medium, fill: 'var(--accent-blue)' },
      { name: 'Low', value: counts.Low || 10, fill: 'var(--accent-cyan)' }, // base value for visual
    ];
  }, [threats]);

  // Dynamically compute attack vectors
  const attackVectors = useMemo(() => {
    const vectors: Record<string, number> = {};
    threats.forEach(t => {
      vectors[t.type] = (vectors[t.type] || 0) + 1;
    });
    // Add some base data if no threats yet
    if (Object.keys(vectors).length === 0) {
      vectors['SQL Injection'] = 1;
      vectors['Cross-Site Scripting'] = 1;
    }
    
    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6'];
    return Object.entries(vectors).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [threats]);

  // Simulate a dynamic threat timeline based on recent threats vs historical baseline
  const threatData = useMemo(() => {
    const data = [];
    for(let i = -6; i <= 0; i++) {
      let time = new Date(Date.now() + i * 3600000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      let threatsCount = (i === 0) ? threats.length * 2 + 10 : Math.floor(Math.random() * 50) + 10;
      data.push({
        time,
        threats: threatsCount,
        blocked: Math.floor(threatsCount * 0.9),
        bypassed: Math.floor(threatsCount * 0.1)
      });
    }
    return data;
  }, [threats.length]);

  const endpointRadar = useMemo(() => [
    { subject: 'CPU Usage', A: Math.floor(Math.random() * 40) + 40, fullMark: 100 },
    { subject: 'Memory', A: Math.floor(Math.random() * 30) + 50, fullMark: 100 },
    { subject: 'Network I/O', A: metrics.eventsPerSecond, fullMark: 100 },
    { subject: 'Storage', A: 45, fullMark: 100 },
    { subject: 'Latency', A: Math.floor(Math.random() * 20) + 20, fullMark: 100 },
  ], [metrics.eventsPerSecond]);


  return (
    <div className="dashboard-overview animate-fade-in">
      <header className="dashboard-header stagger-1">
        <div>
          <h2>Security Operations Center</h2>
          <p className="text-muted">Global Threat Intelligence & Real-Time Analytics</p>
        </div>
        <div className="header-actions">
          <div className="status-badge glass-panel text-green">
            <div className="status-dot pulsing" style={{ backgroundColor: 'var(--accent-green)' }}></div>
            <span>DEFCON 4 - Normal</span>
          </div>
          <button className="btn-report flex items-center gap-2">
            <Zap size={16} /> Generate Report
          </button>
        </div>
      </header>

      {/* KPI Stats Row using Global State */}
      <div className="stats-grid stagger-2">
        <StatCard icon={ShieldAlert} title="Critical Alerts" value={metrics.criticalAlerts} change="+4" color="var(--accent-red)" trend="up" />
        <StatCard icon={Globe} title="Targeted Regions" value="12" change="-2" color="var(--accent-purple)" trend="down" />
        <StatCard icon={Network} title="Events Per Second" value={metrics.eventsPerSecond.toLocaleString()} change="+15%" color="var(--accent-cyan)" trend="up" />
        <StatCard icon={AlertOctagon} title="Blocked Attacks" value="2.4M" change="+8%" color="var(--accent-yellow)" trend="up" />
        <StatCard icon={Server} title="Active Endpoints" value={metrics.activeEndpoints.toLocaleString()} change="+12" color="var(--accent-blue)" trend="up" />
        <StatCard icon={Cpu} title="SIEM Load" value="42%" change="-5%" color="var(--accent-green)" trend="down" />
      </div>

      <div className="dashboard-layout stagger-3">
        {/* Main Charts Area */}
        <div className="main-charts">
          <div className="chart-card glass-panel large-chart">
            <div className="chart-header">
              <h3 className="chart-title">Global Threat Timeline (24h)</h3>
              <select className="chart-select">
                <option>All Sources</option>
                <option>WAF Only</option>
                <option>EDR Only</option>
              </select>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={threatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="blocked" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorBlocked)" name="Blocked" />
                  <Area type="monotone" dataKey="threats" stroke="var(--accent-red)" fillOpacity={1} fill="url(#colorThreats)" name="Total Threats" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="secondary-charts-grid">
            <div className="chart-card glass-panel">
              <h3 className="chart-title">Attack Vectors</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attackVectors}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {attackVectors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="custom-legend">
                {attackVectors.slice(0,4).map(av => (
                  <div key={av.name} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: av.color }}></span>
                    <span className="legend-text">{av.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card glass-panel">
              <h3 className="chart-title">Infrastructure Health</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={endpointRadar}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Performance" dataKey="A" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel: Live Feed & Severities */}
        <div className="side-panel">
          <div className="chart-card glass-panel h-auto">
            <h3 className="chart-title">Alert Severities</h3>
            <div className="chart-container" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertSeverityData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={60} />
                  <Tooltip cursor={{fill: 'var(--bg-glass-hover)'}} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {alertSeverityData.map((entry, index) => (
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
                <Activity size={16} className="text-cyan" />
                Live Incident Feed
              </h3>
            </div>
            <div className="feed-list">
              {threats.map(threat => (
                <FeedItem 
                  key={threat.id} 
                  time={threat.time} 
                  src={threat.source} 
                  type={threat.type} 
                  severity={threat.severity.toLowerCase()} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, change, color, trend }: any) {
  return (
    <div className="stat-card glass-panel">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className="icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-change text-muted">
        <span className={`trend-${trend === 'up' && color === 'var(--accent-red)' ? 'bad' : trend === 'up' ? 'good' : 'neutral'}`}>
          {change}
        </span> vs last 24h
      </div>
    </div>
  );
}

function FeedItem({ time, src, type, severity }: any) {
  return (
    <div className="feed-item">
      <div className={`feed-indicator indicator-${severity}`}></div>
      <div className="feed-content">
        <div className="feed-top">
          <span className="feed-type">{type}</span>
          <span className="feed-time">{time}</span>
        </div>
        <div className="feed-src mono">{src}</div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useGlobalState } from '../context/GlobalState';
import type { LogEntry, Threat, Incident } from '../context/GlobalState';

const LOG_MESSAGES = [
  'User login successful',
  'Failed login attempt',
  'Database query execution time > 500ms',
  'Connection established with upstream server',
  'Configuration file updated',
  'API request received: /api/v1/users',
  'Invalid authentication token provided',
  'Rate limit exceeded for IP',
];

const SOURCES = ['Web Server (Nginx)', 'Database (PostgreSQL)', 'Auth Service', 'Firewall', 'WAF'];
const THREAT_TYPES = ['SQL Injection', 'Brute Force', 'DDoS Attempt', 'Cross-Site Scripting', 'Malware Signature Detected'];
const INCIDENT_TITLES = ['Multiple failed logins detected', 'Unusual outbound traffic', 'Suspected SQLi attack', 'High CPU utilization on DB node'];

export function SimulationRunner() {
  const { setLogs, setThreats, setIncidents, setMetrics } = useGlobalState();

  useEffect(() => {
    // Generate new logs every 2-5 seconds
    const logInterval = setInterval(() => {
      const isWarning = Math.random() > 0.8;
      const isCritical = Math.random() > 0.95;
      
      let level = 'INFO';
      if (isWarning) level = 'WARNING';
      if (isCritical) level = 'CRITICAL';

      const newLog: LogEntry = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
        level,
        message: LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)],
        path: '/var/log/syslog'
      };

      setLogs(prev => {
        const updatedLogs = [newLog, ...prev].slice(0, 1000); // Keep last 1000
        
        // Update EPS metric based on logs volume
        setMetrics((m: any) => ({
          ...m,
          eventsPerSecond: Math.floor(Math.random() * 50) + 20, // Simulate 20-70 EPS
        }));
        return updatedLogs;
      });
    }, 3000);

    // Generate occasional threats/incidents every 15-30 seconds
    const threatInterval = setInterval(() => {
      const type = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
      const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      
      const newThreat: Threat = {
        id: `THR-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source,
        type,
        severity: Math.random() > 0.5 ? 'High' : 'Medium',
        status: 'Open'
      };

      setThreats(prev => {
        const updated = [newThreat, ...prev].slice(0, 100);
        setMetrics((m: any) => ({
          ...m,
          criticalAlerts: updated.filter(t => t.severity === 'Critical' || t.severity === 'High').length
        }));
        return updated;
      });

      // 30% chance to also create an Incident
      if (Math.random() > 0.7) {
        const newIncident: Incident = {
          id: `INC-${Date.now()}`,
          title: INCIDENT_TITLES[Math.floor(Math.random() * INCIDENT_TITLES.length)],
          status: 'Open',
          severity: newThreat.severity,
          assignee: 'Unassigned',
          created: 'Just now',
          type: 'Auto-Generated'
        };
        setIncidents(prev => [newIncident, ...prev].slice(0, 50));
      }

    }, 20000);

    return () => {
      clearInterval(logInterval);
      clearInterval(threatInterval);
    };
  }, [setLogs, setThreats, setIncidents, setMetrics]);

  return null; // This component has no UI
}

import { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Threat {
  id: string;
  time: string;
  source: string;
  type: string;
  severity: AlertSeverity;
  status: 'Open' | 'Investigating' | 'Resolved';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: string;
  message: string;
  path: string;
}

export interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  assignee: string;
  created: string;
  type: string;
}

interface GlobalStateContextType {
  threats: Threat[];
  setThreats: React.Dispatch<React.SetStateAction<Threat[]>>;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  metrics: any;
  setMetrics: React.Dispatch<React.SetStateAction<any>>;
  ingestData: (data: any) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [metrics, setMetrics] = useState({
    criticalAlerts: 0,
    eventsPerSecond: 0,
    activeEndpoints: 0,
  });

  const ingestData = (data: any) => {
    if (data.threats) setThreats(prev => [...data.threats, ...prev]);
    if (data.logs) setLogs(prev => [...data.logs, ...prev]);
    if (data.incidents) setIncidents(prev => [...data.incidents, ...prev]);
    if (data.metrics) {
      setMetrics((prev: any) => ({
        ...prev,
        criticalAlerts: prev.criticalAlerts + (data.metrics.criticalAlerts || 0),
        eventsPerSecond: data.metrics.eventsPerSecond || prev.eventsPerSecond,
        activeEndpoints: data.metrics.activeEndpoints || prev.activeEndpoints
      }));
    }
  };

  useEffect(() => {
    const socket: Socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('Connected to SIEM Backend');
    });

    socket.on('siem_event', (data) => {
      ingestData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <GlobalStateContext.Provider value={{ threats, setThreats, logs, setLogs, incidents, setIncidents, metrics, setMetrics, ingestData }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}

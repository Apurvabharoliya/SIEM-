import React, { createContext, useContext, useState, useEffect } from 'react';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Threat {
  id: string;
  time: string;
  source: string;
  type: string;
  severity: AlertSeverity;
  status: 'Open' | 'Investigating' | 'Resolved';
}

interface GlobalStateContextType {
  threats: Threat[];
  setThreats: React.Dispatch<React.SetStateAction<Threat[]>>;
  addThreat: (threat: Threat) => void;
  metrics: {
    criticalAlerts: number;
    eventsPerSecond: number;
    activeEndpoints: number;
  };
  setMetrics: React.Dispatch<React.SetStateAction<any>>;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [threats, setThreats] = useState<Threat[]>([
    { id: '1', time: 'Just now', source: '192.168.1.105', type: 'Brute Force', severity: 'Critical', status: 'Open' },
    { id: '2', time: '2m ago', source: '45.22.19.11', type: 'SQL Injection', severity: 'High', status: 'Investigating' },
    { id: '3', time: '5m ago', source: '10.0.0.44', type: 'Privilege Escalation', severity: 'Critical', status: 'Open' },
    { id: '4', time: '12m ago', source: '104.22.54.12', type: 'Rate Limit Exceeded', severity: 'Medium', status: 'Resolved' },
  ]);

  const [metrics, setMetrics] = useState({
    criticalAlerts: 24,
    eventsPerSecond: 14250,
    activeEndpoints: 1845,
  });

  const addThreat = (threat: Threat) => {
    setThreats(prev => [threat, ...prev]);
  };

  // Simulate real-time data ingestion
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        eventsPerSecond: prev.eventsPerSecond + Math.floor(Math.random() * 100) - 50,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlobalStateContext.Provider value={{ threats, setThreats, addThreat, metrics, setMetrics }}>
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

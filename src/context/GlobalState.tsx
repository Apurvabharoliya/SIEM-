import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

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

export interface MetricsData {
  criticalAlerts: number;
  eventsPerSecond: number;
  activeEndpoints: number;
}

interface GlobalStateContextType {
  threats: Threat[];
  setThreats: React.Dispatch<React.SetStateAction<Threat[]>>;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  metrics: MetricsData;
  setMetrics: React.Dispatch<React.SetStateAction<MetricsData>>;
  ingestData: (data: any) => void;
  isLoading: boolean;
  error: string | null;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Transform a snake_case object to camelCase.
 * Used to convert Supabase column names to frontend conventions.
 */
function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    criticalAlerts: 0,
    eventsPerSecond: 0,
    activeEndpoints: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ingestData = useCallback((data: any) => {
    if (data.threats) setThreats(prev => [...data.threats, ...prev]);
    if (data.logs) setLogs(prev => [...data.logs, ...prev]);
    if (data.incidents) setIncidents(prev => [...data.incidents, ...prev]);
    if (data.metrics) {
      setMetrics((prev: any) => ({
        ...prev,
        criticalAlerts: prev.criticalAlerts + (data.metrics.criticalAlerts || 0),
        eventsPerSecond: data.metrics.eventsPerSecond || prev.eventsPerSecond,
        activeEndpoints: data.metrics.activeEndpoints || prev.activeEndpoints,
      }));
    }
  }, []);

  // ── Fetch data from backend when auth token becomes available ──
  const fetchData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch all endpoints in parallel, tolerate individual failures
      const results = await Promise.allSettled([
        fetch(`${API_URL}/api/logs`, { headers }).then(async r => {
          if (r.status === 401) throw new Error('Session expired');
          return r.json();
        }),
        fetch(`${API_URL}/api/threats`, { headers }).then(async r => {
          if (r.status === 401) throw new Error('Session expired');
          return r.json();
        }),
        fetch(`${API_URL}/api/incidents`, { headers }).then(async r => {
          if (r.status === 401) throw new Error('Session expired');
          return r.json();
        }),
        fetch(`${API_URL}/api/metrics`, { headers }).then(async r => {
          if (r.status === 401) throw new Error('Session expired');
          return r.json();
        }),
      ]);

      // Check if any returned 401 (expired session)
      const anyUnauthorized = results.some(
        r => r.status === 'rejected' && r.reason?.message === 'Session expired'
      );
      if (anyUnauthorized) {
        setError('Session expired. Please log in again.');
        setIsLoading(false);
        return;
      }

      // Process each result independently
      const [logsData, threatsData, incidentsData, metricsData] = results.map(r =>
        r.status === 'fulfilled' ? r.value : null
      );

      if (logsData?.logs) setLogs(logsData.logs);
      if (threatsData?.threats) setThreats(threatsData.threats);
      if (incidentsData?.incidents) setIncidents(incidentsData.incidents);

      // Transform snake_case metrics to camelCase
      if (metricsData?.metrics) {
        const transformed = snakeToCamel(metricsData.metrics);
        setMetrics({
          criticalAlerts: transformed.criticalAlerts ?? 0,
          eventsPerSecond: transformed.eventsPerSecond ?? 0,
          activeEndpoints: transformed.activeEndpoints ?? 0,
        });
      }

      // If some succeeded but others failed, surface a warning
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0 && failedCount < results.length) {
        console.warn(`${failedCount} of ${results.length} data fetches failed`);
      } else if (failedCount === results.length) {
        setError('Failed to connect to the backend server. Make sure the server is running.');
      }
    } catch (err: any) {
      console.error('Failed to fetch backend data:', err);
      setError('Failed to connect to backend server.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Trigger data fetch when token becomes available (after login)
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
    }
  }, [isAuthenticated, token, fetchData]);

  // ── Socket.IO for real-time updates ──────────────────────────
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket: Socket = io(API_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to SIEM Backend');
    });

    socket.on('siem_event', (data) => {
      ingestData(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, ingestData]);

  return (
    <GlobalStateContext.Provider
      value={{
        threats,
        setThreats,
        logs,
        setLogs,
        incidents,
        setIncidents,
        metrics,
        setMetrics,
        ingestData,
        isLoading,
        error,
      }}
    >
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

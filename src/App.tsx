import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { LogExplorer } from './components/LogExplorer';
import { Incidents } from './components/Incidents';
import { EDRModule } from './components/EDRModule';
import { WAFModule } from './components/WAFModule';
import { DataIngestion } from './components/DataIngestion';
import { AICopilot } from './components/AICopilot';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { GlobalStateProvider } from './context/GlobalState';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Scene3DBackground } from './components/Scene3D';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <AuthProvider>
      <GlobalStateProvider>
        <Router>
          <div className="app-container scan-overlay">
            {/* 3D Background - behind everything */}
            <Scene3DBackground />

            <Sidebar />
            <main className="main-content relative">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
                <Route path="/logs" element={<ProtectedRoute><LogExplorer /></ProtectedRoute>} />
                <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
                <Route path="/edr" element={<ProtectedRoute><EDRModule /></ProtectedRoute>} />
                <Route path="/waf" element={<ProtectedRoute><WAFModule /></ProtectedRoute>} />
                <Route path="/ingestion" element={<ProtectedRoute><DataIngestion /></ProtectedRoute>} />
              </Routes>
            
              {/* AI Copilot Floating Button */}
              {!isCopilotOpen && (
                <button 
                  className="copilot-fab"
                  onClick={() => setIsCopilotOpen(true)}
                >
                  <Bot size={26} />
                  <span className="copilot-fab-pulse" />
                </button>
              )}
              
              <AICopilot isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
            </main>
          </div>
        </Router>
      </GlobalStateProvider>
    </AuthProvider>
  );
}

export default App;

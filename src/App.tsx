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
          <div className="app-container">
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
                className="fixed bottom-6 right-6 p-4 rounded-full bg-cyan-600 text-white shadow-lg hover:bg-cyan-500 transition-all z-50 flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-cyan)', color: '#000', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '60px', height: '60px', boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)' }}
                onClick={() => setIsCopilotOpen(true)}
              >
                <Bot size={28} />
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

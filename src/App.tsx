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
import { GlobalStateProvider } from './context/GlobalState';
import { SimulationRunner } from './components/SimulationRunner';
import './index.css';

function App() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <GlobalStateProvider>
      <SimulationRunner />
      <Router>
        <div className="app-container">
          <Sidebar />
          <main className="main-content relative">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/logs" element={<LogExplorer />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/edr" element={<EDRModule />} />
              <Route path="/waf" element={<WAFModule />} />
              <Route path="/ingestion" element={<DataIngestion />} />
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
  );
}

export default App;

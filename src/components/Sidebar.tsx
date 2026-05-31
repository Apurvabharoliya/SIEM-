import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Activity, FileText, AlertTriangle, Lock, Settings, LogOut, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export function Sidebar() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: Activity, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Log Explorer', path: '/logs' },
    { icon: AlertTriangle, label: 'Incidents', path: '/incidents' },
    { icon: Shield, label: 'EDR / XDR', path: '/edr' },
    { icon: Lock, label: 'WAF Rules', path: '/waf' },
    { icon: Database, label: 'Data Ingestion', path: '/ingestion' },
  ];

  // Hide sidebar if not authenticated
  if (!isAuthenticated) return null;

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <Shield className="logo-icon text-cyan" size={32} />
        <h1 className="logo-text">Sentinel<span className="text-cyan">IQ</span></h1>
      </div>
      
      <nav className="sidebar-nav flex-col gap-2">
        {navItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-cyan' : 'text-muted'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <Settings size={20} className="text-muted" />
          <span>Settings</span>
        </button>
        <button className="nav-item" onClick={handleLogout}>
          <LogOut size={20} className="text-muted" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

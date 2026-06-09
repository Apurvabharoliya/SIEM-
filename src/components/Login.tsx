import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || '';

  const doLogin = async (user: string, pass: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    login(data.token, data.user);
  };

  const doDemoLogin = async () => {
    const response = await fetch(`${API_URL}/api/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Demo login failed');
    login(data.token, data.user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await doLogin(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Try demo_user / demo_pass');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await doDemoLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated grid background */}
      <div className="login-grid-bg" />
      
      {/* Floating orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container animate-fade-in-scale">
        {/* Logo section */}
        <div className="login-logo-section">
          <div className="login-logo-icon">
            <Shield size={36} />
            <div className="login-logo-ring" />
          </div>
          <h1 className="login-title orbitron">SENTINEL<span className="text-cyan">SIEM</span></h1>
          <p className="login-subtitle">Security Intelligence Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">IDENTIFIER</label>
            <input
              type="text"
              className="input-cyber"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label">ACCESS KEY</label>
            <div className="login-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-cyber"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error-dot" />
              {error}
            </div>
          )}

          <button type="submit" className="login-btn-primary" disabled={loading}>
            {loading ? (
              <span className="login-loading">
                <span className="spin" style={{ display: 'inline-flex' }}><Zap size={16} /></span>
                Authenticating...
              </span>
            ) : (
              <span>ACCESS SYSTEM</span>
            )}
          </button>

          <button type="button" className="login-btn-demo" onClick={handleDemoLogin} disabled={loading}>
            Quick Demo Access
          </button>
        </form>

        <div className="login-footer">
          <span className="text-muted">Protected by AES-256 Encryption</span>
        </div>
      </div>
    </div>
  );
}

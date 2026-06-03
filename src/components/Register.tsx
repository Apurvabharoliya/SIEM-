import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Zap } from 'lucide-react';
import './Login.css';

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Analyst');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-grid-bg" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container animate-fade-in-scale">
        <div className="login-logo-section">
          <div className="login-logo-icon">
            <Shield size={36} />
            <div className="login-logo-ring" />
          </div>
          <h1 className="login-title orbitron">SENTINEL<span className="text-cyan">SIEM</span></h1>
          <p className="login-subtitle">Create your SOC account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">USERNAME</label>
            <input
              type="text"
              className="input-cyber"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label">ROLE</label>
            <select
              className="input-cyber"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Analyst">Tier 1 Analyst</option>
              <option value="Responder">Tier 2 Responder</option>
              <option value="Admin">SOC Admin</option>
            </select>
          </div>

          <div className="login-field">
            <label className="login-label">PASSWORD</label>
            <div className="login-password-wrap">
              <input
                type="password"
                className="input-cyber"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">CONFIRM PASSWORD</label>
            <div className="login-password-wrap">
              <input
                type="password"
                className="input-cyber"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
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
                Creating Account...
              </span>
            ) : (
              <span>CREATE ACCOUNT</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span className="text-muted">Already have an account?{' '}
            <Link to="/login" className="text-cyan" style={{ textDecoration: 'none' }}>Sign In</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

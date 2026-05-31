import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const url = isRegistering ? 'http://localhost:3001/api/auth/register' : 'http://localhost:3001/api/auth/login';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role: 'Analyst' }), // Default role for now
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegistering) {
        // Automatically login after successful registration or show success message
        setIsRegistering(false);
        setError('Registration successful! Please login.');
        return;
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">SentinelIQ</h2>
        <p className="login-subtitle">{isRegistering ? 'Create an account' : 'Sign in to your account'}</p>
        
        {error && <div className={`login-error ${error.includes('successful') ? 'success' : ''}`}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <button type="submit" className="login-submit-btn">
            {isRegistering ? 'Register' : 'Sign In'}
          </button>
        </form>

        <p className="login-toggle">
          {isRegistering ? 'Already have an account? ' : 'Don\'t have an account? '}
          <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="toggle-btn">
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

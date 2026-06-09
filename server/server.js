import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// ── Supabase client ───────────────────────────────────────────
// service_role key bypasses RLS – used for all server-side ops.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Express + Socket.IO ───────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// ── Auth middleware (JWT verification via Supabase) ────────────
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized – missing token' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized – invalid or expired token' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth endpoints ────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 1. Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${username}@sentinel.local`,
      password,
      email_confirm: true,
    });
    if (authError) {
      if (authError.message?.includes('already registered')) {
        return res.status(400).json({ error: 'User already exists' });
      }
      throw authError;
    }

    // 2. Insert profile row
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      username,
      role: role || 'Analyst',
    });
    if (profileError) throw profileError;

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Sign in via Supabase Auth (using the email convention)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@sentinel.local`,
      password,
    });
    if (error) return res.status(400).json({ error: 'Invalid credentials' });

    // Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      user: {
        id: profile?.id || data.user.id,
        username: profile?.username || username,
        role: profile?.role || 'Analyst',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Demo login – auto-creates the auth user on first call, then
// returns a JWT + profile.  Idempotent – safe to call repeatedly.
app.post('/api/auth/demo-login', async (_req, res) => {
  try {
    const DEMO_EMAIL = 'demo_user@sentinel.local';
    const DEMO_PASS  = 'demo_pass';

    // Try signing in first
    let { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASS,
    });

    // If auth user doesn't exist yet, create via admin API
    if (error) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASS,
        email_confirm: true,
      });
      if (createErr) throw createErr;

      // Ensure profile row exists
      await supabase.from('users').upsert({
        id: created.user.id,
        username: 'demo_user',
        role: 'Analyst',
      }, { onConflict: 'username' });

      // Sign in after creation
      const { data: retry, error: retryErr } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASS,
      });
      if (retryErr) throw retryErr;

      return res.json({
        token: retry.session.access_token,
        user: { id: created.user.id, username: 'demo_user', role: 'Analyst' },
      });
    }

    // Fetch or upsert profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('username', 'demo_user')
      .maybeSingle();

    if (!profile) {
      await supabase.from('users').upsert({
        id: data.user.id,
        username: 'demo_user',
        role: 'Analyst',
      }, { onConflict: 'username' });
    }

    res.json({
      token: data.session.access_token,
      user: {
        id: profile?.id || data.user.id,
        username: 'demo_user',
        role: profile?.role || 'Analyst',
      },
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
  }
});

// ── Protected data endpoints ──────────────────────────────────
// Each endpoint reads from Supabase with the service_role client
// (bypassing RLS) and returns JSON consumable by the frontend.

app.get('/api/logs', authenticate, async (_req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('logs')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    res.json({ logs: rows });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/threats', authenticate, async (_req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('threats')
      .select('*')
      .order('time', { ascending: false });
    if (error) throw error;
    res.json({ threats: rows });
  } catch (err) {
    console.error('Fetch threats error:', err);
    res.status(500).json({ error: 'Failed to fetch threats' });
  }
});

app.get('/api/incidents', authenticate, async (_req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created', { ascending: false });
    if (error) throw error;
    res.json({ incidents: rows });
  } catch (err) {
    console.error('Fetch incidents error:', err);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

app.get('/api/metrics', authenticate, async (_req, res) => {
  try {
    const { data: row, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    res.json({ metrics: row || {} });
  } catch (err) {
    console.error('Fetch metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// ── AI Copilot Chat ───────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const { metrics, threats, incidents } = context || {};

    await new Promise((r) => setTimeout(r, 800));

    let response =
      "I've analyzed the recent logs. No immediate anomalies detected in the current timeframe.";

    const q = message.toLowerCase();

    if (q.includes('status') || q.includes('report') || q.includes('summary')) {
      response = `Current SOC Status: We are processing ${metrics?.eventsPerSecond || 0} events per second across ${metrics?.activeEndpoints || 0} endpoints. There are currently ${metrics?.criticalAlerts || 0} critical alerts requiring attention.`;
    } else if (q.includes('threat') || q.includes('attack') || q.includes('sql') || q.includes('brute')) {
      const criticalThreats = (threats || []).filter(
        (t) => t.severity === 'Critical' || t.severity === 'High'
      );
      if (criticalThreats.length > 0) {
        const latest = criticalThreats[0];
        response = `I've identified ${criticalThreats.length} high/critical threats. The most recent is a [${latest.type}] from ${latest.source}. I recommend investigating this in the Incidents module.`;
      } else {
        response = "I don't see any critical threats in the recent timeline. The environment appears stable.";
      }
    } else if (q.includes('incident') || q.includes('case') || q.includes('open')) {
      const openIncidents = (incidents || []).filter((i) => i.status === 'Open');
      if (openIncidents.length > 0) {
        response = `You have ${openIncidents.length} open incidents. The most recent one is "${openIncidents[0].title}". You should assign this to an analyst immediately.`;
      } else {
        response = 'There are no open incidents at this time. Great job keeping the queue clean!';
      }
    } else if (metrics?.criticalAlerts > 0) {
      response = `I'm monitoring the environment. Please note we have ${metrics.criticalAlerts} critical alerts pending review. Let me know if you want me to analyze a specific vector.`;
    }

    res.json({ response });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// ── Socket.IO ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║     SENTINEL SIEM – Backend Server       ║');
  console.log('  ║     Powered by Supabase                  ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log(`  › Server running on http://localhost:${PORT}`);
  console.log(`  › Supabase: ${process.env.SUPABASE_URL || 'not configured'}`);
  console.log('');
});

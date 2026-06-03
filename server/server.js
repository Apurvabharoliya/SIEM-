import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize required tables if they don't exist
(async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Analyst'
      ) ENGINE=INNODB;
    `);
    // Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id VARCHAR(255) PRIMARY KEY,
        timestamp VARCHAR(255),
        source VARCHAR(255),
        level VARCHAR(50),
        message TEXT,
        path VARCHAR(255)
      ) ENGINE=INNODB;
    `);
    // Threats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS threats (
        id VARCHAR(255) PRIMARY KEY,
        time VARCHAR(255),
        source VARCHAR(255),
        type VARCHAR(255),
        severity VARCHAR(50),
        status VARCHAR(50)
      ) ENGINE=INNODB;
    `);
    // Incidents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        status VARCHAR(50),
        severity VARCHAR(50),
        assignee VARCHAR(255),
        created VARCHAR(255),
        type VARCHAR(255)
      ) ENGINE=INNODB;
    `);
    // Metrics table (single row storage)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INT PRIMARY KEY DEFAULT 1,
        criticalAlerts INT DEFAULT 0,
        eventsPerSecond INT DEFAULT 0,
        activeEndpoints INT DEFAULT 0
      ) ENGINE=INNODB;
    `);
    // Ensure a demo user exists
    const [demoRows] = await pool.query('SELECT id FROM users WHERE username = ?', ['demo_user']);
    if (demoRows.length === 0) {
      const demoPassword = await bcrypt.hash('demo_pass', 10);
      await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['demo_user', demoPassword, 'Analyst']);
      console.log('Demo user created: demo_user / demo_pass');
    }
  } catch (err) {
    console.error('Error initializing DB:', err);
  }
})();
(async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Analyst'
      ) ENGINE=INNODB;
    `);
    // Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id VARCHAR(255) PRIMARY KEY,
        timestamp VARCHAR(255),
        source VARCHAR(255),
        level VARCHAR(50),
        message TEXT,
        path VARCHAR(255)
      ) ENGINE=INNODB;
    `);
    // Ensure a demo user exists
    const [demoRows] = await pool.query('SELECT id FROM users WHERE username = ?', ['demo_user']);
    if (demoRows.length === 0) {
      const demoPassword = await bcrypt.hash('demo_pass', 10);
      await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['demo_user', demoPassword, 'Analyst']);
      console.log('Demo user created: demo_user / demo_pass');
    }
  } catch (err) {
    console.error('Error initializing DB:', err);
  }
})();

// MySQL tables are accessed directly via queries; no Mongoose schemas needed.

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// File upload endpoint – expects a JSON file with an array of log entries
app.post('/api/logs/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw); // [{id, timestamp, source, level, message, path}, ...]
    const conn = await pool.getConnection();
    try {
      const insertPromises = data.map(d => conn.query(
        'INSERT INTO logs (id, timestamp, source, level, message, path) VALUES (?, ?, ?, ?, ?, ?)',
        [d.id, d.timestamp, d.source, d.level, d.message, d.path]
      ));
      await Promise.all(insertPromises);
      io.emit('siem_event', { logs: data, metrics: { eventsPerSecond: data.length } });
    } finally {
      conn.release();
    }
    fs.unlinkSync(filePath);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role || 'Analyst']);
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT id, password, role FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Demo login – returns a token for a preset demo user without password
app.post('/api/auth/demo-login', async (req, res) => {
  try {
    const demoUsername = 'demo_user';
    const [rows] = await pool.query('SELECT id, role FROM users WHERE username = ?', [demoUsername]);
    if (rows.length === 0) return res.status(500).json({ error: 'Demo user not found' });
    const user = rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, username: demoUsername }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: demoUsername, role: user.role } });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Protected API routes – logs, threats, incidents, metrics
app.get('/api/logs', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM logs');
    res.json({ logs: rows });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/threats', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM threats');
    res.json({ threats: rows });
  } catch (err) {
    console.error('Fetch threats error:', err);
    res.status(500).json({ error: 'Failed to fetch threats' });
  }
});

app.get('/api/incidents', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM incidents');
    res.json({ incidents: rows });
  } catch (err) {
    console.error('Fetch incidents error:', err);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

app.get('/api/metrics', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM metrics WHERE id = 1');
    res.json({ metrics: rows[0] || {} });
  } catch (err) {
    console.error('Fetch metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});
app.post('/api/auth/demo-login', async (req, res) => {
  try {
    const demoUsername = 'demo_user';
    const [rows] = await pool.query('SELECT id, role FROM users WHERE username = ?', [demoUsername]);
    if (rows.length === 0) return res.status(500).json({ error: 'Demo user not found' });
    const user = rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, username: demoUsername }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: demoUsername, role: user.role } });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Middleware for checking auth
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

// AI Copilot Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const { metrics, threats, incidents } = context || {};
    await new Promise(resolve => setTimeout(resolve, 800));
    let response = "I've analyzed the recent logs. No immediate anomalies detected in the current timeframe.";
    const q = message.toLowerCase();
    if (q.includes('status') || q.includes('report') || q.includes('summary')) {
      response = `Current SOC Status: We are processing ${metrics?.eventsPerSecond || 0} events per second across ${metrics?.activeEndpoints || 0} endpoints. There are currently ${metrics?.criticalAlerts || 0} critical alerts requiring attention.`;
    } else if (q.includes('threat') || q.includes('attack') || q.includes('sql') || q.includes('brute')) {
      const criticalThreats = (threats || []).filter(t => t.severity === 'Critical' || t.severity === 'High');
      if (criticalThreats.length > 0) {
        const latest = criticalThreats[0];
        response = `I've identified ${criticalThreats.length} high/critical threats. The most recent is a [${latest.type}] from ${latest.source}. I recommend investigating this in the Incidents module.`;
      } else {
        response = "I don't see any critical threats in the recent timeline. The environment appears stable.";
      }
    } else if (q.includes('incident') || q.includes('case') || q.includes('open')) {
      const openIncidents = (incidents || []).filter(i => i.status === 'Open');
      if (openIncidents.length > 0) {
        response = `You have ${openIncidents.length} open incidents. The most recent one is "${openIncidents[0].title}". You should assign this to an analyst immediately.`;
      } else {
        response = "There are no open incidents at this time. Great job keeping the queue clean!";
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

// Socket.io connection handling – emit real-time events from DB change streams
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Emit log events directly after insertion; MySQL does not provide change streams.
  // Clients will receive events from the upload endpoint above.

  // Threat event emission can be added in respective endpoints when threats are created.

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

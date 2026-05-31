import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schemas & Models
const LogSchema = new mongoose.Schema({
  id: String,
  timestamp: String,
  source: String,
  level: String,
  message: String,
  path: String,
});
const ThreatSchema = new mongoose.Schema({
  id: String,
  time: String,
  source: String,
  type: String,
  severity: String,
  status: String,
});
const IncidentSchema = new mongoose.Schema({
  id: String,
  title: String,
  status: String,
  severity: String,
  assignee: String,
  created: String,
  type: String,
});
const MetricSchema = new mongoose.Schema({
  criticalAlerts: Number,
  eventsPerSecond: Number,
  activeEndpoints: Number,
});

const Log = mongoose.model('Log', LogSchema);
const Threat = mongoose.model('Threat', ThreatSchema);
const Incident = mongoose.model('Incident', IncidentSchema);
const Metric = mongoose.model('Metric', MetricSchema);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Analyst' }
});
const User = mongoose.model('User', UserSchema);

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
    const data = JSON.parse(raw); // assume [{id, timestamp, source, level, message, path}, ...]
    await Log.insertMany(data);
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
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
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

  // Watch for new Log entries
  Log.watch().on('change', change => {
    if (change.operationType === 'insert') {
      const doc = change.fullDocument;
      socket.emit('siem_event', { logs: [doc], metrics: { eventsPerSecond: 1 } });
    }
  });

  // Watch for new Threat entries
  Threat.watch().on('change', change => {
    if (change.operationType === 'insert') {
      const doc = change.fullDocument;
      socket.emit('siem_event', { threats: [doc], metrics: { criticalAlerts: 1, eventsPerSecond: 1 } });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

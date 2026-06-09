# Sentinel SIEM

A high-performance, full-stack Security Information and Event Management (SIEM) platform designed for real-time threat intelligence, log management, and incident response — powered by **Supabase**.

## Features

- **Real-Time Data Ingestion & Log Management**: View and filter high-volume log streams efficiently using UI virtualization (`react-window`).
- **Heuristic Correlation Engine**: Intelligent log parsing and automated security incident correlation.
- **Interactive Security Modules**: EDR/XDR, WAF, and Incident Response dashboards.
- **Live Event Simulation & WebSockets**: Dynamic data updates driven by a real-time event engine and Socket.IO.
- **Secure Authentication**: JWT-based authentication via Supabase Auth.
- **3D Cyber Visualization**: Immersive Three.js background with particle systems and animated data streams.

## Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- React Router (Routing)
- Recharts (Data Visualization)
- Socket.IO Client (Real-time events)
- React-Window (UI Virtualization)
- Three.js / @react-three/fiber (3D background)
- Lucide React (Icons)

### Backend
- **Node.js** & **Express** (REST API)
- **Socket.IO** (WebSockets)
- **Supabase** (Database, Auth, Realtime)

### Database
- **PostgreSQL** via **Supabase**
- Row-Level Security (RLS)
- Real-time subscriptions

## Project Structure

```
siem-/
├── src/                # Frontend React application
│   ├── components/     # UI components (Dashboard, Logs, Incidents, etc.)
│   ├── context/        # React context providers (Auth, GlobalState)
│   ├── index.css       # Global cyber-themed styles
│   └── App.tsx         # Root app with routing
├── server/             # Backend Node.js/Express application
│   ├── server.js       # Express server with Supabase integration
│   └── .env.example    # Backend env template
├── supabase/           # Database resources
│   └── schema.sql      # Full schema + seed data for Supabase
├── .env.example        # Frontend env template
└── README.md
```

## Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **A Supabase account** (free tier at [supabase.com](https://supabase.com))

### Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, navigate to the **SQL Editor** in the Supabase Dashboard.
3. Open `supabase/schema.sql` from this project, copy its contents, paste into the SQL Editor, and click **Run**.
   - This creates all tables (users, logs, threats, incidents, metrics), indexes, RLS policies, and seeds demo data.
4. Go to **Settings → API** and copy your:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public key**
   - **service_role key** (this is a secret — never expose it to the frontend!)

### Step 2: Configure Environment

**Backend** — Create `server/.env` from the template:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your Supabase credentials:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Frontend** — Create `.env` from the template:

```bash
cp .env.example .env
```

The default `VITE_API_URL=http://localhost:3001` should work out of the box.

### Step 3: Install & Run

**Install all dependencies:**

```bash
npm install
cd server && npm install && cd ..
```

**Start the backend server:**

```bash
cd server
npm run dev
```

The server starts on `http://localhost:3001`.

**Start the frontend (in a separate terminal):**

```bash
npm run dev
```

The Vite frontend is available at `http://localhost:5173`.

### Step 4: Log In

Click **Quick Demo Access** on the login screen to sign in instantly as `demo_user` / `demo_pass`.

---

## API Endpoints

| Method | Path                  | Auth Required | Description                        |
|--------|-----------------------|---------------|------------------------------------|
| POST   | `/api/auth/login`     | No            | Sign in with username + password   |
| POST   | `/api/auth/register`  | No            | Create a new account               |
| POST   | `/api/auth/demo-login`| No            | Instant demo login                 |
| GET    | `/api/health`         | No            | Health check                       |
| GET    | `/api/logs`           | Yes (JWT)     | Fetch all logs (newest first)      |
| GET    | `/api/threats`        | Yes (JWT)     | Fetch all threats (newest first)   |
| GET    | `/api/incidents`      | Yes (JWT)     | Fetch all incidents (newest first) |
| GET    | `/api/metrics`        | Yes (JWT)     | Fetch dashboard metrics            |
| POST   | `/api/chat`           | No            | AI Copilot chat (simulated)        |

## Auth Flow

1. The **Login** and **Register** pages call the backend Express API.
2. The backend uses the Supabase Admin API (`service_role`) to create users and verify credentials.
3. On success, the backend returns a **JWT** (from Supabase Auth) and a user profile.
4. The frontend stores the JWT in `localStorage` and attaches it as a `Bearer` token on subsequent API calls.
5. The backend middleware verifies the JWT using `supabase.auth.getUser()`.

## Demo Data

The `supabase/schema.sql` seeds the database with:

- **1 demo user** (`demo_user` / `demo_pass`)
- **15 sample logs** (various levels and sources)
- **10 sample threats** (SQLi, XSS, Brute Force, DDoS, etc.)
- **7 sample incidents** (Open, Investigating, Resolved)
- **1 metrics row** with live dashboard stats

The frontend **SimulationRunner** component also generates additional fake logs/threats/incidents client-side every few seconds while the app is running.

## Screenshots

| Dashboard | Log Explorer | Incidents |
|-----------|-------------|-----------|
| Real-time KPIs, threat timeline, attack vectors, live feed | KQL-style search, real-time log streaming, CSV export | Incident triage, status workflow, case management |

---

Built with ❤️ for security operations.

# SentinelIQ

SentinelIQ is a high-performance, full-stack Security Information and Event Management (SIEM) platform designed for real-time threat intelligence, log management, and incident response.

## Features

- **Real-Time Data Ingestion & Log Management**: View and filter high-volume log streams efficiently using UI virtualization (`react-window`).
- **Heuristic Correlation Engine**: Intelligent log parsing and automated security incident correlation.
- **Interactive Security Modules**: EDR/XDR, WAF, and Incident Response dashboards.
- **Live Event Simulation & WebSockets**: Dynamic data updates driven by a real-time event engine and Socket.IO.
- **Secure Authentication**: JWT-based user authentication and role-based access control.

## Tech Stack

### Frontend
- React 19 + TypeScript + Vite
- React Router (Routing)
- Recharts (Data Visualization)
- Socket.IO Client (Real-time updates)
- React-Window (UI Virtualization)
- Lucide React (Icons)

### Backend
- Node.js & Express
- MySQL (Database layer)
- Socket.IO (WebSockets)
- JWT (Authentication)
- bcrypt (Password Hashing)
- multer (File Uploads)

## Project Structure

```
siem-/
├── src/           # Frontend React application
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   └── ...
├── server/        # Backend Node.js/Express application
│   ├── server.js
│   ├── routes/
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MySQL instance running

### Installation

1. Clone the repository and install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

### Database Configuration

Create a `.env` file in the `server` directory and configure your MySQL connection:

```env
# server/.env
PORT=3001
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=siem
```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   The backend will run with `nodemon` for hot-reloading at `http://localhost:3001`.

2. **Start the Frontend Development Server**
   Open a new terminal and run:
   ```bash
   npm run dev
   ```
   The Vite frontend will be available at `http://localhost:5173`.

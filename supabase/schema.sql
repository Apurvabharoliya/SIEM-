-- ============================================================
-- SENTINEL SIEM – Supabase PostgreSQL Schema
-- ============================================================
-- How to use:
--   1. Go to your Supabase Dashboard → SQL Editor → New Query
--   2. Paste and run this entire file
--   3. Then go to Authentication → Settings → confirm email
--      confirmation is ON (we auto-confirm users via admin API)
-- ============================================================

-- ============================================================
-- 1. USERS TABLE
-- Supplementary profile data linked to auth.users via UUID PK.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(255) NOT NULL UNIQUE,
  role       VARCHAR(50)  NOT NULL DEFAULT 'Analyst',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. LOGS TABLE
-- Ingested log entries from various data sources.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.logs (
  id         VARCHAR(255) PRIMARY KEY,
  timestamp  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  source     VARCHAR(255),
  level      VARCHAR(50),
  message    TEXT,
  path       VARCHAR(255)
);

-- ============================================================
-- 3. THREATS TABLE
-- Threat intelligence events detected across the environment.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.threats (
  id         VARCHAR(255) PRIMARY KEY,
  time       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  source     VARCHAR(255),
  type       VARCHAR(255),
  severity   VARCHAR(50),
  status     VARCHAR(50)
);

-- ============================================================
-- 4. INCIDENTS TABLE
-- Security incidents created by analysts or automated
-- correlation.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incidents (
  id         VARCHAR(255) PRIMARY KEY,
  title      VARCHAR(255),
  status     VARCHAR(50),
  severity   VARCHAR(50),
  assignee   VARCHAR(255),
  created    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  type       VARCHAR(255)
);

-- ============================================================
-- 5. METRICS TABLE
-- Aggregated dashboard metrics (singleton, id = 1).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.metrics (
  id                INT PRIMARY KEY DEFAULT 1,
  critical_alerts    INT DEFAULT 0,
  events_per_second  INT DEFAULT 0,
  active_endpoints   INT DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_logs_level      ON public.logs (level);
CREATE INDEX IF NOT EXISTS idx_logs_source     ON public.logs (source);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp  ON public.logs (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_threats_severity ON public.threats (severity);
CREATE INDEX IF NOT EXISTS idx_threats_status   ON public.threats (status);
CREATE INDEX IF NOT EXISTS idx_threats_time     ON public.threats (time DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON public.incidents (created DESC);

-- ============================================================
-- SEED DATA
-- Populates the database with demo data so the UI feels alive
-- immediately after first login.
-- ============================================================

-- Demo user profile (linked to auth user created at demo-login)
INSERT INTO public.users (id, username, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo_user',
  'Analyst'
)
ON CONFLICT (username) DO NOTHING;

-- Seed metrics row
INSERT INTO public.metrics (id, critical_alerts, events_per_second, active_endpoints)
VALUES (1, 12, 847, 142)
ON CONFLICT (id) DO NOTHING;

-- Sample logs
INSERT INTO public.logs (id, timestamp, source, level, message, path) VALUES
  ('LOG-1001', now() - interval '2 minutes', 'Web Server (Nginx)', 'CRITICAL', 'SQL injection pattern detected in /api/v1/users query params', '/var/log/nginx/access.log'),
  ('LOG-1002', now() - interval '3 minutes', 'Auth Service', 'WARNING', 'Failed login attempt for user admin from IP 203.0.113.42', '/var/log/auth/sshd.log'),
  ('LOG-1003', now() - interval '4 minutes', 'Firewall', 'CRITICAL', 'Brute force pattern detected – 150+ requests from 198.51.100.7 in 60s', '/var/log/firewall/ids.log'),
  ('LOG-1004', now() - interval '5 minutes', 'WAF', 'INFO', 'Request allowed after CAPTCHA verification – /wp-login.php', '/var/log/waf/access.log'),
  ('LOG-1005', now() - interval '6 minutes', 'Database (PostgreSQL)', 'WARNING', 'Query execution time exceeded 2s threshold – slow query log', '/var/log/postgresql/postgres.log'),
  ('LOG-1006', now() - interval '8 minutes', 'Web Server (Nginx)', 'INFO', 'Rate limit applied to IP 45.33.32.156 – 200 OK', '/var/log/nginx/access.log'),
  ('LOG-1007', now() - interval '10 minutes', 'Auth Service', 'CRITICAL', 'XSS payload detected in login form: <script>alert(1)</script>', '/var/log/auth/webapp.log'),
  ('LOG-1008', now() - interval '12 minutes', 'WAF', 'INFO', 'Geo-blocked request from RU – /api/v2/endpoints', '/var/log/waf/geoip.log'),
  ('LOG-1009', now() - interval '15 minutes', 'Database (PostgreSQL)', 'INFO', 'Connection pool expanded from 20 to 50 due to load', '/var/log/postgresql/postgres.log'),
  ('LOG-1010', now() - interval '18 minutes', 'Web Server (Nginx)', 'WARNING', 'TLS handshake failed – outdated cipher suite from 10.0.0.45', '/var/log/nginx/error.log'),
  ('LOG-1011', now() - interval '22 minutes', 'Auth Service', 'INFO', 'User analyst@sentinel.local authenticated successfully', '/var/log/auth/sshd.log'),
  ('LOG-1012', now() - interval '25 minutes', 'Firewall', 'CRITICAL', 'DDoS traffic spike – 12 Gbps inbound from 12 source IPs', '/var/log/firewall/ddos.log'),
  ('LOG-1013', now() - interval '30 minutes', 'WAF', 'INFO', 'OWASP CRS rule 942100 triggered – SQLI detected in POST body', '/var/log/waf/owasp.log'),
  ('LOG-1014', now() - interval '35 minutes', 'Database (PostgreSQL)', 'WARNING', 'Replication lag exceeded 500ms on replica-2', '/var/log/postgresql/postgres.log'),
  ('LOG-1015', now() - interval '40 minutes', 'Web Server (Nginx)', 'INFO', 'Static asset cache hit ratio: 94.2%', '/var/log/nginx/access.log')
ON CONFLICT (id) DO NOTHING;

-- Sample threats
INSERT INTO public.threats (id, time, source, type, severity, status) VALUES
  ('THR-2024-001', now() - interval '2 minutes', '203.0.113.42', 'SQL Injection', 'Critical', 'Open'),
  ('THR-2024-002', now() - interval '4 minutes', '198.51.100.7', 'Brute Force', 'Critical', 'Investigating'),
  ('THR-2024-003', now() - interval '7 minutes', '10.0.1.88', 'Malware Signature Detected', 'High', 'Open'),
  ('THR-2024-004', now() - interval '10 minutes', '45.33.32.156', 'Cross-Site Scripting', 'High', 'Open'),
  ('THR-2024-005', now() - interval '15 minutes', '185.220.101.34', 'DDoS Attempt', 'Critical', 'Investigating'),
  ('THR-2024-006', now() - interval '22 minutes', '192.168.1.50', 'SQL Injection', 'Medium', 'Resolved'),
  ('THR-2024-007', now() - interval '28 minutes', '78.46.89.12', 'Brute Force', 'High', 'Open'),
  ('THR-2024-008', now() - interval '35 minutes', '10.0.0.45', 'Malware Signature Detected', 'Medium', 'Resolved'),
  ('THR-2024-009', now() - interval '45 minutes', '91.234.56.78', 'Cross-Site Scripting', 'Low', 'Resolved'),
  ('THR-2024-010', now() - interval '60 minutes', '203.0.113.99', 'DDoS Attempt', 'High', 'Resolved')
ON CONFLICT (id) DO NOTHING;

-- Sample incidents
INSERT INTO public.incidents (id, title, status, severity, assignee, created, type) VALUES
  ('INC-2024-001', 'Multiple failed logins detected – possible credential stuffing', 'Open', 'Critical', 'Unassigned', now() - interval '4 minutes', 'Brute Force'),
  ('INC-2024-002', 'SQLi probe from external IP targeting user DB', 'Open', 'High', 'Unassigned', now() - interval '2 minutes', 'Web Attack'),
  ('INC-2024-003', 'Unusual outbound traffic from endpoint 10.0.1.88', 'Open', 'High', 'Unassigned', now() - interval '7 minutes', 'C2 Beaconing'),
  ('INC-2024-004', 'DDoS mitigation activated – traffic redirected to scrubber', 'Investigating', 'Critical', 'SOC-Tier2', now() - interval '15 minutes', 'DDoS'),
  ('INC-2024-005', 'Suspected XSS campaign targeting login portal', 'Open', 'Medium', 'Unassigned', now() - interval '10 minutes', 'XSS'),
  ('INC-2024-006', 'High CPU utilization on DB replica-2 – investigate root cause', 'Resolved', 'Medium', 'SOC-Tier1', now() - interval '35 minutes', 'Performance'),
  ('INC-2024-007', 'TLS certificate expiry on edge proxy (5 days remaining)', 'Resolved', 'Low', 'SOC-Tier1', now() - interval '60 minutes', 'Compliance')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================
-- The service_role key (used by the backend) bypasses RLS by
-- default.  The policies below allow authenticated users (from
-- the frontend SDK) to read data directly when needed.
-- ============================================================

ALTER TABLE public.users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics   ENABLE ROW LEVEL SECURITY;

-- Users: authenticated users can read all profiles
CREATE POLICY "Authenticated users can read users"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Logs: read + insert for authenticated users
CREATE POLICY "Authenticated users can read logs"
  ON public.logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert logs"
  ON public.logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete logs"
  ON public.logs FOR DELETE
  USING (auth.role() = 'authenticated');

-- Threats: full CRUD for authenticated users
CREATE POLICY "Authenticated users can read threats"
  ON public.threats FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert threats"
  ON public.threats FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update threats"
  ON public.threats FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete threats"
  ON public.threats FOR DELETE
  USING (auth.role() = 'authenticated');

-- Incidents: full CRUD for authenticated users
CREATE POLICY "Authenticated users can read incidents"
  ON public.incidents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update incidents"
  ON public.incidents FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete incidents"
  ON public.incidents FOR DELETE
  USING (auth.role() = 'authenticated');

-- Metrics: read + update for authenticated users
CREATE POLICY "Authenticated users can read metrics"
  ON public.metrics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update metrics"
  ON public.metrics FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- Enable real-time subscriptions so the live dashboard feed
-- works without polling.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.threats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

-- ============================================================
-- VERIFICATION
-- Run these queries in the SQL Editor to confirm:
--   SELECT count(*) FROM public.logs;      --> 15
--   SELECT count(*) FROM public.threats;   --> 10
--   SELECT count(*) FROM public.incidents; --> 7
--   SELECT count(*) FROM public.metrics;   --> 1
--   SELECT * FROM public.users;            --> demo_user
-- ============================================================

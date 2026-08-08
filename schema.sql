-- Applied via: npm run db:migrate  (remote)  |  npm run db:migrate:local  (local)

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  url TEXT,
  ua TEXT,
  country TEXT,
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_ts ON feedback(ts DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_ip_ts ON feedback(ip, ts);

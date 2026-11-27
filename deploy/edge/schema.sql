CREATE TABLE IF NOT EXISTS curavex_subscriptions (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  monthly_limit INTEGER NOT NULL DEFAULT 5,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS curavex_monthly_usage (
  user_id TEXT NOT NULL,
  period_ym TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, period_ym)
);

CREATE TABLE IF NOT EXISTS curavex_enterprise_inquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NOT NULL,
  monthly_volume TEXT,
  requirements TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Esquema inicial SQL (PostgreSQL)

CREATE TABLE users (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('dm', 'player', 'admin')),
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  dm_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'presencial')),
  location_text TEXT,
  online_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  slots_total INT NOT NULL CHECK (slots_total > 0),
  price_per_player NUMERIC(6,2) NOT NULL CHECK (price_per_player >= 0.5 AND price_per_player <= 50.0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  enrollment_id UUID NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  gross_amount NUMERIC(8,2) NOT NULL CHECK (gross_amount >= 0),
  platform_fee NUMERIC(8,2) NOT NULL CHECK (platform_fee >= 0),
  dm_net_amount NUMERIC(8,2) NOT NULL CHECK (dm_net_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('captured', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  dm_id UUID NOT NULL REFERENCES users(id),
  payment_id UUID NOT NULL UNIQUE REFERENCES payments(id),
  amount NUMERIC(8,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX idx_enrollments_session ON enrollments(session_id);
CREATE INDEX idx_enrollments_player ON enrollments(player_id);

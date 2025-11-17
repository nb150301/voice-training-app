-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Gamification fields (for future phases, but schema now)
  streak_count INT DEFAULT 0,
  last_practice_date DATE,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create sessions table (for future Phase 4, but schema now)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration INT, -- seconds
  exercises_completed INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON sessions(user_id, created_at DESC);

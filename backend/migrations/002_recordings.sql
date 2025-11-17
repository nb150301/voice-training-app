-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  duration FLOAT NOT NULL DEFAULT 0,
  file_size BIGINT NOT NULL DEFAULT 0,
  pitch_hz FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_recordings_user_id ON recordings(user_id);

-- Create index on created_at for sorting
CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);

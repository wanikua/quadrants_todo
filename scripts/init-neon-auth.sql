-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create neon_auth schema
CREATE SCHEMA IF NOT EXISTS neon_auth;

-- Create users table
CREATE TABLE IF NOT EXISTS neon_auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON neon_auth.users(email);

-- Enable RLS
ALTER TABLE neon_auth.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY users_select_own ON neon_auth.users
  FOR SELECT
  USING (id::text = current_setting('app.user_id', true));

-- Create policy for users to update their own data
CREATE POLICY users_update_own ON neon_auth.users
  FOR UPDATE
  USING (id::text = current_setting('app.user_id', true));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION neon_auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON neon_auth.users
  FOR EACH ROW
  EXECUTE FUNCTION neon_auth.update_updated_at_column();

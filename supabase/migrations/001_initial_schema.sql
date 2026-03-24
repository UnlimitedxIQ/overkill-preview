CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE site_status AS ENUM (
  'draft', 'queued', 'planning', 'building', 'testing',
  'polishing', 'deploying', 'live', 'expired', 'failed'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status site_status NOT NULL DEFAULT 'draft',
  prompt TEXT NOT NULL,
  vibes TEXT[] DEFAULT '{}',
  sections JSONB DEFAULT '[]',
  user_assets TEXT[] DEFAULT '{}',
  deploy_url TEXT,
  source_zip_url TEXT,
  expires_at TIMESTAMPTZ,
  pipeline_log JSONB DEFAULT '[]',
  error_message TEXT,
  vercel_project_id TEXT,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_sites_status ON sites(status) WHERE status = 'queued';
CREATE INDEX idx_sites_expiration ON sites(expires_at) WHERE status = 'live';

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "sites_select_own" ON sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sites_insert_own" ON sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sites_update_own" ON sites
  FOR UPDATE USING (auth.uid() = user_id);

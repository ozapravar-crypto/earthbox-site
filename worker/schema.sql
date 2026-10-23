-- D1 (SQLite) schema for EarthBox accounts. Apply:
--   npx wrangler d1 execute earthbox --local  --file worker/schema.sql
--   npx wrangler d1 execute earthbox --remote --file worker/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  address    TEXT NOT NULL DEFAULT '',
  pincode    TEXT NOT NULL DEFAULT '',
  newsletter INTEGER NOT NULL DEFAULT 0,
  cart       TEXT NOT NULL DEFAULT '{"cart":[],"saved":[]}',   -- same shape as localStorage['earthbox-cart']
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- One-time sign-in codes. Only a hash is stored; rows older than an hour are swept on each new code.
CREATE TABLE IF NOT EXISTS codes (
  email      TEXT NOT NULL,
  ip         TEXT NOT NULL,
  hash       TEXT NOT NULL,
  tries      INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS codes_email ON codes(email, created_at);
CREATE INDEX IF NOT EXISTS codes_ip    ON codes(ip, created_at);

-- Sessions: the cookie holds a random token, the table holds its hash.
CREATE TABLE IF NOT EXISTS sessions (
  hash       TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

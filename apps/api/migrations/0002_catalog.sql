CREATE TABLE IF NOT EXISTS catalog_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  canonical_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'permanent',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT,
  UNIQUE(kind, canonical_key)
);

CREATE TABLE IF NOT EXISTS catalog_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  alias_name TEXT NOT NULL,
  alias_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(kind, alias_key),
  FOREIGN KEY(term_id) REFERENCES catalog_terms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catalog_adoptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term_id INTEGER NOT NULL,
  user_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(term_id, user_key),
  FOREIGN KEY(term_id) REFERENCES catalog_terms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_catalog_terms_kind_status ON catalog_terms(kind, status);
CREATE INDEX IF NOT EXISTS idx_catalog_aliases_kind_alias_key ON catalog_aliases(kind, alias_key);
CREATE INDEX IF NOT EXISTS idx_catalog_adoptions_term_id ON catalog_adoptions(term_id);

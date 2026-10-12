-- Migration 0003: Create media_files table for image storage
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_files_created ON media_files(created_at DESC);

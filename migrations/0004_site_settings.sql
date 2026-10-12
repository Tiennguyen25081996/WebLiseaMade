-- Migration 0004: Create site_settings table for syncing products, categories, home settings to D1
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

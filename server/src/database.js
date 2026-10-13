import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultDatabasePath = fileURLToPath(new URL('../data/research.db', import.meta.url));

export const paperColumns = `
  id, title, authors, journal,
  publication_year AS publicationYear,
  status, created_at AS createdAt, updated_at AS updatedAt
`;

export function openDatabase(databasePath = process.env.DB_PATH || defaultDatabasePath) {
  const location = databasePath === ':memory:' ? databasePath : resolve(databasePath);
  if (location !== ':memory:') mkdirSync(dirname(location), { recursive: true });

  const database = new Database(location);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(trim(title)) > 0),
      authors TEXT NOT NULL CHECK(length(trim(authors)) > 0),
      journal TEXT NOT NULL CHECK(length(trim(journal)) > 0),
      publication_year INTEGER NOT NULL CHECK(publication_year BETWEEN 1 AND 9999),
      status TEXT NOT NULL CHECK(status IN ('reading', 'read', 'published')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS papers_status_index ON papers(status);
  `);

  return database;
}

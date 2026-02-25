-- Schema for Personal Cloud System

CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'Project', 'Tutorial', 'Research', 'Note'
    description TEXT,
    content TEXT, -- For markdown or rich text body
    status TEXT DEFAULT 'draft',
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    description TEXT,
    folder_name TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert some dummy data for initial testing if empty
INSERT INTO content (title, type, description, status, progress)
SELECT 'Next.js Authentication Pattern', 'Tutorial', 'Best practices for securing App Router.', 'published', 100
WHERE NOT EXISTS (SELECT 1 FROM content WHERE id = 1);

INSERT INTO content (title, type, description, status, progress)
SELECT 'Project Phoenix UI Redesign', 'Project', 'Overhauling the dashboard aesthetic.', 'in_progress', 65
WHERE NOT EXISTS (SELECT 1 FROM content WHERE id = 2);

INSERT INTO content (title, type, description, status, progress)
SELECT 'Database Optimization Notes', 'Research', 'Findings on better-sqlite3 performance.', 'draft', 0
WHERE NOT EXISTS (SELECT 1 FROM content WHERE id = 3);

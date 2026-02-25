import { createClient } from '@libsql/client/web'; // VERCEL SAFE VERSION
import path from 'path';

// If TURSO_DATABASE_URL is provided, connect to Turso. Otherwise, use local file.
// For Vercel, it MUST be Turso because /web doesn't support local files. Local dev requires @libsql/client
const dbUrl = process.env.TURSO_DATABASE_URL || `file:cloud.db`;
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

// Create a mock or the real client depending on environment
let db;
try {
    if (process.env.TURSO_DATABASE_URL) {
        db = createClient({
            url: dbUrl,
            authToken: dbAuthToken,
        });
    } else {
        // Local fallback if running locally
        const { createClient: createLocalClient } = require('@libsql/client');
        db = createLocalClient({
            url: `file:${path.join(process.cwd(), 'cloud.db')}`
        });
    }
} catch (e) {
    console.error("Failed to initialize database client", e);
    // Export a fake db that throws so the page can catch it
    db = {
        execute: async () => { throw new Error("DB Client failed to initialize: " + e.message); },
        executeMultiple: async () => { throw new Error("DB Client failed to initialize: " + e.message); }
    };
}

export async function initDb() {
    // Only auto-initialize schema if we are using the local file database
    if (!process.env.TURSO_DATABASE_URL) {
        try {
            const fs = require('fs');
            const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                await db.executeMultiple(schema);
                console.log('Database schema initialized on local SQLite.');
            }
        } catch (err) {
            console.error('Failed to initialize local database schema:', err);
        }
    }
}

export default db;

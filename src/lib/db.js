import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

// Initialize connection. Use a persistent file in the project root by default.
const localDbPath = path.join(process.cwd(), 'cloud.db');

// If TURSO_DATABASE_URL is provided, connect to Turso. Otherwise, use local file.
// The file URL MUST start with "file:" for @libsql/client to recognize it as a local SQLite file.
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${localDbPath}`;
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: dbUrl,
    authToken: dbAuthToken,
});

// Since @libsql/client is async, we can't initialize the schema automatically on import.
// For local file usage, we can provide an initialization function if needed, 
// but for Turso, the schema should ideally be migrated independently.
export async function initDb() {
    // Only auto-initialize schema if we are using the local file database
    if (!process.env.TURSO_DATABASE_URL) {
        const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            try {
                // @libsql/client executeMultiple allows running multiple statements separated by ';'
                await db.executeMultiple(schema);
                console.log('Database schema initialized on local SQLite.');
            } catch (err) {
                console.error('Failed to initialize local database schema:', err);
            }
        }
    }
}

export default db;

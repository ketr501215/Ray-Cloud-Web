import { createClient } from '@libsql/client';
import fs from 'fs';

const dbUrl = "libsql://ray-cloud-db-ketr501215.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE5NzgwNzcsImlkIjoiMDE5YzkyMWMtZmUwMS03NTA0LTgxMGEtMWZhYzRkMDE4ZWU2IiwicmlkIjoiNTJlODM1MWYtNWJmYS00M2E5LTkxZTctYjU4MTQ3N2I1ZGI5In0.Ujd9NYie0B51ixwvlP_OoMnyyamvpe92rd4RqjRPoQHzCZ1xl6YUx7ooLruKIqHUaNpQAB-Rem_f_tYSWLSTBg";

const db = createClient({
    url: dbUrl,
    authToken: authToken,
});

async function run() {
    try {
        const schema = fs.readFileSync('./src/lib/schema.sql', 'utf8');
        await db.executeMultiple(schema);
        console.log("Remote database initialized successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Failed to initialize remote database:", err);
        process.exit(1);
    }
}

run();

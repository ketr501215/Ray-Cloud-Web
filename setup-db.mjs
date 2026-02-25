import fs from 'fs';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = fs.readFileSync('src/lib/schema.sql', 'utf8');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

client.executeMultiple(sql)
    .then(() => {
        console.log('✅ 資料庫表格建立成功！可以開始上傳了！');
        process.exit(0);
    })
    .catch(e => {
        console.error('❌ 建立失敗:', e);
        process.exit(1);
    });

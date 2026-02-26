import * as xlsx from 'xlsx';
import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentSemester } from '@/lib/semester';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const fileId = formData.get('fileId');

        if (!fileId) {
            return NextResponse.json({ success: false, error: "File ID is required" }, { status: 400 });
        }

        // Get file URL
        const result = await db.execute({
            sql: `SELECT url, category FROM files WHERE id = ?`,
            args: [fileId]
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
        }

        const file = result.rows[0];

        // Fetch file buffer from Blob
        const blobResponse = await fetch(file.url);
        if (!blobResponse.ok) {
            return NextResponse.json({ success: false, error: "Failed to fetch file from storage" }, { status: 500 });
        }

        const arrayBuffer = await blobResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse Excel - using raw: false to get formatted strings for dates where possible
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Assuming first sheet
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });

        const semester = getCurrentSemester();
        // Fallback category to default if not present
        const category = file.category && file.category !== '未分類' ? file.category : '校內計畫';
        let importedCount = 0;

        const batchStmts = [];

        for (const row of data) {
            // Find keys that align with our expected headers since exact match might vary by spaces/newlines
            const keys = Object.keys(row);
            const getVal = (headerSubstring) => {
                const key = keys.find(k => k.replace(/\\s/g, '').includes(headerSubstring.replace(/\\s/g, '')));
                return key ? row[key] : null;
            };

            const projectName = getVal('計畫名稱');
            if (!projectName || String(projectName).trim() === '') continue;

            const midTerm = getVal('期中成果報告');
            const finalTerm = getVal('期末成果報告');
            const reimbursement = getVal('核銷要求');
            let contact = getVal('承辦人員');
            if (!contact) contact = getVal('承辦人');

            const parseDate = (dateStr) => {
                if (!dateStr || String(dateStr).trim() === '') return null;
                try {
                    // Try parsing "MM/DD/YYYY" or "YYYY/MM/DD" returned by xlsx formatting
                    const norm = String(dateStr).replace(/-/g, '/').trim();
                    const parsed = new Date(norm);
                    if (!isNaN(parsed.getTime())) {
                        return parsed.toISOString().split('T')[0];
                    }
                    // Extract sequences that look like dates as a fallback (YYYY/MM/DD)
                    const match = norm.match(/(\\d{4})[\\/\\-](\\d{1,2})[\\/\\-](\\d{1,2})/);
                    if (match) {
                        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                    }
                } catch (e) { }
                return null;
            };

            const createNode = (suffix, dateStr) => {
                if (!dateStr || String(dateStr).trim() === '') return;

                const deadlineIso = parseDate(dateStr);
                const title = `[${projectName}] - ${suffix}`;
                const description = contact ? `聯絡窗口: ${contact}` : '';

                batchStmts.push({
                    sql: `INSERT INTO content (title, type, description, content, status, progress, semester, deadline, updated_at) 
                          VALUES (?, ?, ?, ?, 'draft', 0, ?, ?, CURRENT_TIMESTAMP)`,
                    args: [title, category, description, '', semester, deadlineIso]
                });
                importedCount++;
            };

            createNode('期中報告', midTerm);
            createNode('期末報告', finalTerm);
            createNode('核銷截止', reimbursement);
        }

        if (batchStmts.length > 0) {
            await db.batch(batchStmts, 'write');
            revalidatePath('/');
        }

        return NextResponse.json({ success: true, count: importedCount });
    } catch (err) {
        console.error("Excel Import Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

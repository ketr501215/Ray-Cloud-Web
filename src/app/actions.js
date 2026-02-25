'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { put, del } from '@vercel/blob';

export async function createContent(formData) {
    const title = formData.get('title');
    const type = formData.get('type');
    const description = formData.get('description');
    const content = formData.get('content') || '';
    const progress = parseInt(formData.get('progress') || '0', 10);
    const status = formData.get('status') || 'draft';

    if (!title || !type) {
        throw new Error('Title and Type are required');
    }

    const result = await db.execute({
        sql: `INSERT INTO content (title, type, description, content, status, progress, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [title, type, description, content, status, progress]
    });

    // Revalidate the home page to show the new content immediately
    revalidatePath('/');

    return { success: true, id: result.lastInsertRowid };
}

export async function deleteContent(id) {
    await db.execute({
        sql: `DELETE FROM content WHERE id = ?`,
        args: [id]
    });
    revalidatePath('/');
    return { success: true };
}

// Local FS imports are removed since we are using Vercel Blob

export async function uploadFile(formData) {
    const file = formData.get('file');
    const folderName = formData.get('folder_name');

    if (!file) {
        throw new Error('No file provided');
    }

    // Generate unique filename
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const rawFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniquePrefix}-${rawFileName}`;

    // Upload to Vercel Blob
    // We use put() which returns the uploaded blob URL immediately
    let blob;
    try {
        // Only require BLOB_READ_WRITE_TOKEN if we're actually trying to upload
        blob = await put(filename, file, {
            access: 'public',
        });
    } catch (err) {
        console.error('Vercel Blob Upload Failed:', err);
        throw new Error('Failed to upload file to Blob storage. Ensure BLOB_READ_WRITE_TOKEN is set.');
    }

    // Default to Uncategorized for semantic tracking
    let autoCategory = '未分類';

    // RETURN staged data instead of inserting into DB immediately
    return {
        success: true,
        stagedFile: {
            filename: filename,            // Storing the unique filename pattern
            original_name: file.name,
            mime_type: file.type || blob.contentType || 'application/octet-stream',
            size: file.size,
            url: blob.url,                 // Using the permanent Blob URL
            category: autoCategory,
            description: '',
            folder_name: folderName || null // Pass back the folder name if it exists
        }
    };
}

export async function confirmUploads(stagedFiles) {
    if (!stagedFiles || !Array.isArray(stagedFiles) || stagedFiles.length === 0) {
        throw new Error('No files to confirm');
    }

    const sqlStatement = `
        INSERT INTO files (filename, original_name, mime_type, size, url, category, description, folder_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Try to batch execute for "@libsql/client"
    const batchStatements = stagedFiles.map(f => ({
        sql: sqlStatement,
        args: [f.filename, f.original_name, f.mime_type, f.size, f.url, f.category, f.description, f.folder_name]
    }));

    try {
        await db.batch(batchStatements, 'write');
        revalidatePath('/');
        return { success: true };
    } catch (err) {
        console.error('Batch insert failed', err);
        throw new Error('Database insertion failed for confirmed files.');
    }
}

export async function updateFileCategory(fileId, newCategory) {
    if (!fileId || !newCategory) {
        throw new Error('File ID and new category are required.');
    }

    try {
        const result = await db.execute({
            sql: `UPDATE files SET category = ? WHERE id = ?`,
            args: [newCategory, fileId]
        });

        if (result.rowsAffected > 0) {
            revalidatePath('/');
            revalidatePath(`/category/${encodeURIComponent(newCategory)}`);
            return { success: true };
        } else {
            return { success: false, error: 'File not found.' };
        }
    } catch (err) {
        console.error('Update category failed', err);
        return { success: false, error: 'Failed to update category.' };
    }
}

export async function deleteUploadedFile(fileId) {
    if (!fileId) {
        throw new Error('File ID is required for deletion.');
    }

    // Find the file's url to delete it from Blob storage
    const findResult = await db.execute({
        sql: `SELECT url, category FROM files WHERE id = ?`,
        args: [fileId]
    });
    const fileRecord = findResult.rows[0];

    if (!fileRecord) {
        return { success: false, error: 'File not found in database.' };
    }

    try {
        // 1. Delete the file from Vercel Blob using its URL
        if (fileRecord.url && fileRecord.url.includes('blob.vercel-storage.com')) {
            try {
                await del(fileRecord.url);
            } catch (blobErr) {
                console.warn(`File at ${fileRecord.url} could not be deleted from Blob`, blobErr);
                // We ignore Blob errors to allow the DB entry to still be cleaned up
            }
        }

        // 2. Delete the database record
        await db.execute({
            sql: `DELETE FROM files WHERE id = ?`,
            args: [fileId]
        });

        // 3. Revalidate affected pages
        revalidatePath('/');
        if (fileRecord.category) {
            revalidatePath(`/category/${encodeURIComponent(fileRecord.category)}`);
        }

        return { success: true };
    } catch (err) {
        console.error('File deletion failed', err);
        return { success: false, error: 'Internal server error during deletion.' };
    }
}

import db from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { id } = await params;

    if (!id) {
        return new NextResponse("File ID is required", { status: 400 });
    }

    try {
        const result = await db.execute({
            sql: `SELECT url, original_name, mime_type FROM files WHERE id = ?`,
            args: [id]
        });

        if (result.rows.length === 0) {
            return new NextResponse("File not found", { status: 404 });
        }

        const file = result.rows[0];

        // Fetch the file content from Vercel Blob
        const blobResponse = await fetch(file.url);

        if (!blobResponse.ok) {
            return new NextResponse("Failed to fetch file from storage", { status: 500 });
        }

        // Properly encode the filename to support Chinese/special characters
        const encodedFileName = encodeURIComponent(file.original_name);
        // Fallback for older browsers
        const asciiFileName = file.original_name.replace(/[^a-zA-Z0-9.-]/g, '_');

        const headers = new Headers();
        headers.set('Content-Type', file.mime_type || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodedFileName}`);

        // Return the stream with our own headers forcing download with correct name
        return new NextResponse(blobResponse.body, {
            status: 200,
            headers
        });
    } catch (err) {
        console.error("Download APi Error:", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { createClient } = await import('@libsql/client/web');
        return NextResponse.json({
            status: "OK",
            libsql: "Imported successfully",
            tursoUrl: process.env.TURSO_DATABASE_URL ? "SET" : "NOT SET",
            tursoAuth: process.env.TURSO_AUTH_TOKEN ? "SET" : "NOT SET",
            blobToken: process.env.BLOB_READ_WRITE_TOKEN ? "SET" : "NOT SET"
        });
    } catch (e) {
        return NextResponse.json({
            status: "ERROR",
            message: e.message,
            stack: e.stack
        }, { status: 500 });
    }
}

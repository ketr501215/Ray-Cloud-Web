import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Authenticate the user here if needed
                return {
                    // No allowedContentTypes specified to allow all files
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // This is executed on the server after the browser uploads directly to Vercel Blob
                console.log('Client Upload Completed:', blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}

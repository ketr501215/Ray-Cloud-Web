'use client';

import { useState } from 'react';
import { deleteUploadedFile } from '@/app/actions';

export default function DeleteFileButton({ fileId, fileName }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        const confirmed = window.confirm(`Are you sure you want to permanently delete "${fileName}"?\nThis action cannot be undone and the physical file will be removed.`);
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const result = await deleteUploadedFile(fileId);
            if (!result.success) {
                alert(result.error || 'Failed to delete file.');
                setIsDeleting(false);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while deleting.');
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.5 : 0.8,
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                borderRadius: '4px'
            }}
            onMouseOver={(e) => {
                if (!isDeleting) {
                    e.currentTarget.style.color = '#ef4444'; // Red hover
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.opacity = '1';
                }
            }}
            onMouseOut={(e) => {
                if (!isDeleting) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.opacity = '0.8';
                }
            }}
            title="Delete this file"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        </button>
    );
}

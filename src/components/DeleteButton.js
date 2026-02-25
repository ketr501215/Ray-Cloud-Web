'use client';

import { deleteContent } from '@/app/actions';

export default function DeleteButton({ id }) {
    return (
        <button
            onClick={async (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this entry?')) {
                    await deleteContent(id);
                }
            }}
            style={{
                color: '#ff4d4f',
                fontSize: '0.85rem',
                fontWeight: '500',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 77, 79, 0.3)',
                background: 'rgba(255, 77, 79, 0.1)'
            }}
        >
            Delete
        </button>
    );
}

'use client';

import { useState } from 'react';

export default function ImportExcelButton({ fileId, fileName }) {
    const [isImporting, setIsImporting] = useState(false);

    // Only show for .xlsx files
    if (!fileName || !fileName.toLowerCase().endsWith('.xlsx')) {
        return null;
    }

    const handleImport = async () => {
        if (!confirm(`Are you sure you want to extract tracking nodes from\\n"${fileName}"?\\n\\nThis will automatically generate Mid-Term, Final, and Reimbursement tasks for each project.`)) {
            return;
        }

        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('fileId', fileId);

            const response = await fetch('/api/import-excel', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`Successfully imported ${result.count} tracking items from the Excel file.`);
                window.location.reload(); // Reload to see new items on dashboard
            } else {
                alert(`Import failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Import Error:', error);
            alert('An error occurred during import.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <button
            onClick={handleImport}
            disabled={isImporting}
            style={{
                width: '100%',
                padding: '0.6rem 1rem',
                background: 'rgba(16, 185, 129, 0.1)', // Tailwind emerald-500 semantic
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2sease',
                marginTop: '1rem',
                opacity: isImporting ? 0.7 : 1
            }}
            title="Parse Excel and create tracking tasks"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            {isImporting ? 'Importing...' : 'Extract to Tracking'}
        </button>
    );
}

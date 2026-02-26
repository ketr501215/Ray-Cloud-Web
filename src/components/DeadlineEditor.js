'use client';

import { useState } from 'react';
import { updateFileDeadline } from '@/app/actions';
import { getCurrentSemester, getSemesterDates } from '@/lib/semester';

export default function DeadlineEditor({ fileId, initialDeadline, type = 'file' }) {
    const [isEditing, setIsEditing] = useState(false);
    const [deadline, setDeadline] = useState(initialDeadline ? new Date(initialDeadline).toISOString().split('T')[0] : '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateFileDeadline(fileId, deadline, type);
            if (result.success) {
                setIsEditing(false);
            } else {
                alert(result.error || 'Failed to update deadline.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const displayDate = deadline ? new Date(deadline).toLocaleDateString() : 'Set Deadline';

    // Calculate if it's urgent (within 3 days)
    const isUrgent = deadline && new Date(deadline).getTime() - new Date().getTime() <= 3 * 24 * 60 * 60 * 1000;
    const isOverdue = deadline && new Date(deadline).getTime() < new Date().getTime();

    let color = 'var(--text-secondary)';
    if (isOverdue) color = '#ef4444'; // Red
    else if (isUrgent) color = '#f59e0b'; // Orange

    if (isEditing) {
        return (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: 'auto' }}>
                <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    disabled={isSaving}
                    style={{
                        padding: '0.4rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--text-primary)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        flexGrow: 1,
                        colorScheme: 'dark'
                    }}
                />
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        padding: '0.4rem 0.8rem',
                        background: 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        opacity: isSaving ? 0.6 : 1
                    }}
                >
                    Save
                </button>
                <button
                    onClick={() => {
                        const sem = getCurrentSemester();
                        const dates = getSemesterDates(sem);
                        if (dates) setDeadline(dates.end);
                    }}
                    disabled={isSaving}
                    style={{
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--accent-color)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                    title="Set to end of current semester"
                >
                    Sem End
                </button>
                <button
                    onClick={() => {
                        setDeadline(initialDeadline ? new Date(initialDeadline).toISOString().split('T')[0] : '');
                        setIsEditing(false);
                    }}
                    disabled={isSaving}
                    style={{
                        padding: '0.4rem 0.8rem',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                padding: '0.3rem 0',
                opacity: 0.8,
                transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
            onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
            title="Click to edit deadline"
        >
            <span style={{ fontSize: '0.75rem', color: color, fontWeight: isUrgent || isOverdue ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {displayDate}
            </span>
        </div>
    );
}

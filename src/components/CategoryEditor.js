'use client';

import { useState } from 'react';
import { updateFileCategory } from '@/app/actions';

const CATEGORIES = [
    "未分類",
    "校內計畫",
    "校外計畫",
    "教學資料",
    "期刊投稿",
    "演講分享",
    "自我成長",
    "Document",
    "Image",
    "Video",
    "Archive",
    "Other"
];

export default function CategoryEditor({ fileId, initialCategory }) {
    const [isEditing, setIsEditing] = useState(false);
    const [category, setCategory] = useState(initialCategory || "未分類");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (newCategory) => {
        setIsSaving(true);
        try {
            const result = await updateFileCategory(fileId, newCategory);
            if (result.success) {
                setCategory(newCategory);
                setIsEditing(false);
            } else {
                alert(result.error || 'Failed to update category.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: 'auto' }}>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSaving}
                    style={{
                        padding: '0.4rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--text-primary)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        flexGrow: 1
                    }}
                >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                    onClick={() => handleSave(category)}
                    disabled={isSaving || category === initialCategory}
                    style={{
                        padding: '0.4rem 0.8rem',
                        background: 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: (isSaving || category === initialCategory) ? 'not-allowed' : 'pointer',
                        opacity: (isSaving || category === initialCategory) ? 0.6 : 1
                    }}
                >
                    Save
                </button>
                <button
                    onClick={() => {
                        setCategory(initialCategory);
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
                marginTop: 'auto',
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
            title="Click to edit category"
        >
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                {category}
            </span>
        </div>
    );
}

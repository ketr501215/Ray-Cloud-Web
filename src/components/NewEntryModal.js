'use client';

import { useState } from 'react';
import { createContent } from '@/app/actions';
import styles from './NewEntryModal.module.css';

export default function NewEntryModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(formData) {
        setIsSubmitting(true);
        try {
            await createContent(formData);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create content:', error);
            alert('Error creating entry.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
                New Entry
            </button>

            {isOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
                    <div
                        className={`glass-panel ${styles.modalContent} animate-fade-in`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Add New Entry</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={styles.closeBtn}
                            >
                                &times;
                            </button>
                        </div>

                        <form action={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    placeholder="e.g. Next.js App Router Guide"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="type">Type</label>
                                <select id="type" name="type" className={styles.input} required>
                                    <option value="Project">Project</option>
                                    <option value="Tutorial">Tutorial</option>
                                    <option value="Research">Research</option>
                                    <option value="Note">Note</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="description">Description (Short)</label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    placeholder="Brief summary..."
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="progress">Progress (%)</label>
                                <input
                                    type="number"
                                    id="progress"
                                    name="progress"
                                    min="0"
                                    max="100"
                                    defaultValue="0"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

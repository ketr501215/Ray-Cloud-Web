'use client';

import { useState, useRef } from 'react';
import { uploadFile, confirmUploads } from '@/app/actions';
import styles from './FileUploadArea.module.css';

export default function FileUploadArea({ onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [stagedFiles, setStagedFiles] = useState([]); // Holds files waiting for confirmation
    const [isConfirming, setIsConfirming] = useState(false); // UI state for the staging modal
    const [preSelectedCategory, setPreSelectedCategory] = useState("未分類"); // Sidebar pre-selection
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    // Helper to extract files from directory entries recursively
    const getFilesFromEntry = async (entry) => {
        if (entry.isFile) {
            return new Promise((resolve) => {
                entry.file(file => resolve([file]));
            });
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            let allFiles = [];

            const readEntries = () => {
                return new Promise((resolve, reject) => {
                    dirReader.readEntries(async (entries) => {
                        if (entries.length === 0) {
                            resolve([]);
                        } else {
                            const entryPromises = entries.map(getFilesFromEntry);
                            const filesArrays = await Promise.all(entryPromises);
                            // Flatten array of arrays
                            const files = filesArrays.reduce((acc, val) => acc.concat(val), []);

                            // Recursively call readEntries until it returns an empty array (spec requirement)
                            const moreFiles = await readEntries();
                            resolve(files.concat(moreFiles));
                        }
                    }, reject);
                });
            };

            return readEntries();
        }
        return [];
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        let allExtractedFiles = [];
        let isFolderUpload = false;

        if (e.dataTransfer.items) {
            // Modern DataTransferItem API (Supports Directories)
            const items = Array.from(e.dataTransfer.items);

            // Detect if this drop contains at least one folder
            isFolderUpload = items.some(item => {
                if (item.kind !== 'file') return false;
                const entry = item.webkitGetAsEntry();
                return entry && entry.isDirectory;
            });

            const entryPromises = items
                .filter(item => item.kind === 'file')
                .map(item => {
                    const entry = item.webkitGetAsEntry();
                    return entry ? getFilesFromEntry(entry) : Promise.resolve([]);
                });

            const filesArrays = await Promise.all(entryPromises);
            allExtractedFiles = filesArrays.reduce((acc, val) => acc.concat(val), []);
        } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Fallback for older browsers
            allExtractedFiles = Array.from(e.dataTransfer.files);
        }

        if (allExtractedFiles.length > 0) {
            await processUpload(allExtractedFiles, isFolderUpload);
        }
    };

    const handleChange = async (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            // When using webkitdirectory, files will have a webkitRelativePath indicating folder structure
            const isFolderUpload = Array.from(e.target.files).some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
            await processUpload(Array.from(e.target.files), isFolderUpload);
        }
    };

    // Step 1: Upload to Server (Staging or Auto-Confirm)
    const processUpload = async (files, isFolderUpload = false) => {
        setIsUploading(true);
        setUploadProgress(10);

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 15, 90));
        }, 200);

        try {
            const uploadPromises = files.map(file => {
                const formData = new FormData();
                formData.append('file', file);

                // If it's from a folder, extract the root folder name
                if (file.webkitRelativePath) {
                    const parts = file.webkitRelativePath.split('/');
                    if (parts.length > 1) {
                        formData.append('folder_name', parts[0]);
                    }
                }

                return uploadFile(formData);
            });

            const results = await Promise.all(uploadPromises);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Filter out any failed uploads, keep only the stagedFile objects
            const successfulUploads = results
                .filter(r => r.success)
                .map(r => ({
                    ...r.stagedFile,
                    category: preSelectedCategory // Apply the sidebar pre-selection automatically
                }));

            if (successfulUploads.length > 0) {
                if (isFolderUpload) {
                    // Auto-confirm logic for entire folders
                    setIsConfirming(true);
                    try {
                        const result = await confirmUploads(successfulUploads);
                        if (result.success) {
                            if (onUploadComplete) onUploadComplete(successfulUploads);
                            // Refresh layout/page silently by setting upload progress to 0 and ending the upload state
                            setTimeout(() => {
                                setIsUploading(false);
                                setUploadProgress(0);
                                window.location.reload(); // Quick explicit refresh to show new files immediately in dashboard
                            }, 500);
                        }
                    } catch (e) {
                        console.error('Auto-confirm Error:', e);
                        alert('Failed to automatically save the folder contents.');
                        setIsUploading(false);
                        setUploadProgress(0);
                    } finally {
                        setIsConfirming(false);
                    }
                } else {
                    // Regular staging flow for single/multiple individual files
                    setTimeout(() => {
                        setStagedFiles(successfulUploads);
                        setIsUploading(false);
                        setUploadProgress(0);
                    }, 500);
                }
            } else {
                setIsUploading(false);
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error('File Upload Error:', err);
            alert('Failed to upload one or more files.');
            setIsUploading(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Step 2: Handle changes in the Staging UI
    const handleStagedChange = (index, field, value) => {
        const updatedFiles = [...stagedFiles];
        updatedFiles[index][field] = value;
        setStagedFiles(updatedFiles);
    };

    const cancelStaging = () => {
        setStagedFiles([]);
    };

    // Step 3: Confirm and save to Database
    const finalizeUploads = async () => {
        setIsConfirming(true);
        try {
            const result = await confirmUploads(stagedFiles);
            if (result.success) {
                setStagedFiles([]); // Clear staging
                if (onUploadComplete) onUploadComplete(stagedFiles);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to confirm and save files to database.');
        } finally {
            setIsConfirming(false);
        }
    };

    // Render Staging UI if there are files waiting for confirmation
    if (stagedFiles.length > 0) {
        return (
            <div className={styles.stagingContainer}>
                <h3 className={styles.stagingTitle}>Confirm Uploads ({stagedFiles.length})</h3>
                <p className={styles.stagingSubtitle}>Review AI-assigned categories and add descriptions before saving.</p>

                <div className={styles.stagedList}>
                    {stagedFiles.map((file, idx) => (
                        <div key={idx} className={styles.stagedItem}>
                            <div className={styles.stagedItemInfo}>
                                <span className={styles.stagedItemName}>
                                    {file.original_name}
                                    {file.webkitRelativePath && (
                                        <span className={styles.folderBadge}>📁 {file.webkitRelativePath.split('/')[0]}</span>
                                    )}
                                </span>
                                <span className={styles.stagedItemSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            <div className={styles.stagedItemControls}>
                                <select
                                    value={file.category}
                                    onChange={(e) => handleStagedChange(idx, 'category', e.target.value)}
                                    className={styles.stagedSelect}
                                >
                                    <option value="未分類">未分類 (Uncategorized)</option>
                                    <option value="校內計畫">校內計畫 (Internal Proj.)</option>
                                    <option value="校外計畫">校外計畫 (External Proj.)</option>
                                    <option value="教學資料">教學資料 (Teaching Resources)</option>
                                    <option value="期刊投稿">期刊投稿 (Journal Sub.)</option>
                                    <option value="演講分享">演講分享 (Lectures/Sharing)</option>
                                    <option value="自我成長">自我成長 (Self-Growth)</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Add an optional description..."
                                    value={file.description}
                                    onChange={(e) => handleStagedChange(idx, 'description', e.target.value)}
                                    className={styles.stagedInput}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.stagingActions}>
                    <button onClick={cancelStaging} className={styles.btnCancel} disabled={isConfirming}>Cancel</button>
                    <button onClick={finalizeUploads} className={styles.btnConfirm} disabled={isConfirming}>
                        {isConfirming ? 'Saving...' : 'Confirm & Save'}
                    </button>
                </div>
            </div>
        );
    }

    // Render original Drag and Drop UI
    return (
        <div className={styles.uploadContainer}>
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Pre-select Category:</label>
                <select
                    value={preSelectedCategory}
                    onChange={(e) => setPreSelectedCategory(e.target.value)}
                    className={styles.stagedSelect}
                    style={{ width: '100%', padding: '0.6rem', background: 'rgba(255,255,255,0.05)' }}
                >
                    <option value="未分類">未分類 (Uncategorized)</option>
                    <option value="校內計畫">校內計畫 (Internal Proj.)</option>
                    <option value="校外計畫">校外計畫 (External Proj.)</option>
                    <option value="教學資料">教學資料 (Teaching Resources)</option>
                    <option value="期刊投稿">期刊投稿 (Journal Sub.)</option>
                    <option value="演講分享">演講分享 (Lectures/Sharing)</option>
                    <option value="自我成長">自我成長 (Self-Growth)</option>
                </select>
            </div>

            <input
                type="file"
                multiple
                webkitdirectory="true"
                ref={fileInputRef}
                onChange={handleChange}
                className={styles.hiddenInput}
                style={{ display: 'none' }}
            />

            <div
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {!isUploading ? (
                    <div className={styles.idleState}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className={styles.primaryText}>Click or drag to upload files & folders</p>
                        <p className={styles.secondaryText}>Folders will be recursively scanned for files</p>
                    </div>
                ) : (
                    <div className={styles.uploadingState}>
                        <div className={styles.progressRing}>
                            <svg className={styles.circularChart} viewBox="0 0 36 36">
                                <path className={styles.circleBg}
                                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path className={styles.circle}
                                    strokeDasharray={`${uploadProgress}, 100`}
                                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className={styles.percentageText}>{uploadProgress}%</div>
                        </div>
                        <p className={styles.primaryText}>Uploading to Staging...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

import db from '@/lib/db';
import styles from '@/app/page.module.css';
import Link from 'next/link';
import CategoryEditor from '@/components/CategoryEditor';
import DeleteFileButton from '@/components/DeleteFileButton';

export const dynamic = 'force-dynamic';

export default async function AllFilesPage() {
    // Fetch all files from the database, grouped by folder if applicable
    // Similar to the dashboard query, but without LIMIT 6
    const fileResult = await db.execute(`
        SELECT
            MAX(id) as id,
            MAX(original_name) as original_name,
            MAX(url) as url,
            MAX(description) as description,
            MAX(category) as category,
            folder_name,
            COUNT(*) as file_count,
            SUM(size) as size,
            MAX(created_at) as created_at
        FROM files
        GROUP BY COALESCE(folder_name, id)
        ORDER BY created_at DESC
    `);
    const allFiles = fileResult.rows;

    return (
        <main className={styles.main}>
            <nav className={styles.navbar}>
                <div className={styles.logo}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <span className="text-gradient">Ray Cloud</span>
                    </Link>
                </div>
            </nav>

            <div className={`container ${styles.dashboardContainer}`} style={{ gridTemplateColumns: '1fr', marginTop: '6rem' }}>
                <div className={styles.mainContent}>
                    <section className={styles.dashboardPreview}>
                        <div className="flex-between" style={{ alignItems: 'flex-end', marginBottom: '2rem' }}>
                            <div>
                                <Link href="/" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}>
                                    ← Back to Dashboard
                                </Link>
                                <h2 className={styles.sectionTitle} style={{ fontSize: '2rem', marginTop: 0 }}>
                                    All <span className="text-gradient">Uploads</span>
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Found {allFiles.length} file bundles in your cloud.
                                </p>
                            </div>
                        </div>

                        {allFiles.length > 0 ? (
                            <div className="grid-auto mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                                {allFiles.map((file, idx) => {
                                    const isFolder = !!file.folder_name;
                                    const CardWrapper = isFolder ? 'div' : 'a';
                                    const wrapperProps = isFolder
                                        ? { className: `glass-panel animate-fade-in animate-delay-${Math.min((idx % 3) + 1, 3)}`, style: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' } }
                                        : { href: `/api/download/${file.id}?t=${Date.now()}`, download: file.original_name, target: '_blank', rel: 'noopener noreferrer', className: `glass-panel animate-fade-in animate-delay-${Math.min((idx % 3) + 1, 3)}`, style: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textDecoration: 'none', position: 'relative' } };

                                    return (
                                        <CardWrapper key={file.id || idx} {...wrapperProps}>
                                            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                                                {file.category}
                                            </div>

                                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                                {isFolder ? (
                                                    <span style={{ fontSize: '2rem', lineHeight: '1' }}>📁</span>
                                                ) : (
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                    </svg>
                                                )}
                                            </div>

                                            <h4 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', marginBottom: 0 }}>
                                                {isFolder ? file.folder_name : file.original_name}
                                            </h4>

                                            {isFolder && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', margin: '0 0 0.25rem 0', fontWeight: '500' }}>
                                                    {file.file_count} Files Included
                                                </p>
                                            )}

                                            {!isFolder && file.description && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {file.description}
                                                </p>
                                            )}

                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 'auto' }}>
                                                {Math.round(file.size / 1024)} KB • {new Date(file.created_at).toLocaleDateString()}
                                            </span>

                                            {/* We only render the editor/delete for individual files right now outside of the category grid to keep it clean */}
                                            {!isFolder && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <CategoryEditor fileId={file.id} initialCategory={file.category} />
                                                    <DeleteFileButton fileId={file.id} fileName={file.original_name} />
                                                </div>
                                            )}
                                        </CardWrapper>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <p>No files uploaded yet.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

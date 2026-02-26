import db from '@/lib/db';
import styles from '@/app/page.module.css';
import Link from 'next/link';
import CategoryEditor from '@/components/CategoryEditor';
import DeleteFileButton from '@/components/DeleteFileButton';
import DeadlineEditor from '@/components/DeadlineEditor';
import ImportExcelButton from '@/components/ImportExcelButton';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }) {
    const { name } = await params;
    const categoryName = decodeURIComponent(name);

    // Fetch files belonging to this category, grouped by folder if applicable
    const result = await db.execute({
        sql: `
            SELECT
                MAX(id) as id,
                MAX(original_name) as original_name,
                MAX(url) as url,
                MAX(description) as description,
                MAX(category) as category,
                folder_name,
                COUNT(*) as file_count,
                SUM(size) as size,
                MAX(created_at) as created_at,
                MAX(deadline) as deadline
            FROM files 
            WHERE category = ? 
            GROUP BY COALESCE(folder_name, id)
            ORDER BY created_at DESC
        `,
        args: [categoryName]
    });
    const files = result.rows;

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
                                    Category: <span className="text-gradient">{categoryName}</span>
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Found {files.length} file{files.length === 1 ? '' : 's'} in this category.
                                </p>
                            </div>
                        </div>

                        {files.length > 0 ? (
                            <div className="grid-auto mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                                {files.map((file, idx) => {
                                    const isFolder = !!file.folder_name;
                                    const CardWrapper = isFolder ? 'div' : 'a';
                                    const contentProps = isFolder
                                        ? { style: { textDecoration: 'none', color: 'inherit' } }
                                        : { href: `/api/download/${file.id}?t=${Date.now()}`, download: file.original_name, target: "_blank", rel: "noopener noreferrer", style: { textDecoration: 'none', color: 'inherit', display: 'block' } };

                                    return (
                                        <div
                                            key={file.id}
                                            className={`glass-panel animate-fade-in animate-delay-${Math.min((idx % 3) + 1, 3)}`}
                                            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}
                                        >
                                            <CardWrapper {...contentProps}>
                                                <div style={{ padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'center', margin: '-1.25rem -1.25rem 0.5rem -1.25rem' }}>
                                                    {isFolder ? (
                                                        <span style={{ fontSize: '2.5rem', lineHeight: '1' }}>📁</span>
                                                    ) : (
                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                            <polyline points="14 2 14 8 20 8"></polyline>
                                                        </svg>
                                                    )}
                                                </div>

                                                <h4 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', marginBottom: '0.2rem' }} title={isFolder ? file.folder_name : file.original_name}>
                                                    {isFolder ? file.folder_name : file.original_name}
                                                </h4>

                                                {isFolder && (
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', margin: '0 0 0.25rem 0', fontWeight: '500' }}>
                                                        {file.file_count} Files Included
                                                    </p>
                                                )}

                                            </CardWrapper>

                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                                {Math.round(file.size / 1024)} KB • {new Date(file.created_at).toLocaleDateString()}
                                            </span>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <CategoryEditor fileId={file.id} initialCategory={file.category} isFolder={isFolder} folderName={file.folder_name} />
                                                    {!isFolder && (file.category === '校內計畫' || file.category === '校外計畫' || file.category === '期刊投稿') && (
                                                        <DeadlineEditor fileId={file.id} initialDeadline={file.deadline} type="file" />
                                                    )}
                                                </div>
                                                <DeleteFileButton fileId={file.id} fileName={file.original_name} isFolder={isFolder} folderName={file.folder_name} />
                                            </div>
                                            {!isFolder && <ImportExcelButton fileId={file.id} fileName={file.original_name} />}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <p>No files found in this category.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

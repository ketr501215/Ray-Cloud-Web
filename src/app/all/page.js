import db from '@/lib/db';
import styles from '@/app/page.module.css';
import Link from 'next/link';
import DeleteButton from '@/components/DeleteButton';

export const dynamic = 'force-dynamic';

export default async function AllContentPage() {
    // Fetch all content items
    const result = await db.execute(`SELECT * FROM content WHERE status != 'archived' ORDER BY updated_at DESC`);
    const allContent = result.rows;

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
                                    All <span className="text-gradient">Content</span>
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Showing all {allContent.length} active projects and tutorials.
                                </p>
                            </div>
                        </div>

                        {allContent.length > 0 ? (
                            <div className="grid-auto mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {allContent.map((item, idx) => (
                                    <div key={item.id} className={`glass-panel animate-fade-in animate-delay-${Math.min((idx % 3) + 1, 3)}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                                                {item.type}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {new Date(item.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>{item.title}</h3>

                                        {item.progress !== undefined && item.progress !== null && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                                                    <span>Progress</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', background: 'var(--accent-color)', width: `${item.progress}%`, borderRadius: '3px' }}></div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <button className={styles.cardAction} style={{ width: 'auto' }}>
                                                Open Details
                                            </button>
                                            <DeleteButton id={item.id} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <p>No active content found.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

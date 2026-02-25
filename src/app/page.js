import styles from "./page.module.css";
import db, { initDb } from '@/lib/db';
import NewEntryModal from '@/components/NewEntryModal';
import DeleteButton from '@/components/DeleteButton';
import FileUploadArea from '@/components/FileUploadArea';
import Link from 'next/link';

// Force dynamic rendering if we want fresh data on every request, 
// or let Next.js cache it statically. For a personal dashboard, dynamic is better.
export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    // Ensure DB is initialized (useful for local development)
    await initDb();

    // Fetch real data from SQLite
    const recentContentResult = await db.execute(`SELECT * FROM content WHERE status != 'archived' ORDER BY updated_at DESC LIMIT 6`);
    const recentContent = recentContentResult.rows;

    // Fetch recent files with folder grouping
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
      LIMIT 6
    `);
    const recentFiles = fileResult.rows;

    // Fetch category statistics
    const statsResult = await db.execute(`
      SELECT category, COUNT(*) as count 
      FROM files 
      GROUP BY category 
      ORDER BY count DESC
    `);
    const categoryStats = statsResult.rows;

    return (
      <main className={styles.main}>
        <nav className={styles.navbar}>
          <div className={styles.logo}>
            <span className="text-gradient">Ray Cloud</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#projects">Projects</a>
            <a href="#tutorials">Tutorials</a>
            <a href="#settings">Settings</a>
            <NewEntryModal />
          </div>
        </nav>

        <section className={styles.heroSection}>
          <div className="container">
            <div className={`${styles.heroContent} animate-fade-in`}>
              <div className={styles.badge}>Workspace Alpha</div>
              <h1 className="hero-title">
                Your Digital <br />
                <span className="text-gradient">Command Center</span>
              </h1>
              <p className="subtitle">
                Manage your projects, organize tutorials, and capture research seamlessly in one unified, aesthetic cloud interface.
              </p>
              <div className={styles.heroActions}>
                <button className="btn btn-primary">
                  Explore Dashboard
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
                <button className="btn btn-secondary">
                  View Recent Activity
                </button>
              </div>
            </div>
          </div>

          {/* Subtle background glow effect */}
          <div className={styles.glowOrb}></div>
          <div className={styles.glowOrbSecondary}></div>
        </section>

        <div className={`container ${styles.dashboardContainer}`}>

          {/* Left Column: Main Viewing Content */}
          <div className={styles.mainContent}>
            <section className={styles.dashboardPreview}>
              <div className="flex-between">
                <h2 className={styles.sectionTitle}>Recent Overview</h2>
                <a href="/all" className={styles.viewAll}>View All →</a>
              </div>

              <div className="grid-auto mt-4" style={{ marginTop: '2rem' }}>
                {recentContent.length > 0 ? (
                  recentContent.map((item, idx) => (
                    <DashboardCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      type={item.type}
                      date={new Date(item.updated_at).toLocaleDateString()}
                      progress={item.progress}
                      delay={`animate-delay-${Math.min(minMaxIdx(idx), 3)}`}
                    />
                  ))
                ) : (
                  <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>No content found.</div>
                )}
              </div>
            </section>

            <section className={styles.dashboardPreview}>
              <div className="flex-between">
                <h2 className={styles.sectionTitle}>Recent Files</h2>
                <a href="/files" className={styles.viewAll}>View All →</a>
              </div>

              {recentFiles.length > 0 ? (
                <div className="grid-auto mt-4" style={{ marginTop: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {recentFiles.map((file, idx) => {
                    const isFolder = !!file.folder_name;
                    const CardWrapper = isFolder ? 'div' : 'a';
                    const wrapperProps = isFolder
                      ? { className: `glass-panel animate-fade-in animate-delay-${Math.min(minMaxIdx(idx), 3)}`, style: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' } }
                      : { href: file.url, target: '_blank', rel: 'noopener noreferrer', className: `glass-panel animate-fade-in animate-delay-${Math.min(minMaxIdx(idx), 3)}`, style: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textDecoration: 'none', position: 'relative' } };

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
                      </CardWrapper>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>No recent files found.</div>
              )}
            </section>
          </div>

          {/* Right Column: Persistent Upload Sidebar */}
          <aside className={styles.sidebar}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 className={styles.sectionTitle} style={{ fontSize: '1.25rem' }}>Drop & Upload</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '-0.5rem 0 0.5rem 0' }}>
                Drag files or folders here anytime to upload them to your cloud.
              </p>
              <FileUploadArea />
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
              <h2 className={styles.sectionTitle} style={{ fontSize: '1.25rem' }}>Library Stats</h2>
              {categoryStats.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {categoryStats.map((stat, idx) => (
                    <Link href={`/category/${encodeURIComponent(stat.category)}`} key={idx} style={{ textDecoration: 'none' }}>
                      <div className={styles.categoryStatRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{stat.category}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-color)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                          {stat.count}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No files uploaded yet.</p>
              )}
            </div>
          </aside>

        </div>
      </main>
    );
  } catch (err) {
    return (
      <div style={{ padding: 50, color: 'white', backgroundColor: 'black', height: '100vh', fontFamily: 'monospace' }}>
        <h1 style={{ color: 'red' }}>Vercel Rendering Error</h1>
        <h2>{err.message}</h2>
        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#222', padding: 20 }}>{err.stack}</pre>
        <hr style={{ margin: '20px 0' }} />
        <p><strong>TURSO_DATABASE_URL length:</strong> {(process.env.TURSO_DATABASE_URL || "").length} chars</p>
        <p><strong>TURSO_AUTH_TOKEN length:</strong> {(process.env.TURSO_AUTH_TOKEN || "").length} chars</p>
        <p><strong>BLOB_READ_WRITE_TOKEN length:</strong> {(process.env.BLOB_READ_WRITE_TOKEN || "").length} chars</p>
        <p>If you see a length of 0, the environment variable is MISSING on Vercel!</p>
      </div>
    );
  }
}

function minMaxIdx(idx) {
  return (idx % 3) + 1;
}

function DashboardCard({ id, title, type, date, progress, delay }) {
  return (
    <div className={`glass-panel ${styles.card} animate-fade-in ${delay}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardType}>{type}</span>
        <span className={styles.cardDate}>{date}</span>
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>

      {progress !== undefined && progress !== null && (
        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span className={styles.progressText}>Progress</span>
            <span className={styles.progressValue}>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <div className={styles.cardFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className={styles.cardAction} style={{ width: 'auto' }}>Open Details</button>
        <DeleteButton id={id} />
      </div>
    </div>
  );
}

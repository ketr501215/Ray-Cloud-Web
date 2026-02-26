import Link from 'next/link';
import DeadlineEditor from './DeadlineEditor';

export default function UpcomingDeadlines({ items }) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <section className="dashboardPreview animate-fade-in" style={{ marginBottom: '2rem' }}>
            <div className="flex-between">
                <h2 className="sectionTitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Upcoming Deadlines
                </h2>
            </div>

            <div className="grid-auto mt-4" style={{ marginTop: '1.5rem' }}>
                {items.map((item, idx) => {
                    const isUrgent = item.daysUntil <= 3 && item.daysUntil >= 0;
                    const isOverdue = item.daysUntil < 0;
                    const badgeColor = isOverdue ? 'rgba(239, 68, 68, 0.2)' : (isUrgent ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.1)');
                    const textColor = isOverdue ? '#f87171' : (isUrgent ? '#fbbf24' : 'var(--text-secondary)');
                    const badgeText = isOverdue ? `Overdue by ${Math.abs(item.daysUntil)} days` : (item.daysUntil === 0 ? 'Due Today' : `Due in ${item.daysUntil} days`);

                    return (
                        <div key={`${item.type}-${item.id}`} className={`glass-panel animate-fade-in animate-delay-${(idx % 3) + 1}`} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: `3px solid ${textColor}` }}>
                            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-color)', borderRadius: '4px', fontWeight: 'bold' }}>
                                    {item.category || item.type}
                                </span>
                                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: badgeColor, color: textColor, borderRadius: '4px', fontWeight: 'bold' }}>
                                    {badgeText}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title || item.original_name}
                            </h3>
                            <DeadlineEditor
                                fileId={item.id}
                                initialDeadline={item.deadline}
                                type={item.sourceType}
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

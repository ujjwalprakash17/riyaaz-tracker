import { Dots, Ext } from './ui.jsx';
import { fmt } from '../lib/dates.js';
import { nextReview } from '../lib/model.js';

export default function TopicsView({ ctx }) {
  const list = ctx.data.topics.slice().sort((a, b) => (b.learnedDate || '').localeCompare(a.learnedDate || ''));
  return (
    <div>
      <div className="dayhead">
        <h1>Topics aur patterns</h1>
        <button className="btn primary" onClick={() => ctx.openModal({ type: 'topic' })}>Topic ya pattern add karo</button>
      </div>
      <p className="sub">
        Jo bhi naya padho, yahan daalo. Padhne ke {ctx.data.settings.topicOffsets.join(', ')} din baad "Aaj" page pe reminder aayega ki is topic ke problems bina dekhe karo.
      </p>
      <div className="legend">
        <span><i style={{ background: 'var(--ok)' }} />ho gaya</span>
        <span><i style={{ background: 'var(--margin)' }} />bhool gaya tha</span>
        <span><i style={{ background: 'var(--hl)' }} />due</span>
        <span><i style={{ border: '1.5px solid var(--line)' }} />aage</span>
      </div>
      {list.length === 0 ? (
        <p className="empty">Abhi koi topic nahi. Agla naya pattern padho, to yahin add karo.</p>
      ) : (
        list.map(t => {
          const n = nextReview(t);
          return (
            <div className="row" key={t.id}>
              <div className="row-main">
                <div className="title"><Ext href={t.link}>{t.name}</Ext></div>
                <div className="meta">
                  <span className="tag">{t.type || 'Topic'}</span>
                  <span>Padha {fmt(t.learnedDate)}</span>
                  <Dots item={t} today={ctx.today} />
                  <span>
                    {n ? (n.due <= ctx.today ? <span className="hl">Revision due</span> : `Agla reminder ${fmt(n.due)}`) : 'Saare reminders ho gaye'}
                  </span>
                </div>
                {t.notes && (
                  <div className="sub" style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>
                    {t.notes.length > 180 ? t.notes.slice(0, 180) + '…' : t.notes}
                  </div>
                )}
              </div>
              <div className="row-actions">
                <button className="btn ghost small" onClick={() => ctx.openModal({ type: 'topic', item: t })}>Edit</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

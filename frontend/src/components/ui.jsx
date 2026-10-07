import { useEffect } from 'react';
import { STATUS, safeHref } from '../lib/model.js';
import { diffDays, fmt } from '../lib/dates.js';

export function Ext({ href, children }) {
  const h = safeHref(href);
  return h ? (
    <a href={h} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );
}

export function StatusBadge({ p }) {
  const s = STATUS[p.status] || STATUS.pending;
  return <span className={'badge ' + s.cls}>{s.label}</span>;
}

export function Late({ due, today }) {
  const n = diffDays(due, today);
  return n > 0 ? <span className="hl">{n} din late</span> : null;
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost icon" onClick={onClose} aria-label="Band karo">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const sortByDue = rs => (rs || []).slice().sort((a, b) => (a.due < b.due ? -1 : 1));

export function ReviewHistory({ item, today }) {
  const rs = sortByDue(item.reviews);
  if (!rs.length) return null;
  return (
    <div className="hist">
      Revisions:
      {rs.map((r, i) => (
        <span key={i} className="tag">
          Din {r.offset}, {fmt(r.due)}: {r.done ? (r.result === 'stuck' ? 'atka' : 'ho gaya') : r.due <= today ? 'aaj due' : 'baaki'}
        </span>
      ))}
    </div>
  );
}

export function Dots({ item, today }) {
  return (
    <span className="dots" aria-label="Revision progress">
      {sortByDue(item.reviews).map((r, i) => (
        <span
          key={i}
          title={`Din ${r.offset}, ${fmt(r.due)}`}
          className={'dot' + (r.done ? (r.result === 'stuck' ? ' stuck' : ' ok') : r.due <= today ? ' due' : '')}
        />
      ))}
    </span>
  );
}

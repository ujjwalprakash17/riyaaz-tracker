import { useState } from 'react';
import { StatusBadge } from './ui.jsx';
import { fmt } from '../lib/dates.js';
import { POSITIONS, STATUS, nextReview } from '../lib/model.js';

export default function SheetView({ ctx }) {
  const [q, setQ] = useState('');
  const [st, setSt] = useState('all');
  const [pos, setPos] = useState('all');
  const needle = q.trim().toLowerCase();
  const rows = ctx.data.problems
    .filter(p => {
      if (st !== 'all' && p.status !== st) return false;
      if (pos !== 'all' && p.position !== pos) return false;
      if (!needle) return true;
      return [p.title, p.source, p.observation, p.howToFind, (p.tags || []).join(' ')].join(' ').toLowerCase().includes(needle);
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));

  const open = p => ctx.openModal({ type: 'problem', item: p });
  const nextCell = p => {
    if (p.status === 'pending') return <span className="badge s-pend">Upsolve baaki</span>;
    const n = nextReview(p);
    if (n) return n.due <= ctx.today ? <span className="hl">{fmt(n.due)}, due</span> : <span>{fmt(n.due)}</span>;
    return (p.reviews || []).length ? <span style={{ color: 'var(--ok)' }}>Sab ho gaya</span> : <span>-</span>;
  };

  return (
    <div>
      <div className="dayhead">
        <h1>Practice sheet</h1>
        <button className="btn primary" onClick={() => ctx.openModal({ type: 'problem' })}>Problem add karo</button>
      </div>
      <div className="filters">
        <label className="f search">
          Dhoondho
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Naam, contest, tag ya observation" />
        </label>
        <label className="f">
          Kaise hua
          <select value={st} onChange={e => setSt(e.target.value)}>
            <option value="all">Sab</option>
            {Object.keys(STATUS).map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
        </label>
        <label className="f">
          Question
          <select value={pos} onChange={e => setPos(e.target.value)}>
            <option value="all">Sab</option>
            {POSITIONS.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <div className="sub" style={{ margin: '0 0 9px' }}>{rows.length} problems</div>
      </div>
      {rows.length === 0 ? (
        <p className="empty" style={{ marginTop: 16 }}>
          {ctx.data.problems.length ? 'Is filter me kuch nahi mila.' : 'Sheet khaali hai. Aaj ka contest do, problems yahan apne aap aa jayenge.'}
        </p>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Kahan se</th><th>Q</th><th>Problem</th><th>Kaise hua</th><th>Time</th><th>Tags</th><th>Observation</th><th>Agli revision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id} onClick={() => open(p)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && open(p)}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(p.date)}</td>
                  <td>{p.source || 'Practice'}</td>
                  <td>{p.position}</td>
                  <td style={{ fontWeight: 600, minWidth: 160 }}>{p.title}</td>
                  <td>
                    <StatusBadge p={p} />
                    {p.status === 'khud' && p.inTime && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>time ke andar</div>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{p.timeMin != null ? p.timeMin + ' min' : '-'}</td>
                  <td>{(p.tags || []).join(', ') || '-'}</td>
                  <td className="obs">{p.observation || (p.status !== 'pending' ? <span className="hl">likhna baaki</span> : '-')}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{nextCell(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

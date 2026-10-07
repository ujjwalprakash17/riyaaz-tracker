import { addDays, fmt, weekStart } from '../lib/dates.js';
import { activityDays, q123Done, streakCount } from '../lib/model.js';

const CATS = [
  { k: 'intime', label: 'Khud, time ke andar', color: 'var(--c-intime)', test: p => p.status === 'khud' && p.inTime },
  { k: 'later', label: 'Khud, baad me', color: 'var(--c-later)', test: p => p.status === 'khud' && !p.inTime },
  { k: 'hint', label: 'Hint se', color: 'var(--c-hint)', test: p => p.status === 'hint' },
  { k: 'editorial', label: 'Editorial se', color: 'var(--c-edit)', test: p => p.status === 'editorial' },
  { k: 'pending', label: 'Upsolve baaki', color: 'var(--c-pend)', test: p => p.status === 'pending' }
];

export default function ProgressView({ ctx }) {
  const { data, today } = ctx;
  const contestRows = data.contests
    .map(c => ({ c, probs: data.problems.filter(p => p.contestId === c.id) }))
    .filter(x => x.probs.length > 0);
  const target = contestRows.filter(x => q123Done(x.probs)).length;

  const qs = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
    const att = data.problems.filter(p => p.contestId && p.position === q);
    const ok = att.filter(p => p.status === 'khud' && p.inTime).length;
    return { q, att: att.length, ok, pct: att.length ? Math.round((ok / att.length) * 100) : 0 };
  });

  const w0 = weekStart(today);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(w0, -7 * (7 - i)));
  const wdata = weeks.map(w => {
    const ps = data.problems.filter(p => p.date >= w && p.date < addDays(w, 7));
    return { w, total: ps.length, parts: CATS.map(c => ps.filter(c.test).length) };
  });
  const maxW = Math.max(1, ...wdata.map(x => x.total));

  const share = (from, to) => {
    const ps = data.problems.filter(p => p.date > from && p.date <= to);
    return ps.length ? Math.round((ps.filter(p => p.status === 'khud').length / ps.length) * 100) : null;
  };
  const recent = share(addDays(today, -14), today);
  const before = share(addDays(today, -28), addDays(today, -14));

  let revOk = 0;
  let revStuck = 0;
  data.problems.concat(data.topics).forEach(it =>
    (it.reviews || []).forEach(r => {
      if (!r.done) return;
      if (r.result === 'stuck') revStuck++;
      else revOk++;
    })
  );
  const streak = streakCount(activityDays(data), today);

  return (
    <div>
      <div className="dayhead"><h1>Progress</h1></div>
      <p className="big">
        {contestRows.length === 0 ? (
          'Pehla contest do, phir yahan dikhega ki Q1 se Q3 ek ghante me kitni baar hue.'
        ) : (
          <>{contestRows.length} contests me se <em>{target}</em> me Q1, Q2, Q3 teeno time ke andar hue.</>
        )}
      </p>
      <div className="stat-line">
        <div><b>{streak}</b><span>din ki streak</span></div>
        <div>
          <b>{recent == null ? '-' : recent + '%'}</b>
          <span>pichhle 14 din me khud kiye{before != null ? ` (usse pehle ${before}%)` : ''}</span>
        </div>
        <div><b>{revOk}</b><span>revisions ho gayi</span></div>
        <div><b>{revStuck}</b><span>baar revision me atke</span></div>
      </div>

      <h2 className="h" style={{ marginTop: 28 }}>Contest me har question</h2>
      <p className="sub">Kitne baar wo question contest ke time ke andar khud hua.</p>
      {qs.map(x => (
        <div className="qbar" key={x.q}>
          <b>{x.q}</b>
          <div className="track"><i style={{ width: x.pct + '%' }} /></div>
          <span className="n">{x.att ? `${x.ok}/${x.att}, ${x.pct}%` : 'abhi data nahi'}</span>
        </div>
      ))}

      <h2 className="h" style={{ marginTop: 28 }}>Har hafte kya hua</h2>
      <div className="legend">
        {CATS.map(c => <span key={c.k}><i style={{ background: c.color }} />{c.label}</span>)}
      </div>
      {wdata.map(x => (
        <div className="wk" key={x.w}>
          <span>{fmt(x.w)}</span>
          <div className="stack" style={{ width: (x.total / maxW) * 100 + '%', background: x.total ? 'transparent' : 'var(--rule)', minWidth: x.total ? 0 : 4 }}>
            {x.parts.map((n, i) => n > 0 && (
              <i key={i} style={{ width: (n / x.total) * 100 + '%', background: CATS[i].color }} title={`${CATS[i].label}: ${n}`} />
            ))}
          </div>
          <span style={{ textAlign: 'right' }}>{x.total}</span>
        </div>
      ))}
    </div>
  );
}

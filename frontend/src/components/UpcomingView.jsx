import { Late } from './ui.jsx';
import { addDays, dayName, fmt } from '../lib/dates.js';
import { pendingReviews } from '../lib/model.js';

export default function UpcomingView({ ctx }) {
  const { today } = ctx;
  const end = addDays(today, 21);
  const items = [];
  const overdue = [];
  const add = (it, kind, name) => {
    const prs = pendingReviews(it);
    if (prs.length && prs[0].due < today) overdue.push({ key: it.id, due: prs[0].due, offset: prs[0].offset, kind, name, it });
    prs.forEach(r => {
      if (r.due >= today && r.due <= end) items.push({ key: it.id + r.due + r.offset, due: r.due, offset: r.offset, kind, name, it });
    });
  };
  ctx.data.problems.forEach(p => p.status !== 'pending' && add(p, 'problem', p.title));
  ctx.data.topics.forEach(t => add(t, 'topic', t.name));
  const groups = {};
  items.forEach(i => (groups[i.due] = groups[i.due] || []).push(i));
  const days = Object.keys(groups).sort();

  const Item = i => (
    <div className="row" key={i.key}>
      <div className="row-main">
        <div className="title">{i.name}</div>
        <div className="meta">
          <span className="tag">{i.kind === 'topic' ? i.it.type || 'Topic' : 'Problem'}</span>
          <span>Din {i.offset} revision</span>
          {i.due < today && <Late due={i.due} today={today} />}
        </div>
      </div>
      <div className="row-actions">
        <button className="btn ghost small" onClick={() => ctx.openModal({ type: i.kind, item: i.it })}>Kholo</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="dayhead"><h1>Aage ka plan</h1></div>
      <p className="sub">Agle 3 hafte me kab kya revise karna hai. Jis din jo due hoga, wo "Aaj" page pe sabse upar aa jayega.</p>
      {overdue.length > 0 && (
        <div className="dayblock">
          <h2 className="daytitle">Pichhla baaki<span>{overdue.length} item</span></h2>
          {overdue.map(Item)}
        </div>
      )}
      {days.length === 0 && overdue.length === 0 ? (
        <p className="empty">Agle 3 hafte me kuch revise nahi karna. Contest do aur topics add karo, ye list apne aap bharegi.</p>
      ) : (
        days.map(d => (
          <div className="dayblock" key={d}>
            <h2 className="daytitle">{dayName(d, today)}<span>{fmt(d)}, {groups[d].length} item</span></h2>
            {groups[d].map(Item)}
          </div>
        ))
      )}
    </div>
  );
}

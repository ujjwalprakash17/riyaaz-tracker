import { useState } from 'react';
import { Modal, ReviewHistory } from './ui.jsx';
import { fmt } from '../lib/dates.js';
import { DOC_KINDS, POSITIONS, STATUS, makeId, nextReview, parseOffsets, parseTags, schedule } from '../lib/model.js';
import { downloadJson } from '../lib/download.js';

export function UpsolveModal({ ctx, p, onClose }) {
  const [how, setHow] = useState('');
  const [time, setTime] = useState('');
  const [obs, setObs] = useState(p.observation || '');
  const [find, setFind] = useState(p.howToFind || '');
  const [tags, setTags] = useState((p.tags || []).join(', '));
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!how) return setErr('Kaise hua, ye chuno');
    if (!obs.trim()) return setErr('Ek line ka observation likho. Revision me yahi kaam aayega.');
    const done = (p.reviews || []).filter(r => r.done);
    const next = {
      ...p,
      status: how,
      inTime: false,
      timeMin: time === '' ? (p.timeMin ?? null) : Math.max(0, parseInt(time, 10) || 0),
      observation: obs.trim(),
      howToFind: find.trim(),
      tags: parseTags(tags),
      upsolvedDate: ctx.today,
      reviews: p.revise === false ? done : done.concat(schedule(ctx.today, ctx.data.settings.problemOffsets))
    };
    const nr = nextReview(next);
    await ctx.save(next, 'Upsolve ho gaya.' + (nr ? ` Pehli revision ${fmt(nr.due)} ko.` : ''));
    onClose();
  };
  return (
    <Modal title={'Upsolve: ' + p.title} onClose={onClose}>
      <div className="form">
        <div className="f">
          Kaise hua
          <div className="seg" role="radiogroup" aria-label="Kaise hua" style={{ marginTop: 4 }}>
            {['khud', 'hint', 'editorial'].map(k => (
              <button key={k} className="btn small" aria-pressed={how === k} onClick={() => { setHow(k); setErr(''); }}>
                {STATUS[k].label}
              </button>
            ))}
          </div>
        </div>
        <label className="f">
          Key observation
          <textarea value={obs} onChange={e => { setObs(e.target.value); setErr(''); }} placeholder="Suffix ulta karne se sirf junction wala edge badalta hai" />
        </label>
        <label className="f">
          Agli baar kaise pakdun
          <textarea value={find} onChange={e => setFind(e.target.value)} placeholder="Original aur reversed ke edges side by side likhta to dikh jaata" />
        </label>
        <div className="grid">
          <label className="f">Tags<input value={tags} onChange={e => setTags(e.target.value)} placeholder="greedy, prefix sum" /></label>
          <label className="f">Upsolve me time (min)<input type="number" min="0" value={time} onChange={e => setTime(e.target.value)} /></label>
        </div>
        {err && <p className="err">{err}</p>}
        <div className="actions">
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>Save karo</button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteButton({ onDelete }) {
  const [sure, setSure] = useState(false);
  return sure ? (
    <button className="btn danger" onClick={onDelete}>Pakka delete karo</button>
  ) : (
    <button className="btn ghost" onClick={() => setSure(true)}>Delete</button>
  );
}

export function ProblemModal({ ctx, p, onClose }) {
  const isNew = !p;
  const s = ctx.data.settings;
  const [f, setF] = useState(() => ({
    title: p?.title || '',
    link: p?.link || '',
    source: p?.source || 'Practice',
    position: p?.position || 'Practice',
    date: p?.date || ctx.today,
    status: p?.status || 'khud',
    inTime: !!p?.inTime,
    timeMin: p?.timeMin != null ? String(p.timeMin) : '',
    tagsText: (p?.tags || []).join(', '),
    observation: p?.observation || '',
    howToFind: p?.howToFind || '',
    notes: p?.notes || '',
    revise: p ? p.revise !== false : true
  }));
  const [err, setErr] = useState('');
  const set = k => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setErr('');
    setF(o => ({ ...o, [k]: v }));
  };

  const submit = async () => {
    if (!f.title.trim()) return setErr('Problem ka naam likho');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return setErr('Date chuno');
    const base = p ? { ...p } : { id: makeId('p'), kind: 'problem', contestId: null, reviews: [], stuckCount: 0, createdAt: Date.now() };
    const next = {
      ...base,
      title: f.title.trim(),
      link: f.link.trim(),
      source: f.source.trim() || 'Practice',
      position: f.position,
      date: f.date,
      status: f.status,
      inTime: f.status === 'khud' && !!f.inTime,
      timeMin: f.timeMin === '' ? null : Math.max(0, parseInt(f.timeMin, 10) || 0),
      tags: parseTags(f.tagsText),
      observation: f.observation.trim(),
      howToFind: f.howToFind.trim(),
      notes: f.notes.trim(),
      revise: !!f.revise
    };
    let reviews = p?.reviews || [];
    const done = reviews.filter(r => r.done);
    const hasPending = reviews.some(r => !r.done);
    const wasPending = p?.status === 'pending';
    if (next.status === 'pending') {
      reviews = done;
      next.upsolvedDate = null;
    } else if (!next.revise) {
      reviews = done;
    } else if (!hasPending && (isNew || wasPending || reviews.length === 0)) {
      let start = next.date;
      if (wasPending) {
        start = ctx.today;
        next.upsolvedDate = ctx.today;
      }
      reviews = done.concat(schedule(start, s.problemOffsets));
    }
    next.reviews = reviews;
    await ctx.save(next, isNew ? 'Problem add ho gaya' : 'Save ho gaya');
    onClose();
  };

  return (
    <Modal title={isNew ? 'Problem add karo' : 'Problem edit karo'} onClose={onClose}>
      <div className="form">
        <label className="f">Problem<input value={f.title} onChange={set('title')} placeholder="Problem ka naam" /></label>
        <label className="f">Link<input value={f.link} onChange={set('link')} placeholder="https://leetcode.com/problems/..." inputMode="url" /></label>
        <div className="grid">
          <label className="f">Kahan se<input value={f.source} onChange={set('source')} placeholder="Weekly Contest 470" /></label>
          <label className="f">
            Question
            <select value={f.position} onChange={set('position')}>
              {POSITIONS.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label className="f">Date<input type="date" value={f.date} onChange={set('date')} /></label>
          <label className="f">
            Kaise hua
            <select value={f.status} onChange={set('status')}>
              {Object.keys(STATUS).map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}
            </select>
          </label>
          <label className="f">Time (min)<input type="number" min="0" value={f.timeMin} onChange={set('timeMin')} /></label>
        </div>
        {f.status === 'khud' && (
          <label className="check"><input type="checkbox" checked={!!f.inTime} onChange={set('inTime')} />Contest ya timer ke andar hua</label>
        )}
        <label className="f">Tags<input value={f.tagsText} onChange={set('tagsText')} placeholder="prefix sum, greedy" /></label>
        <label className="f">Key observation<textarea value={f.observation} onChange={set('observation')} placeholder="Ek line me: problem ki chaabi kya thi?" /></label>
        <label className="f">Agli baar kaise pakdun<textarea value={f.howToFind} onChange={set('howToFind')} placeholder="Kaunsa chhota example likhta to dikh jaata?" /></label>
        <label className="f">Notes<textarea value={f.notes} onChange={set('notes')} /></label>
        <label className="check">
          <input type="checkbox" checked={!!f.revise} onChange={set('revise')} />
          Revision schedule me rakho (din {s.problemOffsets.join(', ')})
        </label>
        {p && <ReviewHistory item={p} today={ctx.today} />}
        {err && <p className="err">{err}</p>}
        <div className="actions">
          {!isNew && <DeleteButton onDelete={async () => { await ctx.remove(p.id, 'Problem delete ho gaya'); onClose(); }} />}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>{isNew ? 'Add karo' : 'Save karo'}</button>
        </div>
      </div>
    </Modal>
  );
}

export function TopicModal({ ctx, t, onClose }) {
  const isNew = !t;
  const s = ctx.data.settings;
  const [f, setF] = useState(() => ({
    name: t?.name || '',
    type: t?.type || 'Pattern',
    learnedDate: t?.learnedDate || ctx.today,
    link: t?.link || '',
    notes: t?.notes || '',
    target: String(t?.target || 2)
  }));
  const [err, setErr] = useState('');
  const set = k => e => {
    setErr('');
    const v = e.target.value;
    setF(o => ({ ...o, [k]: v }));
  };
  const submit = async () => {
    if (!f.name.trim()) return setErr('Topic ya pattern ka naam likho');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.learnedDate)) return setErr('Date chuno');
    const base = t ? { ...t } : { id: makeId('t'), kind: 'topic', reviews: [], log: [], stuckCount: 0, createdAt: Date.now() };
    const next = {
      ...base,
      name: f.name.trim(),
      type: f.type,
      learnedDate: f.learnedDate,
      link: f.link.trim(),
      notes: f.notes.trim(),
      target: Math.max(1, Math.min(10, parseInt(f.target, 10) || 2))
    };
    if (isNew) next.reviews = schedule(next.learnedDate, s.topicOffsets);
    else if (t.learnedDate !== next.learnedDate && !(t.reviews || []).some(r => r.done)) next.reviews = schedule(next.learnedDate, s.topicOffsets);
    const nr = nextReview(next);
    await ctx.save(next, isNew ? 'Add ho gaya.' + (nr ? ` Pehla reminder ${fmt(nr.due)} ko.` : '') : 'Save ho gaya');
    onClose();
  };
  return (
    <Modal title={isNew ? 'Naya topic ya pattern' : 'Edit karo'} onClose={onClose}>
      <div className="form">
        <label className="f">Naam<input value={f.name} onChange={set('name')} placeholder="Binary search on answer" /></label>
        <div className="grid">
          <label className="f">
            Type
            <select value={f.type} onChange={set('type')}>
              <option value="Topic">Topic</option>
              <option value="Pattern">Pattern</option>
            </select>
          </label>
          <label className="f">Kab padha<input type="date" value={f.learnedDate} onChange={set('learnedDate')} /></label>
          <label className="f">Har revision me problems<input type="number" min="1" max="10" value={f.target} onChange={set('target')} /></label>
        </div>
        <label className="f">Kahan se padha (optional)<input value={f.link} onChange={set('link')} placeholder="https://..." inputMode="url" /></label>
        <label className="f">
          Key idea ya template
          <textarea value={f.notes} onChange={set('notes')} placeholder="Kab lagta hai, kaise pehchanna hai, code ka dhaancha" style={{ minHeight: 110 }} />
        </label>
        <p className="sub" style={{ margin: 0 }}>Reminder aayenge: padhne ke {s.topicOffsets.join(', ')} din baad.</p>
        {t && <ReviewHistory item={t} today={ctx.today} />}
        {t && (t.log || []).length > 0 && (
          <div className="hist">
            Practice log:
            {t.log.slice(-6).map((l, i) => (
              <span key={i} className="tag">
                {fmt(l.date)}{l.result === 'stuck' ? ', bhool gaya' : ''}{l.text ? ': ' + l.text : ''}
              </span>
            ))}
          </div>
        )}
        {err && <p className="err">{err}</p>}
        <div className="actions">
          {!isNew && <DeleteButton onDelete={async () => { await ctx.remove(t.id, 'Delete ho gaya'); onClose(); }} />}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>{isNew ? 'Add karo' : 'Save karo'}</button>
        </div>
      </div>
    </Modal>
  );
}

export function SettingsModal({ ctx, onClose }) {
  const s = ctx.data.settings;
  const [po, setPo] = useState(s.problemOffsets.join(', '));
  const [to, setTo] = useState(s.topicOffsets.join(', '));
  const [cm, setCm] = useState(String(s.contestMinutes));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const a = parseOffsets(po);
    const b = parseOffsets(to);
    const m = parseInt(cm, 10);
    if (!a.length || !b.length) return setErr('Kam se kam ek din likho, jaise 3, 9');
    if (!(m >= 10 && m <= 300)) return setErr('Contest time 10 se 300 min ke beech rakho');
    await ctx.save({ id: 'settings', kind: 'settings', problemOffsets: a, topicOffsets: b, contestMinutes: m }, 'Settings save ho gayi');
    onClose();
  };

  const exportData = () =>
    downloadJson(`riyaaz-backup-${ctx.today}.json`, { app: 'riyaaz', version: 1, exportedAt: new Date().toISOString(), docs: ctx.docs });

  // Claude artifact wale Riyaaz ka backup bhi isi format me hai, to wahan ka data yahan aa jaata hai.
  const importData = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : parsed.docs;
      if (!Array.isArray(list)) throw new Error('bad file');
      const ok = list.filter(d => d && typeof d.id === 'string' && /^[A-Za-z0-9_\-.~:@+]{1,120}$/.test(d.id) && DOC_KINDS.includes(d.kind));
      for (const d of ok) await ctx.store.put(d);
      ctx.toast(`${ok.length} entries import hui`);
    } catch {
      ctx.toast('Ye file Riyaaz ka backup nahi lagti');
    }
    setBusy(false);
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="form">
        <label className="f">
          Problem revision (solve karne ke kitne din baad)
          <input value={po} onChange={e => { setPo(e.target.value); setErr(''); }} placeholder="3, 9" />
        </label>
        <label className="f">
          Topic ya pattern reminder
          <input value={to} onChange={e => { setTo(e.target.value); setErr(''); }} placeholder="3, 9, 20" />
        </label>
        <label className="f">
          Contest timer (min)
          <input type="number" min="10" max="300" value={cm} onChange={e => { setCm(e.target.value); setErr(''); }} />
        </label>
        <p className="sub" style={{ margin: 0 }}>Naye din sirf naye schedules pe lagenge. Pehle se bane schedules waise hi rahenge.</p>
        {err && <p className="err">{err}</p>}
        <div className="actions">
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>Save karo</button>
        </div>
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
          <p className="sub" style={{ marginTop: 0 }}>
            {ctx.store.kind === 'supabase'
              ? 'Data tumhare Supabase database me save hota hai. Kisi bhi device pe login karo, sab milega.'
              : 'Data abhi sirf is browser me save ho raha hai. Backup lete raho.'}
          </p>
          <div className="actions">
            <button className="btn small" onClick={exportData}>Backup download karo</button>
            <label className="btn small" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {busy ? 'Import ho raha hai…' : 'Backup se wapas lao'}
              <input type="file" accept="application/json,.json" onChange={importData} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        {ctx.account && (
          <div className="actions" style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
            <span className="account">Login: {ctx.account.email}</span>
            <span className="spacer" />
            <button className="btn small danger" onClick={ctx.account.signOut}>Logout</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

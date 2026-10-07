import { useEffect, useState } from 'react';
import { Ext, Late, StatusBadge } from './ui.jsx';
import { diffDays, fmt, fmtLong, pad } from '../lib/dates.js';
import {
  activityDays, byDue, contestProblems, isDue, makeId, nextReview, q123Done, reviewOk, reviewStuck, schedule, streakCount
} from '../lib/model.js';

const where = p => (p.source || 'Practice') + (p.position && p.position !== 'Practice' ? ', ' + p.position : '');

function ProblemReviewRow({ p, ctx }) {
  const [show, setShow] = useState(false);
  const r = nextReview(p);
  const ok = async () => {
    const next = reviewOk(p, ctx.today);
    const nr = nextReview(next);
    await ctx.save(next, nr ? `Badhiya. Agli revision ${fmt(nr.due)} ko.` : 'Is problem ki saari revisions ho gayi.');
  };
  const stuck = async () => {
    const off = ctx.data.settings.problemOffsets;
    await ctx.save(reviewStuck(p, ctx.today, off), `Koi baat nahi. ${off[0]} din baad phir aayega.`);
  };
  return (
    <div className="row">
      <div className="row-main">
        <div className="title"><Ext href={p.link}>{p.title}</Ext></div>
        <div className="meta">
          <span>{where(p)}</span>
          <span className="tag">Din {r.offset} revision</span>
          <Late due={r.due} today={ctx.today} />
          {p.stuckCount > 0 && <span>{p.stuckCount} baar atka</span>}
        </div>
        {show ? (
          <div className="note">
            {p.observation ? (
              <div><b>Observation: </b>{p.observation}</div>
            ) : (
              <div>Observation likha nahi tha. Edit karke ab likh do.</div>
            )}
            {p.howToFind && <div style={{ marginTop: 6 }}><b>Kaise pakdun: </b>{p.howToFind}</div>}
          </div>
        ) : (
          <button className="linkbtn" style={{ marginTop: 6 }} onClick={() => setShow(true)}>
            Pehle khud likho, phir observation dekho
          </button>
        )}
      </div>
      <div className="row-actions">
        <button className="btn primary" onClick={ok}>Likh liya</button>
        <button className="btn danger" onClick={stuck}>Atak gaya</button>
        <button className="btn ghost small" onClick={() => ctx.openModal({ type: 'problem', item: p })}>Edit</button>
      </div>
    </div>
  );
}

function TopicReviewRow({ t, ctx }) {
  const [show, setShow] = useState(false);
  const [txt, setTxt] = useState('');
  const r = nextReview(t);
  const log = res => (t.log || []).concat([{ date: ctx.today, text: txt.trim(), result: res }]);
  const ok = async () => {
    const next = { ...reviewOk(t, ctx.today), log: log('ok') };
    const nr = nextReview(next);
    await ctx.save(next, nr ? `Topic pakka hua. Agli baar ${fmt(nr.due)} ko.` : 'Is topic ki saari revisions ho gayi.');
  };
  const stuck = async () => {
    const off = ctx.data.settings.topicOffsets;
    await ctx.save({ ...reviewStuck(t, ctx.today, off), log: log('stuck') }, `Schedule aaj se dobara shuru. ${off[0]} din baad phir aayega.`);
  };
  const type = (t.type || 'Topic').toLowerCase();
  return (
    <div className="row">
      <div className="row-main">
        <div className="title"><Ext href={t.link}>{t.name}</Ext></div>
        <div className="meta">
          <span className="tag">{t.type || 'Topic'}</span>
          <span className="tag">Din {r.offset} revision</span>
          <Late due={r.due} today={ctx.today} />
          <span>Is {type} ke {t.target || 2} problems bina dekhe karo</span>
        </div>
        {show ? (
          <div className="note">{t.notes || 'Notes khaali hain. Edit karke key idea likh do.'}</div>
        ) : (
          <button className="linkbtn" style={{ marginTop: 6 }} onClick={() => setShow(true)}>Notes dekho</button>
        )}
        <input
          style={{ display: 'block', marginTop: 8, maxWidth: 460 }}
          value={txt}
          onChange={e => setTxt(e.target.value)}
          placeholder="Kaunse problems kiye (optional)"
          aria-label="Kaunse problems kiye"
        />
      </div>
      <div className="row-actions">
        <button className="btn primary" onClick={ok}>Ho gaya</button>
        <button className="btn danger" onClick={stuck}>Bhool gaya tha</button>
        <button className="btn ghost small" onClick={() => ctx.openModal({ type: 'topic', item: t })}>Edit</button>
      </div>
    </div>
  );
}

function Timer({ c }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const total = c.minutes * 60000;
  const left = c.startedAt + total - now;
  const over = left <= 0;
  const ms = Math.abs(left);
  const mm = Math.floor(ms / 60000);
  const ss = Math.floor(ms / 1000) % 60;
  const gone = Math.max(0, Math.floor((now - c.startedAt) / 60000));
  const pct = Math.min(100, Math.max(0, ((now - c.startedAt) / total) * 100));
  return (
    <div className="timer-box">
      <div className={'timer' + (over ? ' over' : '')} role="timer" aria-label="Contest timer">
        {over ? '+' : ''}{pad(mm)}:{pad(ss)}
      </div>
      <div className="timer-note">
        {over ? 'Time khatam. Jo hua usko save karo, baaki upsolve list me jayega.' : `${c.minutes} min me se ${gone} min gaye`}
      </div>
      <div className="bar"><i style={{ width: pct + '%' }} /></div>
    </div>
  );
}

function ContestProblemRow({ p, ctx }) {
  const needsObs = p.status !== 'pending' && !p.observation;
  return (
    <div className="row">
      <div className="row-main">
        <div className="title">
          <span className="tag" style={{ marginRight: 8 }}>{p.position}</span>
          <Ext href={p.link}>{p.title}</Ext>
        </div>
        <div className="meta">
          <StatusBadge p={p} />
          {p.status === 'khud' && p.inTime && <span>time ke andar</span>}
          {p.timeMin != null && <span>{p.timeMin} min</span>}
          {needsObs && (
            <button className="linkbtn" onClick={() => ctx.openModal({ type: 'problem', item: p })}>Observation likho</button>
          )}
        </div>
      </div>
      <div className="row-actions">
        <button className="btn ghost small" onClick={() => ctx.openModal({ type: 'problem', item: p })}>Edit</button>
      </div>
    </div>
  );
}

function SlotForm({ c, existing, ctx }) {
  const used = new Set(existing.map(p => p.position));
  const nextPos = ['Q1', 'Q2', 'Q3', 'Q4'].find(q => !used.has(q)) || 'Q4';
  const [pos, setPos] = useState(nextPos);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [res, setRes] = useState('hua');
  const [time, setTime] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => setPos(nextPos), [nextPos]);

  // Time khaali chhoda to timer se andaza: ab tak ka time minus pichhle solved questions ka time.
  const suggested = () => {
    const el = Math.round((Date.now() - c.startedAt) / 60000);
    const spent = existing.filter(p => p.status !== 'pending').reduce((s, p) => s + (+p.timeMin || 0), 0);
    return Math.max(1, Math.min(el, c.minutes) - spent);
  };

  const submit = async () => {
    if (!title.trim()) return setErr('Problem ka naam likho');
    const hua = res === 'hua';
    const t = hua ? (time === '' ? suggested() : Math.max(0, parseInt(time, 10) || 0)) : null;
    const reviews = hua ? schedule(c.date, ctx.data.settings.problemOffsets) : [];
    const doc = {
      id: makeId('p'), kind: 'problem', title: title.trim(), link: link.trim(), source: c.name, contestId: c.id,
      position: pos, date: c.date, status: hua ? 'khud' : 'pending', inTime: hua, timeMin: t, tags: [],
      observation: '', howToFind: '', notes: '', revise: true, reviews, stuckCount: 0, createdAt: Date.now()
    };
    await ctx.save(
      doc,
      hua ? `${pos} save hua.${reviews[0] ? ` Pehli revision ${fmt(reviews[0].due)} ko.` : ''}` : `${pos} upsolve list me gaya.`
    );
    setTitle('');
    setLink('');
    setTime('');
    setRes('hua');
    setErr('');
  };

  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <div className="form">
        <div className="grid">
          <label className="f">
            Question
            <select value={pos} onChange={e => setPos(e.target.value)}>
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </label>
          <label className="f" style={{ gridColumn: 'span 2' }}>
            Problem
            <input value={title} onChange={e => { setTitle(e.target.value); setErr(''); }} placeholder="Problem ka naam" />
          </label>
        </div>
        <div className="grid">
          <label className="f" style={{ gridColumn: 'span 2' }}>
            Link (optional)
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://leetcode.com/problems/..." inputMode="url" />
          </label>
          {res === 'hua' && (
            <label className="f">
              Time laga (min)
              <input type="number" min="0" value={time} onChange={e => setTime(e.target.value)} placeholder="Khaali = timer se" />
            </label>
          )}
        </div>
        <div className="actions">
          <div className="seg" role="radiogroup" aria-label="Result">
            <button className="btn small" aria-pressed={res === 'hua'} onClick={() => setRes('hua')}>Hua</button>
            <button className="btn small" aria-pressed={res === 'nahi'} onClick={() => setRes('nahi')}>Nahi hua, upsolve karunga</button>
          </div>
          <span className="spacer" />
          <button className="btn primary" onClick={submit}>{pos} save karo</button>
        </div>
        {err && <p className="err">{err}</p>}
      </div>
    </div>
  );
}

function ContestRunning({ c, ctx }) {
  const probs = contestProblems(ctx.data.problems, c);
  const [confirmCancel, setConfirmCancel] = useState(false);
  return (
    <div>
      <div className="contest-head">
        <div className="contest-name"><Ext href={c.link}>{c.name}</Ext></div>
        <div className="row-actions">
          {probs.length === 0 &&
            (confirmCancel ? (
              <button className="btn danger small" onClick={() => ctx.remove(c.id, 'Contest hata diya')}>Pakka hatao</button>
            ) : (
              <button className="btn ghost small" onClick={() => setConfirmCancel(true)}>Galti se shuru hua? Hatao</button>
            ))}
          <button className="btn" onClick={() => ctx.save({ ...c, endedAt: Date.now() }, 'Contest khatam. Ab upsolve.')}>
            Contest khatam karo
          </button>
        </div>
      </div>
      <Timer c={c} />
      {probs.map(p => <ContestProblemRow key={p.id} p={p} ctx={ctx} />)}
      <SlotForm c={c} existing={probs} ctx={ctx} />
    </div>
  );
}

function ContestSummary({ c, ctx, onNew }) {
  const probs = contestProblems(ctx.data.problems, c);
  const solved = probs.filter(p => p.status === 'khud' && p.inTime).length;
  return (
    <div>
      <div className="contest-head">
        <div>
          <div className="contest-name"><Ext href={c.link}>{c.name}</Ext></div>
          <div className="meta">
            <span>{solved} problem time ke andar</span>
            {q123Done(probs) ? (
              <span className="badge s-khud">Q1 se Q3 ek ghante me ho gaye</span>
            ) : (
              <span className="badge s-pend">Q1 se Q3 target abhi baaki</span>
            )}
          </div>
        </div>
        <button className="btn" onClick={onNew}>Ek aur contest shuru karo</button>
      </div>
      <div style={{ marginTop: 10 }}>
        {probs.length ? (
          probs.map(p => <ContestProblemRow key={p.id} p={p} ctx={ctx} />)
        ) : (
          <p className="empty">Is contest me koi problem save nahi hua.</p>
        )}
      </div>
    </div>
  );
}

function ContestStart({ ctx, onStarted }) {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [mins, setMins] = useState(String(ctx.data.settings.contestMinutes));
  const [err, setErr] = useState('');
  const start = async () => {
    if (!name.trim()) return setErr('Contest ka naam likho, jaise Weekly Contest 470');
    const m = parseInt(mins, 10);
    if (!(m >= 10 && m <= 300)) return setErr('Time 10 se 300 min ke beech rakho');
    await ctx.save(
      { id: makeId('c'), kind: 'contest', name: name.trim(), link: link.trim(), date: ctx.today, startedAt: Date.now(), minutes: m, endedAt: null, createdAt: Date.now() },
      'Timer shuru. All the best.'
    );
    onStarted();
  };
  return (
    <div className="panel">
      <div className="form">
        <div className="grid">
          <label className="f" style={{ gridColumn: 'span 2' }}>
            Contest
            <input value={name} onChange={e => { setName(e.target.value); setErr(''); }} placeholder="Weekly Contest 470" />
          </label>
          <label className="f">
            Time (min)
            <input type="number" min="10" max="300" value={mins} onChange={e => { setMins(e.target.value); setErr(''); }} />
          </label>
        </div>
        <label className="f">
          Link (optional)
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://leetcode.com/contest/..." inputMode="url" />
        </label>
        {err && <p className="err">{err}</p>}
        <div className="actions">
          <button className="btn primary" onClick={start}>Timer shuru karo</button>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Target: Q1, Q2, Q3 ek ghante me</span>
        </div>
      </div>
    </div>
  );
}

export default function TodayView({ ctx }) {
  const { data, today } = ctx;
  const [newContest, setNewContest] = useState(false);
  const dueP = data.problems.filter(p => p.status !== 'pending' && isDue(p, today)).sort(byDue);
  const dueT = data.topics.filter(t => isDue(t, today)).sort(byDue);
  const dueCount = dueP.length + dueT.length;
  const pending = data.problems.filter(p => p.status === 'pending').sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const todays = data.contests.filter(c => c.date === today).sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  const active = todays.find(c => !c.endedAt) || null;
  const finished = todays.find(c => c.endedAt) || null;
  const olderActive = data.contests.filter(c => c.date !== today && !c.endedAt);
  const streak = streakCount(activityDays(data), today);
  const checks = [
    { label: 'Revise', on: dueCount === 0 },
    { label: 'Contest', on: !!finished },
    { label: 'Upsolve', on: pending.length === 0 }
  ];

  return (
    <div>
      <div className="dayhead">
        <h1>{fmtLong(today)}</h1>
        <div className="streak">{streak > 0 ? <>Streak <b>{streak} din</b></> : 'Aaj se streak shuru karo'}</div>
      </div>
      <div className="checks" aria-label="Aaj ka cycle">
        {checks.map(c => (
          <span key={c.label}>
            <span className={'tick' + (c.on ? ' on' : '')} aria-hidden="true">{c.on ? '✓' : ''}</span>
            {c.label}{c.on ? ' ho gaya' : ''}
          </span>
        ))}
      </div>

      <section className="step" aria-labelledby="s1">
        <div className="stepnum" aria-hidden="true">1</div>
        <h2 className="h" id="s1">Pehle revise karo{dueCount ? ` (${dueCount})` : ''}</h2>
        <p className="sub">
          Har problem blank page pe dobara likho. Atak jao tabhi observation kholo. Atke hue problem ka schedule aaj se dobara shuru hota hai.
        </p>
        {dueCount === 0 ? (
          <p className="empty">Aaj kuch revise nahi karna. Seedha contest pe chalo.</p>
        ) : (
          <div>
            {dueT.map(t => <TopicReviewRow key={t.id} t={t} ctx={ctx} />)}
            {dueP.map(p => <ProblemReviewRow key={p.id} p={p} ctx={ctx} />)}
          </div>
        )}
      </section>

      <section className="step" aria-labelledby="s2">
        <div className="stepnum" aria-hidden="true">2</div>
        <h2 className="h" id="s2">Aaj ka contest</h2>
        <p className="sub">Ek contest chuno, timer chalao, aur har question ka result yahin save karo.</p>
        {olderActive.length > 0 && (
          <p className="warn">
            <span className="hl">{olderActive[0].name} ({fmt(olderActive[0].date)}) ka timer abhi bhi chal raha hai.</span>{' '}
            <button className="linkbtn" onClick={() => ctx.save({ ...olderActive[0], endedAt: Date.now() }, 'Purana contest band kiya')}>
              Band karo
            </button>
          </p>
        )}
        {active ? (
          <ContestRunning c={active} ctx={ctx} />
        ) : finished && !newContest ? (
          <ContestSummary c={finished} ctx={ctx} onNew={() => setNewContest(true)} />
        ) : (
          <ContestStart ctx={ctx} onStarted={() => setNewContest(false)} />
        )}
      </section>

      <section className="step" aria-labelledby="s3">
        <div className="stepnum" aria-hidden="true">3</div>
        <h2 className="h" id="s3">Upsolve{pending.length ? ` (${pending.length})` : ''}</h2>
        <p className="sub">
          Jo contest me nahi hua, wo yahan rukta hai. Upsolve karte waqt ek line ka observation zaroor likho, revision me wahi kaam aayega.
        </p>
        {pending.length === 0 ? (
          <p className="empty">Upsolve list khaali hai.</p>
        ) : (
          pending.map(p => {
            const days = diffDays(p.date, today);
            return (
              <div className="row" key={p.id}>
                <div className="row-main">
                  <div className="title"><Ext href={p.link}>{p.title}</Ext></div>
                  <div className="meta">
                    <span>{where(p)}</span>
                    {days > 0 && <span className={days >= 3 ? 'hl' : ''}>{days} din se baaki</span>}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn primary" onClick={() => ctx.openModal({ type: 'upsolve', item: p })}>Upsolve ho gaya</button>
                  <button className="btn ghost small" onClick={() => ctx.openModal({ type: 'problem', item: p })}>Edit</button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <div className="quick">
        <span>Kuch naya padha ya contest ke bahar koi problem kiya?</span>
        <button className="btn small" onClick={() => ctx.openModal({ type: 'topic' })}>Topic ya pattern add karo</button>
        <button className="btn small" onClick={() => ctx.openModal({ type: 'problem' })}>Practice problem add karo</button>
      </div>
    </div>
  );
}

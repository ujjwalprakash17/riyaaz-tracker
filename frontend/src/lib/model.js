import { addDays } from './dates.js';

export const STATUS = {
  khud: { label: 'Khud kiya', cls: 's-khud' },
  hint: { label: 'Hint se', cls: 's-hint' },
  editorial: { label: 'Editorial se', cls: 's-edit' },
  pending: { label: 'Upsolve baaki', cls: 's-pend' }
};
export const POSITIONS = ['Q1', 'Q2', 'Q3', 'Q4', 'Practice'];
export const POS_ORDER = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, Practice: 5 };
export const DEFAULT_SETTINGS = { problemOffsets: [3, 9], topicOffsets: [3, 9, 20], contestMinutes: 60 };
export const DOC_KINDS = ['problem', 'topic', 'contest', 'settings'];

export const makeId = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const clean = o => JSON.parse(JSON.stringify(o));
export const parseOffsets = s =>
  [...new Set(String(s).split(/[,\s]+/).map(x => parseInt(x, 10)).filter(n => n > 0 && n < 1000))].sort((a, b) => a - b);
export const parseTags = s => String(s || '').split(',').map(t => t.trim()).filter(Boolean);
export const safeHref = u => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : null);

export const schedule = (start, offsets) => (offsets || []).map(o => ({ offset: o, due: addDays(start, o), done: null, result: null }));
export const pendingReviews = it =>
  (it.reviews || []).filter(r => !r.done).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
export const nextReview = it => pendingReviews(it)[0] || null;
export const isDue = (it, today) => {
  const n = nextReview(it);
  return !!n && n.due <= today;
};
export const byDue = (a, b) => {
  const x = nextReview(a).due;
  const y = nextReview(b).due;
  return x < y ? -1 : x > y ? 1 : 0;
};

// Revision ho gayi: aaj tak ki saari due revisions done mark karo.
export function reviewOk(it, today) {
  return {
    ...it,
    reviews: (it.reviews || []).map(r => (!r.done && r.due <= today ? { ...r, done: today, result: 'ok' } : r))
  };
}

// Atak gaye: due revision ko "stuck" mark karo aur schedule aaj se dobara shuru karo.
export function reviewStuck(it, today, offsets) {
  const rs = it.reviews || [];
  const kept = rs
    .filter(r => r.done)
    .concat(rs.filter(r => !r.done && r.due <= today).map(r => ({ ...r, done: today, result: 'stuck' })));
  return { ...it, stuckCount: (it.stuckCount || 0) + 1, reviews: kept.concat(schedule(today, offsets)) };
}

export function activityDays(data) {
  const s = new Set();
  data.contests.forEach(c => s.add(c.date));
  data.problems.forEach(p => {
    s.add(p.date);
    if (p.upsolvedDate) s.add(p.upsolvedDate);
    (p.reviews || []).forEach(r => r.done && s.add(r.done));
  });
  data.topics.forEach(t => {
    s.add(t.learnedDate);
    (t.reviews || []).forEach(r => r.done && s.add(r.done));
  });
  return s;
}

export function streakCount(days, today) {
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export const contestProblems = (problems, c) =>
  problems.filter(p => p.contestId === c.id).sort((a, b) => (POS_ORDER[a.position] || 9) - (POS_ORDER[b.position] || 9));

export const q123Done = probs =>
  ['Q1', 'Q2', 'Q3'].every(q => probs.some(p => p.position === q && p.status === 'khud' && p.inTime));

export function buildData(list) {
  const sd = list.find(d => d.id === 'settings') || {};
  return {
    problems: list.filter(d => d.kind === 'problem' && d.title),
    topics: list.filter(d => d.kind === 'topic' && d.name),
    contests: list.filter(d => d.kind === 'contest'),
    settings: {
      problemOffsets: Array.isArray(sd.problemOffsets) && sd.problemOffsets.length ? sd.problemOffsets : DEFAULT_SETTINGS.problemOffsets,
      topicOffsets: Array.isArray(sd.topicOffsets) && sd.topicOffsets.length ? sd.topicOffsets : DEFAULT_SETTINGS.topicOffsets,
      contestMinutes: sd.contestMinutes || DEFAULT_SETTINGS.contestMinutes
    }
  };
}

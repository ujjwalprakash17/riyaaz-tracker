export const pad = n => String(n).padStart(2, '0');
export const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());
export const fromKey = k => {
  const [y, m, d] = String(k).split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (k, n) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
export const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);
export const fmt = k => (k ? fromKey(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
export const fmtLong = k => fromKey(k).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
export const dayName = (k, today) =>
  k === today ? 'Aaj' : k === addDays(today, 1) ? 'Kal' : fromKey(k).toLocaleDateString('en-IN', { weekday: 'long' });
export const weekStart = k => {
  const d = fromKey(k);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toKey(d);
};

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase.js';
import { localStore, supabaseStore } from './lib/store.js';
import { buildData } from './lib/model.js';
import { todayKey } from './lib/dates.js';
import Login from './components/Login.jsx';
import TodayView from './components/TodayView.jsx';
import SheetView from './components/SheetView.jsx';
import TopicsView from './components/TopicsView.jsx';
import UpcomingView from './components/UpcomingView.jsx';
import ProgressView from './components/ProgressView.jsx';
import { ProblemModal, SettingsModal, TopicModal, UpsolveModal } from './components/modals.jsx';

const TABS = [
  { k: 'aaj', label: 'Aaj', View: TodayView },
  { k: 'sheet', label: 'Sheet', View: SheetView },
  { k: 'topics', label: 'Topics', View: TopicsView },
  { k: 'aage', label: 'Aage ka plan', View: UpcomingView },
  { k: 'progress', label: 'Progress', View: ProgressView }
];

const Loading = () => (
  <div className="wrap"><p className="loading">Copy khul rahi hai…</p></div>
);

export default function App() {
  // undefined = abhi pata nahi, null = login nahi hai
  const [session, setSession] = useState(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (supabase && session === undefined) return <Loading />;
  if (supabase && !session) return <Login />;
  const user = session?.user;
  return <Tracker key={user?.id || 'local'} userId={user?.id} email={user?.email} />;
}

function Tracker({ userId, email }) {
  const store = useMemo(() => (supabase && userId ? supabaseStore(supabase, userId) : localStore()), [userId]);
  const [docs, setDocs] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('aaj');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [today, setToday] = useState(todayKey());

  useEffect(() => store.subscribe(setDocs, e => setLoadError(e?.message || 'Data load nahi hua')), [store]);
  useEffect(() => {
    const t = setInterval(() => setToday(todayKey()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const data = useMemo(() => buildData(docs || []), [docs]);
  const save = useCallback(async (d, msg) => {
    try {
      await store.put(d);
      if (msg) setToast(msg);
    } catch {
      setToast('Save nahi hua. Internet check karke dobara try karo.');
    }
  }, [store]);
  const remove = useCallback(async (id, msg) => {
    try {
      await store.remove(id);
      if (msg) setToast(msg);
    } catch {
      setToast('Delete nahi hua. Dobara try karo.');
    }
  }, [store]);
  const closeModal = useCallback(() => setModal(null), []);

  if (loadError) {
    return (
      <div className="wrap">
        <p className="loading">Data load nahi hua.</p>
        <p className="sub">{loadError}</p>
        <button className="btn" onClick={() => window.location.reload()}>Dobara try karo</button>
      </div>
    );
  }
  if (!docs) return <Loading />;

  const account = supabase && userId ? { email, signOut: () => supabase.auth.signOut() } : null;
  const ctx = { data, today, save, remove, store, docs, account, toast: setToast, openModal: setModal };
  const { View } = TABS.find(t => t.k === tab);

  return (
    <div className="wrap">
      <header className="top">
        <p className="brand">Riyaaz<small>Roz revise, roz contest, roz upsolve</small></p>
        <nav className="tabs" aria-label="Sections">
          {TABS.map(t => (
            <button key={t.k} className="tab" aria-current={tab === t.k ? 'page' : undefined} onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
          <button className="tab" onClick={() => setModal({ type: 'settings' })}>Settings</button>
        </nav>
      </header>
      {store.kind === 'local' && (
        <p className="warn">
          <span className="hl">Supabase connect nahi hai, data sirf is browser me save ho raha hai.</span> README dekh ke .env.local set karo.
        </p>
      )}
      <main className="page"><View ctx={ctx} /></main>
      {modal?.type === 'problem' && <ProblemModal key={modal.item?.id || 'new'} ctx={ctx} p={modal.item} onClose={closeModal} />}
      {modal?.type === 'upsolve' && <UpsolveModal ctx={ctx} p={modal.item} onClose={closeModal} />}
      {modal?.type === 'topic' && <TopicModal key={modal.item?.id || 'new'} ctx={ctx} t={modal.item} onClose={closeModal} />}
      {modal?.type === 'settings' && <SettingsModal ctx={ctx} onClose={closeModal} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

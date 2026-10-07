import { clean } from './model.js';

const LOCAL_KEY = 'riyaaz-v1';

// Har store ka ek hi shape hai: subscribe(onDocs, onError), put(doc), remove(id).
// UI ko farak nahi padta data kahan save ho raha hai.

export function localStore() {
  let docs = {};
  try {
    docs = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') || {};
  } catch {
    docs = {};
  }
  let cb = null;
  const emit = () => cb && cb(Object.values(docs));
  const persist = () => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(docs));
    } catch {
      /* storage full ya blocked */
    }
  };
  return {
    kind: 'local',
    subscribe(f) {
      cb = f;
      setTimeout(emit, 0);
      return () => {
        cb = null;
      };
    },
    async put(d) {
      docs[d.id] = clean(d);
      persist();
      emit();
    },
    async remove(id) {
      delete docs[id];
      persist();
      emit();
    }
  };
}

export function supabaseStore(sb, userId) {
  let cache = new Map();
  let cb = null;
  const emit = () => cb && cb([...cache.values()]);
  const toDoc = row => ({ ...row.data, id: row.id, kind: row.kind });

  async function loadAll() {
    const size = 1000;
    const rows = [];
    for (let from = 0; ; from += size) {
      const { data, error } = await sb
        .from('docs')
        .select('id,kind,data')
        .eq('user_id', userId)
        .range(from, from + size - 1);
      if (error) throw error;
      rows.push(...data);
      if (data.length < size) break;
    }
    return rows;
  }

  return {
    kind: 'supabase',
    subscribe(f, onErr) {
      cb = f;
      let alive = true;
      loadAll()
        .then(rows => {
          if (!alive) return;
          cache = new Map(rows.map(r => [r.id, toDoc(r)]));
          emit();
        })
        .catch(e => onErr && onErr(e));

      // Doosre device se hua change live aata hai (realtime on ho to).
      const channel = sb
        .channel('docs-' + userId + '-' + Math.random().toString(36).slice(2, 8))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: 'user_id=eq.' + userId }, payload => {
          if (payload.eventType === 'DELETE') {
            const old = payload.old || {};
            if (old.id && (!old.user_id || old.user_id === userId)) {
              cache.delete(old.id);
              emit();
            }
          } else if (payload.new && payload.new.user_id === userId) {
            cache.set(payload.new.id, toDoc(payload.new));
            emit();
          }
        })
        .subscribe();

      return () => {
        alive = false;
        cb = null;
        sb.removeChannel(channel);
      };
    },
    async put(d) {
      const body = clean(d);
      const { id } = body;
      delete body.id;
      const prev = cache.get(id);
      cache.set(id, clean(d));
      emit();
      const { error } = await sb
        .from('docs')
        .upsert({ user_id: userId, id, kind: d.kind, data: body, updated_at: new Date().toISOString() }, { onConflict: 'user_id,id' });
      if (error) {
        if (prev) cache.set(id, prev);
        else cache.delete(id);
        emit();
        throw error;
      }
    },
    async remove(id) {
      const prev = cache.get(id);
      cache.delete(id);
      emit();
      const { error } = await sb.from('docs').delete().eq('user_id', userId).eq('id', id);
      if (error) {
        if (prev) {
          cache.set(id, prev);
          emit();
        }
        throw error;
      }
    }
  };
}

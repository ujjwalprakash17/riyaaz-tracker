import { useState } from 'react';
import { googleEnabled, supabase } from '../lib/supabase.js';

const friendly = error =>
  /fetch|network/i.test(error.message || '')
    ? 'Supabase se connect nahi hua. Internet, aur .env.local me URL aur key check karo.'
    : /rate limit/i.test(error.message || '')
      ? 'Bahut saare login emails ho gaye. Thodi der baad try karo.'
      : error.message;

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async e => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Sahi email likho');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) setErr(friendly(error));
    else setSent(true);
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setErr(friendly(error));
  };

  return (
    <div className="wrap">
      <header className="top">
        <p className="brand">Riyaaz<small>Roz revise, roz contest, roz upsolve</small></p>
      </header>
      <main className="page">
        <div className="login">
          <div className="dayhead"><h1>Login karo</h1></div>
          {sent ? (
            <p className="sub">Email bhej diya. Inbox (aur spam folder) me link kholo, wahi se login ho jaoge. Ye tab khula chhod sakte ho.</p>
          ) : (
            <>
              <p className="sub">Email daalo, ek login link aayega. Password ki zaroorat nahi.</p>
              <form onSubmit={send}>
                <label className="f">
                  Email
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} placeholder="tum@example.com" autoComplete="email" />
                </label>
                {err && <p className="err">{err}</p>}
                <div className="actions">
                  <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Bhej rahe hain…' : 'Login link bhejo'}</button>
                </div>
              </form>
              {googleEnabled && (
                <>
                  <p className="or">ya</p>
                  <button className="btn" onClick={google}>Google se login karo</button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

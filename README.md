# Riyaaz: roz ka practice tracker

Roz ka cycle: pehle revise, phir contest (1 ghante ka timer), phir upsolve.
Problems 3 aur 9 din pe, topics aur patterns 3, 9 aur 20 din pe revision ke liye wapas aate hain.

```
tracker-app/
  backend/      Supabase ka database schema aur setup notes
  frontend/     React + Vite app (yahi Vercel pe deploy hota hai)
```

## Zaroori cheezein

- Node.js **22 ya usse naya** (`node -v` se check karo)
- Git
- Supabase, GitHub aur Vercel ke free accounts

## 1. Local pe chalao

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` kholo. Supabase set nahi hai to app "local mode" me chalega, data sirf browser me rahega.

## 2. Supabase jodo

`backend/README.md` ke steps follow karo. Phir:

```bash
cd frontend
copy .env.example .env.local     # Mac/Linux pe: cp .env.example .env.local
```

`.env.local` me `VITE_SUPABASE_URL` aur `VITE_SUPABASE_KEY` bharo, aur `npm run dev` dobara chalao. Ab login page aayega.

## 3. Deploy (Vercel)

1. `tracker-app` folder ko GitHub repo me push karo. `.env.local` `.gitignore` me hai, wo push nahi hogi.
2. vercel.com > Add New > Project > repo import karo.
3. **Root Directory: `frontend`**. Framework apne aap Vite detect hoga.
4. Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` (aur Google use karo to `VITE_ENABLE_GOOGLE=true`).
5. Deploy. Jo URL mile, use Supabase > Authentication > URL Configuration me Site URL aur Redirect URLs me daalo.

Iske baad har `git push` pe Vercel apne aap naya version deploy karega.

## Purana data laana

Claude wale Riyaaz artifact me Settings > "Backup download karo". Naye app me login karke Settings > "Backup se wapas lao" me wo file chuno.

## Code kahan kya hai

- `src/lib/model.js`: revision schedule, streak, saare calculations
- `src/lib/store.js`: data kahan save hota hai (Supabase ya localStorage). UI sirf `subscribe`, `put`, `remove` jaanta hai.
- `src/components/`: har page ka UI

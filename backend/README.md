# Backend (Supabase)

Is project me alag server nahi hai. Backend ka saara kaam Supabase karta hai:

- **Login:** email pe magic link (Google optional).
- **Database:** Postgres table `docs`, jisme har problem, topic, contest aur settings ek row hai.
- **Security:** Row Level Security, taaki har user sirf apna data dekh aur badal sake.
- **Realtime:** ek device pe save karo, doosre pe khula page apne aap update ho.

## Setup

1. supabase.com pe naya project banao (region: Mumbai `ap-south-1` paas padega).
2. Dashboard > **SQL Editor** > New query > `supabase/schema.sql` ka poora content paste karo > **Run**.
3. **Table Editor** me `docs` table dikhni chahiye, "RLS enabled" ke saath.
4. Project URL aur **publishable key** (purane projects me "anon public" key) copy karke `frontend/.env.local` me daalo. `.env.example` dekho.
5. **Authentication > URL Configuration**:
   - Site URL: deploy ke baad Vercel wala URL (tab tak `http://localhost:5173`).
   - Redirect URLs: `http://localhost:5173/**` aur `https://TUMHARA-APP.vercel.app/**`.

## Dhyan rakhne wali baatein

- `secret` ya `service_role` key kabhi frontend me ya GitHub pe mat daalna. Wo RLS ko bypass karti hai.
- Supabase ka built-in email ghante me kuch hi login emails bhejta hai. Personal use ke liye kaafi hai.
- Free plan pe project kaafi din bina use ke pada rahe to pause ho sakta hai. Dashboard se "Restore" karke wapas chalu hota hai.

## Google login (optional)

Google Cloud Console me OAuth client banao, Supabase > Authentication > Providers > Google me client ID aur secret daalo, phir `frontend/.env.local` me `VITE_ENABLE_GOOGLE=true` karo.

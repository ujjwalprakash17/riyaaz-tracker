import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

// Env vars na hon to app local mode me chalega (data sirf browser me).
export const supabase = url && key ? createClient(url, key) : null;
export const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE === 'true';

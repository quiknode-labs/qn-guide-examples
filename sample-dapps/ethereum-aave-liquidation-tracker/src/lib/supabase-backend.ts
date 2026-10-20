import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');

// Never import this client from browser code or prefix its secret with VITE_.
export const supabaseServer = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
});

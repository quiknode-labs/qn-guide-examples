import { createClient } from '@supabase/supabase-js';

// Frontend Supabase client (uses Vite environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env file'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey); 

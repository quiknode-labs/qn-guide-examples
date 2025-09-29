import { createClient } from '@supabase/supabase-js';

// Supabase Client Instance for Frontend Access
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
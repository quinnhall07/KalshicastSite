// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

// The '||' provides a dummy fallback strictly so the build phase doesn't crash 
// if Vercel temporarily loses track of the variables while compiling.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Database } from 'https://raw.githubusercontent.com/J0/sms-to-llm/main/supabase/types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

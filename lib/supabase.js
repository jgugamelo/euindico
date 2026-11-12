import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcftlgiwssxccatfyrqe.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjZnRsZ2l3c3N4Y2NhdGZ5cnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDQ2NjMsImV4cCI6MjA5OTAyMDY2M30.R3laAjPIgodHZQH7vBGzvulz5J1QBEBaARm__p-q62s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

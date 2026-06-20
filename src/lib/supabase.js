// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://thtumfwamkkchuousgio.supabase.co'
const supabaseAnonKey = 'sb_publishable_Gom-p3BXr5F7gAuVoTvp8g_SWL1-5IE'
const supabaseServiceKey = 'sb_secret_h14yAFb8TIOQZae0ykVppQ_B0wHfcn6'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
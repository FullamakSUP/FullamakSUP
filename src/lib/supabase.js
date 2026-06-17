import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qixzepbovycnswujfoai.supabase.co'
const supabaseKey = 'sb_publishable_PsnvAziCkiUQ73YrnqZdww_dgDawTcD'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { heartbeatIntervalMs: 15000 }
})
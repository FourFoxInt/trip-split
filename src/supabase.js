import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ufmrdqqugrmimvaynbit.supabase.co'
const supabaseKey = 'sb_publishable_ngOTPdJxM459CylryCPakA_zs0Mavk5'

export const supabase = createClient(supabaseUrl, supabaseKey)
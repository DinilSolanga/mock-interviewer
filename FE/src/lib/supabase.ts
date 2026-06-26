import {createClient} from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// create the supabase instance to be used across the frontend
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

console.log(import.meta.env.VITE_SUPABASE_URL)
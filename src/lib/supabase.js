// src/lib/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto' 


// ⚠️ Replace with your actual Supabase project values
const SUPABASE_URL = 'https://zjeyyryirpsiugngyqll.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZXl5cnlpcnBzaXVnbmd5cWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MzcwMjMsImV4cCI6MjA3NzExMzAyM30.RMQ52ZzJHGYJiwuTcoJRkVlfJSCd0k5DEuZL25bo5dQ'

// ✅ Create and export a single Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // required for mobile apps
  },
})

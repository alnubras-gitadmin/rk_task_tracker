import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  title: string
  description: string | null
  metadata: any
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  description: string | null
  status: 'pending' | 'in-progress' | 'completed'
  assigned_to: string | null
  due_date: string | null
  metadata: any
  created_by: string
  created_at: string
  updated_at: string
}
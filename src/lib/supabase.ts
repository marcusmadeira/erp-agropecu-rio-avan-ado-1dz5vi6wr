import type { Database } from './database.types'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

export const createProvisionalClient = () => {
  return {
    url: supabaseUrl,
    key: supabaseAnonKey,
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
      insert: (data: Record<string, unknown>) => Promise.resolve({ data: null, error: null }),
      update: (data: Record<string, unknown>) => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
  }
}

export const supabase = createProvisionalClient()

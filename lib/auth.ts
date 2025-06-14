import { SupabaseClient } from '@supabase/supabase-js'

export async function signInWithEmail(client: SupabaseClient, email: string) {
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) throw error
}

export async function signOut(client: SupabaseClient) {
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(client: SupabaseClient) {
  const { data: { user } } = await client.auth.getUser()
  return user
}

export const getProfile = async (supabase, userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const updateProfile = async (supabase, userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
} 
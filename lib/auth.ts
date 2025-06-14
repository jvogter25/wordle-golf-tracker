export const signInWithEmail = async (supabase, email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'wordle-golf-tracker://auth',
    },
  })
  
  if (error) throw error
  return { success: true }
}

export const signOut = async (supabase) => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async (supabase) => {
  const { data: { user } } = await supabase.auth.getUser()
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
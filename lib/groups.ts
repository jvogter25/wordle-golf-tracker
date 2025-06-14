// Generate unique invite code
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const createGroup = async (supabase, name: string, description?: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  const inviteCode = generateInviteCode()
  
  // Create group with direct approach (RLS is disabled)
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      created_by: user.data.user.id,
      invite_code: inviteCode
    })
    .select()
    .single()
  
  if (groupError) throw groupError
  
  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.data.user.id,
      role: 'admin'
    })
  
  if (memberError) throw memberError
  
  return group
}

export const joinGroupByCode = async (supabase, inviteCode: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Use database function to join group
  const { data, error } = await supabase.rpc('join_group_by_code', {
    invite_code_param: inviteCode
  })
  
  if (error) throw new Error(error.message)
  
  return data
}

export const getUserGroups = async (supabase) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Use database function to get user groups
  const { data, error } = await supabase.rpc('get_user_groups')
  
  if (error) throw error
  
  return data || []
}

export const getGroupMembers = async (supabase, groupId: string) => {
  // Use database function to get group members
  const { data, error } = await supabase.rpc('get_group_members', {
    group_id: groupId,
  })
  
  if (error) throw error
  
  return data || []
}

export const leaveGroup = async (supabase, groupId: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Use database function to leave group
  const { data, error } = await supabase.rpc('leave_group', {
    group_id_param: groupId
  })
  
  if (error) throw error
  
  return data
} 
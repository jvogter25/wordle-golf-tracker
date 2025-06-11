import { supabase } from './supabase'

// Generate unique invite code
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const createGroup = async (name: string, description?: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  const inviteCode = generateInviteCode()
  
  // Create group
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

export const joinGroupByCode = async (inviteCode: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Find group by invite code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()
  
  if (groupError) throw new Error('Invalid invite code')
  
  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', group.id)
    .eq('user_id', user.data.user.id)
    .single()
  
  if (existingMember) throw new Error('Already a member of this group')
  
  // Add as member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.data.user.id,
      role: 'member'
    })
  
  if (memberError) throw memberError
  
  return group
}

export const getUserGroups = async () => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      groups (
        id,
        name,
        description,
        invite_code,
        created_at
      )
    `)
    .eq('user_id', user.data.user.id)
  
  if (error) throw error
  
  return data.map(member => ({
    ...member.groups,
    role: member.role,
    joined_at: member.joined_at
  }))
}

export const getGroupMembers = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      profiles (
        id,
        email,
        display_name,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
  
  if (error) throw error
  
  return data.map(member => ({
    ...member.profiles,
    role: member.role,
    joined_at: member.joined_at
  }))
}

export const leaveGroup = async (groupId: string) => {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.data.user.id)
  
  if (error) throw error
} 
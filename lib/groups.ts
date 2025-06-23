import { SupabaseClient } from '@supabase/supabase-js'

// Generate unique invite code
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createGroup(client: SupabaseClient, name: string, description?: string) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Restrict group creation to admin only
  if (user.data.user.email !== 'jakevogt25@gmail.com') {
    throw new Error('Only administrators can create groups')
  }
  
  const inviteCode = generateInviteCode()
  
  // Create group with direct approach (RLS is disabled)
  const { data: group, error: groupError } = await client
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
  const { error: memberError } = await client
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.data.user.id,
      role: 'admin'
    })
  
  if (memberError) throw memberError
  
  return group
}

export async function joinGroupByCode(client: SupabaseClient, inviteCode: string) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Find group by invite code
  const { data: group, error: groupError } = await client
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()
  
  if (groupError || !group) {
    throw new Error('Invalid invite code')
  }
  
  // Check if user is already a member
  const { data: existingMember } = await client
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.data.user.id)
    .single()
  
  if (existingMember) {
    throw new Error('You are already a member of this group')
  }
  
  // Add user to group
  const { data, error } = await client
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.data.user.id,
      role: 'member'
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  return data
}

export async function getUserGroups(client: SupabaseClient) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  console.log('🔍 Getting groups for user:', user.data.user.id)
  
  // Get only groups where the user is a member
  const { data, error } = await client
    .from('group_members')
    .select(`
      group_id,
      role,
      groups (
        id,
        name,
        description,
        invite_code,
        created_at
      )
    `)
    .eq('user_id', user.data.user.id)
  
  console.log('🔍 Group members query result:', { data, error })
  
  if (error) {
    console.log('User groups query error:', error)
    return []
  }
  
  // Transform the data to match expected format
  const groups = data?.map(member => member.groups).filter(group => group !== null) || []
  console.log('🔍 Final groups returned:', groups)
  return groups
}

export async function getGroupMembers(client: SupabaseClient, groupId: string) {
  // Simple direct query instead of RPC
  const { data, error } = await client
    .from('group_members')
    .select(`
      *,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
  
  if (error) {
    console.log('Group members query error:', error)
    return []
  }
  
  // Transform the data to match expected format
  return data?.map(member => ({
    id: member.profiles?.id,
    display_name: member.profiles?.display_name,
    avatar_url: member.profiles?.avatar_url,
    handicap: 0 // Default handicap since it's in a separate table
  })) || []
}

export async function leaveGroup(client: SupabaseClient, groupId: string) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Remove user from group
  const { data, error } = await client
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.data.user.id)
    .select()
  
  if (error) throw error
  
  return data
}

export async function deleteGroup(client: SupabaseClient, groupId: string) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Check if user is admin of the group
  const { data: membership, error: memberError } = await client
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.data.user.id)
    .single()
  
  if (memberError || !membership || membership.role !== 'admin') {
    throw new Error('Only group admins can delete groups')
  }
  
  // Delete all group members first
  const { error: membersError } = await client
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
  
  if (membersError) throw membersError
  
  // Delete the group
  const { error: groupError } = await client
    .from('groups')
    .delete()
    .eq('id', groupId)
  
  if (groupError) throw groupError
  
  return true
}

export async function updateGroup(client: SupabaseClient, groupId: string, updates: { name?: string, description?: string }) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Check if user is admin of the group
  const { data: membership, error: memberError } = await client
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.data.user.id)
    .single()
  
  if (memberError || !membership || membership.role !== 'admin') {
    throw new Error('Only group admins can update groups')
  }
  
  // Update the group
  const { data: group, error: groupError } = await client
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single()
  
  if (groupError) throw groupError
  
  return group
} 
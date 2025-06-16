import { SupabaseClient } from '@supabase/supabase-js'

// Generate unique invite code
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createGroup(client: SupabaseClient, name: string, description?: string) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
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
  
  // Use database function to join group
  const { data, error } = await client.rpc('join_group_by_code', {
    invite_code_param: inviteCode
  })
  
  if (error) throw new Error(error.message)
  
  return data
}

export async function getUserGroups(client: SupabaseClient) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Use database function to get user groups
  const { data, error } = await client.rpc('get_user_groups')
  
  if (error) throw error
  
  return data || []
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
        avatar_url,
        handicap
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
    handicap: member.profiles?.handicap || 0
  })) || []
}

export async function leaveGroup(client: SupabaseClient, groupId: string) {
  const user = await client.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')
  
  // Use database function to leave group
  const { data, error } = await client.rpc('leave_group', {
    group_id_param: groupId
  })
  
  if (error) throw error
  
  return data
} 
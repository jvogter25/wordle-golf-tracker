import { SupabaseClient } from '@supabase/supabase-js'

export interface AvatarUploadResult {
  success: boolean
  avatarUrl?: string
  error?: string
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<AvatarUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file.' }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Image must be less than 5MB.' }
    }

    // Delete existing avatar first (one image per user)
    await deleteExistingAvatar(supabase, userId)

    // Create consistent filename (overwrites any existing)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true // This will overwrite existing files
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // Get public URL with cache busting timestamp
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Add cache busting parameter to force browser to reload image
    const cacheBustUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: cacheBustUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { success: false, error: `Profile update failed: ${updateError.message}` }
    }

    return { success: true, avatarUrl: cacheBustUrl }
  } catch (error: any) {
    console.error('Avatar upload error:', error)
    return { success: false, error: error.message }
  }
}

export async function removeAvatar(
  supabase: SupabaseClient,
  userId: string
): Promise<AvatarUploadResult> {
  try {
    // Delete from storage
    await deleteExistingAvatar(supabase, userId)
    
    // Remove avatar URL from profile
    const { error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      return { success: false, error: `Profile update failed: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Avatar removal error:', error)
    return { success: false, error: error.message }
  }
}

async function deleteExistingAvatar(supabase: SupabaseClient, userId: string) {
  try {
    // List all files for this user
    const { data: files } = await supabase.storage
      .from('avatars')
      .list('', {
        search: userId
      })

    if (files && files.length > 0) {
      // Delete all existing files for this user
      const filesToDelete = files
        .filter(file => file.name.startsWith(userId))
        .map(file => file.name)

      if (filesToDelete.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete)
      }
    }
  } catch (error) {
    console.warn('Could not delete existing avatar:', error)
    // Don't throw - this is cleanup, not critical
  }
} 
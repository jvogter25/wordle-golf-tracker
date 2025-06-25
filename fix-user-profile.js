const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixUserProfile() {
  const userEmail = process.argv[2]
  const displayName = process.argv[3]
  
  if (!userEmail || !displayName) {
    console.log('Usage: node fix-user-profile.js user@example.com "Display Name"')
    process.exit(1)
  }
  
  console.log(`🔧 Creating profile for: ${userEmail}`)
  
  // First, let's try to sign up the user (this creates both auth + profile)
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: userEmail,
    password: '123456', // Default password
  })
  
  if (signupError && !signupError.message.includes('already registered')) {
    console.error('❌ Signup error:', signupError)
    return
  }
  
  if (signupData.user) {
    // Update the profile with display name
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', signupData.user.id)
    
    if (updateError) {
      console.error('❌ Profile update error:', updateError)
    } else {
      console.log('✅ Profile created successfully!')
      console.log(`📧 User should check email for confirmation link`)
      console.log(`🔑 Default password: 123456 (user should change this)`)
    }
  } else {
    console.log('ℹ️ User already exists in auth, but profile may still be missing')
  }
}

fixUserProfile().catch(console.error) 
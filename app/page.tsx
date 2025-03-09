import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Home() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check if user is authenticated using getUser() for security
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Handle authentication status
    if (user) {
      // Verify that user profile exists in database
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
          
        if (profileError || !profile) {
          console.error('Profile validation error:', profileError)
          // If profile check fails, invalidate session and redirect to login
          await supabase.auth.signOut()
          return redirect('/home')
        }
        
        // Authenticated users with valid profile go directly to their dashboard
        return redirect('/dashboard')
      } catch (verifyError) {
        console.error('Session verification error:', verifyError)
        return redirect('/home')
      }
    } else {
      // Non-authenticated users go to home
      return redirect('/home')
    }
  } catch (error) {
    // If any auth errors occur, just redirect to home
    console.error('Auth error:', error)
    return redirect('/home')
  }
}
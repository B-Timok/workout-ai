import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Home() {
  try {
    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Handle authentication status
    if (session) {
      // Authenticated users go directly to their dashboard
      return redirect('/dashboard')
    } else {
      // Non-authenticated users go to login
      return redirect('/login')
    }
  } catch (error) {
    // If any auth errors occur, just redirect to login
    console.error('Auth error:', error)
    return redirect('/login')
  }
}
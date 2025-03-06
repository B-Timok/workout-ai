import { ChatInterface } from "@/components/chat-interface"
import { createClient } from '@/lib/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Home() {
  // Initialize Supabase client
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Check if user is authenticated by getting the current session
  // This is a server-side check that happens on every page load
  const { data: { session } } = await supabase.auth.getSession()
  
  // Fetch workouts (once you create the workouts table)
  // If the table doesn't exist yet, this will return an empty array
  const { data: workouts, error } = await supabase.from('workouts').select('*').limit(5)
  
  // You can handle errors if needed
  if (error) {
    console.error('Error fetching workouts:', error)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold">Workout Assistant</span>
            </a>
          </div>
          
          {/* Auth navigation - conditionally renders based on session */}
          <div className="flex items-center gap-4">
            {session ? (
              <>
                {/* Show these links only when user is logged in */}
                <a 
                  className="text-muted-foreground hover:text-foreground" 
                  href="/dashboard"
                >
                  My Dashboard
                </a>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Show these links only when user is NOT logged in */}
                <a 
                  className="text-muted-foreground hover:text-foreground" 
                  href="/login"
                >
                  Sign in
                </a>
                <a 
                  className="text-muted-foreground hover:text-foreground" 
                  href="/signup"
                >
                  Sign up
                </a>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
            <div className="h-full py-6 pl-8 pr-6 lg:py-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <nav className="flex flex-col gap-1">
                    <a className="text-muted-foreground hover:text-foreground" href="/dashboard">
                      Dashboard
                    </a>
                    {/* Conditionally show links that require authentication */}
                    {session ? (
                      <>
                        <a className="text-muted-foreground hover:text-foreground" href="/workouts">
                          My Workouts
                        </a>
                        <a className="text-muted-foreground hover:text-foreground" href="/profile">
                          Profile
                        </a>
                        <a className="text-muted-foreground hover:text-foreground" href="/settings">
                          Settings
                        </a>
                      </>
                    ) : (
                      <a className="text-muted-foreground hover:text-foreground" href="/login?redirect=/workouts">
                        Sign in to view workouts
                      </a>
                    )}
                  </nav>
                </div>
                
                {/* Display workouts from Supabase if available and user is authenticated */}
                {session && workouts && workouts.length > 0 && (
                  <div className="flex flex-col gap-1 mt-4">
                    <h2 className="text-lg font-semibold">Recent Workouts</h2>
                    <ul className="flex flex-col gap-1">
                      {workouts.map((workout) => (
                        <li key={workout.id}>
                          <a 
                            className="text-muted-foreground hover:text-foreground" 
                            href={`/workouts/${workout.id}`}
                          >
                            {workout.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </aside>
          <div className="w-full min-w-0">
            <div className="p-6">
              <ChatInterface />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NavigationHeader from "@/components/NavigationHeader";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Use getUser() instead of getSession() for more secure authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // If user is not logged in or there was an error, redirect to login page
  if (error || !user) {
    redirect("/login");
  }
  
  // Fetch user's workouts
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationHeader />
      
      <main className="flex-1 py-10">
        <div className="container">
          <h1 className="mb-6 text-2xl font-bold">Your Dashboard</h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Workout Card - Create New */}
            <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Create New Workout</h3>
                <p className="text-sm text-muted-foreground">Generate a customized workout plan</p>
              </div>
              <div className="p-6 pt-0">
                <a 
                  href="/workouts/new" 
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
                >
                  Get Started
                </a>
              </div>
            </div>
            
            {/* Display existing workouts or a message if none */}
            {workouts && workouts.length > 0 ? (
              workouts.map((workout) => (
                <div key={workout.id} className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">{workout.name || "Workout Plan"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workout.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-6 pt-0">
                    <a 
                      href={`/workouts/${workout.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/90"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center">
                <p className="text-muted-foreground">You haven't created any workouts yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
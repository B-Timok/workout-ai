"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
import NavigationHeader from "@/components/NavigationHeader";

// Type definition for workout
interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string;
  exercises: any[];
  duration: number;
  difficulty: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    async function fetchWorkouts() {
      setLoading(true);
      
      // Check if the user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Fetch user's workouts
      const { data: workouts, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching workouts:", error);
      } else {
        setWorkouts(workouts || []);
      }
      
      setLoading(false);
    }
    
    fetchWorkouts();
  }, [router, supabase]);
  
  // Handle workout deletion
  const handleDeleteWorkout = async (workoutId: string) => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/delete-workout?id=${workoutId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete workout");
      }
      
      // Remove deleted workout from state
      setWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
      setDeleteWorkoutId(null);
    } catch (error) {
      console.error("Error deleting workout:", error);
      setError((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationHeader />
      
      <main className="flex-1 py-10">
        <div className="container">
          <h1 className="mb-6 text-2xl font-bold">Your Dashboard</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
              {error}
            </div>
          )}
          
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
            {loading ? (
              <div className="col-span-full text-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading your workouts...</p>
              </div>
            ) : workouts.length > 0 ? (
              workouts.map((workout) => (
                <div key={workout.id} className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">{workout.name || "Workout Plan"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workout.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-6 pt-0 flex justify-between items-center">
                    <a 
                      href={`/workouts/${workout.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/90"
                    >
                      View Details
                    </a>
                    <button
                      onClick={() => setDeleteWorkoutId(workout.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-destructive border border-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete workout"
                      aria-label="Delete workout"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center">
                <p className="text-muted-foreground">You haven't created any workouts yet.</p>
              </div>
            )}
          </div>
          
          {/* Delete confirmation modal */}
          {deleteWorkoutId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Delete Workout</h3>
                <p className="mb-6">Are you sure you want to delete this workout? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setDeleteWorkoutId(null)}
                    className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteWorkoutId && handleDeleteWorkout(deleteWorkoutId)}
                    className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
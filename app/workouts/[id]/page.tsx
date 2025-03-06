"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import NavigationHeader from "@/components/NavigationHeader";

// Type definition for exercises
interface Exercise {
  name: string;
  description: string;
  sets: number | null;
  reps: string | null;
  duration: string | null;
}

// Type definition for workout
interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  duration: number;
  difficulty: string;
  created_at: string;
}

export default function WorkoutDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    async function fetchWorkout() {
      setLoading(true);

      // Check if the user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Get the workout details
      const { data: workout, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Error fetching workout:", error);
        setError("Could not load this workout. It may not exist or you don't have permission to view it.");
      } else if (workout) {
        // Verify that the workout belongs to the current user
        if (workout.user_id !== user.id) {
          setError("You don't have permission to view this workout.");
          setLoading(false);
          return;
        }

        setWorkout(workout);
      }

      setLoading(false);
    }

    fetchWorkout();
  }, [params.id, router, supabase]);

  // Handle exercise completion toggle
  const toggleExerciseCompletion = (exerciseName: string) => {
    setCompletedExercises(prev => {
      if (prev.includes(exerciseName)) {
        return prev.filter(name => name !== exerciseName);
      } else {
        return [...prev, exerciseName];
      }
    });
  };

  // Format difficulty level for display
  const formatDifficulty = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  // Handle workout deletion
  const handleDeleteWorkout = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/delete-workout?id=${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete workout");
      }

      // Redirect to dashboard after successful deletion
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting workout:", error);
      setError((error as Error).message);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading your workout plan...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-md p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
            <p className="mb-6">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Workout Not Found</h2>
            <p className="mb-6">This workout could not be found or has been deleted.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationHeader />

      <main className="flex-1 py-10">
        <div className="container max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{workout.name}</h1>
              <div className="flex mt-2 space-x-4 text-sm">
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Duration:</span>
                  <span>{workout.duration} minutes</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Difficulty:</span>
                  <span>{formatDifficulty(workout.difficulty)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Created:</span>
                  <span>{new Date(workout.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="px-4 py-2 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Workout"}
              </button>
            </div>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Delete Workout</h3>
                <p className="mb-6">Are you sure you want to delete this workout? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteWorkout}
                    className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8 p-4 bg-secondary/10 rounded-lg">
            <h2 className="font-semibold mb-2">Description</h2>
            <p>{workout.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Exercise Plan</h2>
            <div className="space-y-4">
              {workout.exercises.map((exercise, index) => (
                <div
                  key={`${exercise.name}-${index}`}
                  className={`p-4 border rounded-lg transition-colors ${
                    completedExercises.includes(exercise.name)
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-lg">{exercise.name}</h3>
                        {completedExercises.includes(exercise.name) && (
                          <span className="ml-2 text-sm font-medium text-primary">Completed</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">{exercise.description}</p>

                      <div className="flex flex-wrap mt-2 gap-y-1 gap-x-4">
                        {exercise.sets && (
                          <div className="text-sm">
                            <span className="font-medium">Sets:</span> {exercise.sets}
                          </div>
                        )}
                        {exercise.reps && (
                          <div className="text-sm">
                            <span className="font-medium">Reps:</span> {exercise.reps}
                          </div>
                        )}
                        {exercise.duration && (
                          <div className="text-sm">
                            <span className="font-medium">Duration:</span> {exercise.duration}
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={completedExercises.includes(exercise.name)}
                        onChange={() => toggleExerciseCompletion(exercise.name)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="mb-4">
                <span className="font-medium">{completedExercises.length}</span> of <span className="font-medium">{workout.exercises.length}</span> exercises completed
              </div>

              {completedExercises.length === workout.exercises.length && workout.exercises.length > 0 ? (
                <div className="p-4 bg-primary/10 text-primary rounded-lg">
                  <h3 className="font-bold text-lg">Workout Complete! 🎉</h3>
                  <p>Great job finishing your workout!</p>
                </div>
              ) : (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Save Progress
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

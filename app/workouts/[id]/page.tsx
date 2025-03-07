"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/utils/supabase/client"
import NavigationHeader from "@/components/NavigationHeader"
import { Check, Clock, ArrowLeft, Trash2, Award, Calendar } from "lucide-react"

// Type definition for exercises
interface Exercise {
  name: string
  description: string
  sets: number | null
  reps: string | null
  duration: string | null
}

// Type definition for workout
interface Workout {
  id: string
  user_id: string
  name: string
  description: string
  exercises: Exercise[]
  duration: number
  difficulty: string
  created_at: string
  completed?: boolean
  completed_at?: string
  completed_exercises?: string[]
}

export default function WorkoutDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [redirectToast, setRedirectToast] = useState(false)

  useEffect(() => {
    async function fetchWorkout() {
      setLoading(true)

      try {
        // Check if the user is logged in
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get the workout details
        const { data: workout, error } = await supabase.from("workouts").select("*").eq("id", params.id).single()

        if (error) {
          console.error("Error fetching workout:", error)
          setError("Could not load this workout. It may not exist or you don't have permission to view it.")
        } else if (workout) {
          // Verify that the workout belongs to the current user
          if (workout.user_id !== user.id) {
            setError("You don't have permission to view this workout.")
            setLoading(false)
            return
          }

          console.log("Fetched workout:", workout)
          setWorkout(workout)

          // If this workout has saved exercises, restore them
          if (workout.completed_exercises && Array.isArray(workout.completed_exercises)) {
            console.log("Restoring completed exercises:", workout.completed_exercises)
            setCompletedExercises(workout.completed_exercises)
          } else {
            console.log("No completed exercises to restore", workout.completed_exercises)
            setCompletedExercises([])
          }
        }
      } catch (err) {
        console.error("Unexpected error loading workout:", err)
        setError("An unexpected error occurred while loading the workout.")
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [params.id, router, supabase])

  // Handle exercise completion toggle
  const toggleExerciseCompletion = (exerciseName: string) => {
    setCompletedExercises((prev) => {
      if (prev.includes(exerciseName)) {
        return prev.filter((name) => name !== exerciseName)
      } else {
        return [...prev, exerciseName]
      }
    })
  }

  // Save workout completion status to database
  const saveWorkoutProgress = async () => {
    if (!workout) return

    setIsSaving(true)
    setSaveSuccess(false)
    setRedirectToast(false)

    try {
      console.log("Saving progress:", completedExercises)

      // For now, just save which exercises are completed
      const { data, error } = await supabase
        .from("workouts")
        .update({
          completed_exercises: completedExercises,
        })
        .eq("id", workout.id)
        .select()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Update response:", data)

      // Update the local workout state to reflect changes
      setWorkout({
        ...workout,
        completed_exercises: completedExercises,
      })

      // Only show the "Progress Saved" message for the save progress action
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving workout progress:", error)
      setError("Failed to save workout progress. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Mark workout as fully completed
  const completeWorkout = async () => {
    if (!workout) return

    setIsSaving(true)
    setSaveSuccess(false) // Make sure this is off
    setRedirectToast(false)

    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from("workouts")
        .update({
          completed: true,
          completed_at: now,
          completed_exercises: completedExercises,
        })
        .eq("id", workout.id)

      if (error) {
        throw error
      }

      // Update the local workout state to reflect changes
      setWorkout({
        ...workout,
        completed: true,
        completed_at: now,
        completed_exercises: completedExercises,
      })

      // Show the redirect toast and redirect to dashboard after a delay
      setRedirectToast(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error completing workout:", error)
      setError("Failed to complete workout. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Format difficulty level for display
  const formatDifficulty = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  }

  // Handle workout deletion
  const handleDeleteWorkout = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/delete-workout?id=${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete workout")
      }

      // Redirect to dashboard after successful deletion
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting workout:", error)
      setError((error as Error).message)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center pt-safe">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading your workout plan...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center pt-safe">
          <div className="max-w-md p-4 text-center">
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
    )
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center pt-safe">
          <div className="max-w-md p-4 text-center">
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
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationHeader />

      <main className="flex-1 py-4 pt-safe">
        <div className="container px-4 mx-auto">
          {/* Mobile-optimized header with trash icon next to title */}
          <div className="mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center text-sm font-medium text-muted-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </button>

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{workout.name}</h1>
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                aria-label="Delete workout"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {/* Workout metadata as badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {workout.duration} min
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-xs">
                <Award className="h-3 w-3 mr-1" />
                {formatDifficulty(workout.difficulty)}
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(workout.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Description card */}
          <div className="mb-4 p-3 bg-secondary/10 rounded-lg">
            <p className="text-sm">{workout.description}</p>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card p-4 rounded-lg shadow-lg w-full max-w-xs">
                <h3 className="text-lg font-bold mb-2">Delete Workout</h3>
                <p className="mb-4 text-sm">
                  Are you sure you want to delete this workout? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteWorkout}
                    className="px-3 py-1.5 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold mb-3">Exercise Plan</h2>
            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => (
                <div
                  key={`${exercise.name}-${index}`}
                  className={`p-3 border rounded-lg transition-colors ${
                    completedExercises.includes(exercise.name) ? "bg-primary/10 border-primary/30" : "bg-card"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-base">{exercise.name}</h3>
                        {completedExercises.includes(exercise.name) && <Check className="ml-1 h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">{exercise.description}</p>

                      <div className="flex flex-wrap mt-2 gap-y-1 gap-x-3">
                        {exercise.sets && (
                          <div className="text-xs">
                            <span className="font-medium">Sets:</span> {exercise.sets}
                          </div>
                        )}
                        {exercise.reps && (
                          <div className="text-xs">
                            <span className="font-medium">Reps:</span> {exercise.reps}
                          </div>
                        )}
                        {exercise.duration && (
                          <div className="text-xs">
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
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="mb-3 text-sm">
                <span className="font-medium">{completedExercises.length}</span> of{" "}
                <span className="font-medium">{workout.exercises.length}</span> exercises completed
              </div>

              {workout.completed ? (
                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                  <h3 className="font-bold text-base">Workout Complete! 🎉</h3>
                  <p className="text-sm">Great job finishing your workout!</p>
                </div>
              ) : completedExercises.length === workout.exercises.length ? (
                <button
                  onClick={completeWorkout}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? "Completing..." : "Complete Workout 🎉"}
                </button>
              ) : (
                <button
                  onClick={saveWorkoutProgress}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Progress"}
                </button>
              )}
              {saveSuccess && (
                <div className="mt-3 p-3 bg-primary/10 text-primary rounded-lg">
                  <h3 className="font-bold text-base">Progress Saved! 🎉</h3>
                  <p className="text-sm">Your workout progress has been saved.</p>
                </div>
              )}
              {redirectToast && (
                <div className="mt-3 p-3 bg-green-100 text-green-600 rounded-lg">
                  <h3 className="font-bold text-base">Workout Completed! 🎉</h3>
                  <p className="text-sm">Redirecting to dashboard...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


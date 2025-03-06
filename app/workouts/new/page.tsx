"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import NavigationHeader from "@/components/NavigationHeader";

export default function NewWorkoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [workoutPreferences, setWorkoutPreferences] = useState({
    goals: "",
    duration: "30", // Default 30 minutes
    difficulty: "moderate", // Default moderate
    equipment: "minimal", // Default minimal equipment
    focusAreas: [] as string[]
  });
  const [error, setError] = useState("");
  
  // Fetch user profile on page load
  useEffect(() => {
    async function loadUserProfile() {
      setLoading(true);
      
      // Check if the user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Get the user's profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load your profile information. Please try again.");
      } else if (profile) {
        setProfile(profile);
        // Pre-fill workout goals from profile if available
        if (profile.fitness_goals) {
          setWorkoutPreferences(prev => ({
            ...prev,
            goals: profile.fitness_goals
          }));
        }
      }
      
      setLoading(false);
    }
    
    loadUserProfile();
  }, [router, supabase]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWorkoutPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox changes for focus areas
  const handleFocusAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setWorkoutPreferences(prev => {
      if (checked) {
        return {
          ...prev,
          focusAreas: [...prev.focusAreas, value]
        };
      } else {
        return {
          ...prev,
          focusAreas: prev.focusAreas.filter(area => area !== value)
        };
      }
    });
  };
  
  // Generate the workout using profile context and preferences
  const handleGenerateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Prepare profile context and preferences for the API
      const workoutRequest = {
        user_id: user.id,
        profile_context: {
          fitness_level: profile?.fitness_level || "beginner",
          height: profile?.height || null,
          weight: profile?.weight || null,
          fitness_goals: profile?.fitness_goals || ""
        },
        preferences: {
          ...workoutPreferences,
          duration: parseInt(workoutPreferences.duration)
        }
      };
      
      // Call the API to generate a workout
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutRequest),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate workout");
      }
      
      const workoutData = await response.json();
      
      // Store the generated workout in the database
      const { data: workout, error: saveError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          name: workoutData.name,
          description: workoutData.description,
          exercises: workoutData.exercises,
          duration: workoutPreferences.duration,
          difficulty: workoutPreferences.difficulty,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (saveError) {
        throw saveError;
      }
      
      // Navigate to the new workout
      router.push(`/workouts/${workout.id}`);
    } catch (err: any) {
      console.error("Error generating workout:", err);
      setError("Failed to generate your workout. Please try again.");
    } finally {
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationHeader />
      
      <main className="flex-1 py-10">
        <div className="container max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Workout Plan</h1>
            <p className="text-muted-foreground">
              We'll use your profile information and preferences to generate a personalized workout plan.
            </p>
            
            {profile && (
              <div className="mt-4 p-4 bg-primary/10 rounded-md">
                <h2 className="font-semibold mb-2">Using your profile information:</h2>
                <ul className="space-y-1 text-sm">
                  <li>• Fitness level: <span className="font-medium">{profile.fitness_level || "Not specified"}</span></li>
                  {profile.height && <li>• Height: <span className="font-medium">{profile.height} inches</span></li>}
                  {profile.weight && <li>• Weight: <span className="font-medium">{profile.weight} lbs</span></li>}
                </ul>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleGenerateWorkout} className="space-y-6">
            <div>
              <label htmlFor="goals" className="block text-sm font-medium mb-1">
                Your Workout Goals
              </label>
              <textarea
                id="goals"
                name="goals"
                value={workoutPreferences.goals}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-md border p-2"
                placeholder="What do you want to achieve with this workout? (e.g., 'Build upper body strength', 'Improve endurance')"
              />
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-1">
                Workout Duration (minutes)
              </label>
              <select
                id="duration"
                name="duration"
                value={workoutPreferences.duration}
                onChange={handleInputChange}
                className="w-full rounded-md border p-2"
              >
                <option value="15">15 minutes (Quick)</option>
                <option value="30">30 minutes (Standard)</option>
                <option value="45">45 minutes (Extended)</option>
                <option value="60">60 minutes (Full)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
                Preferred Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={workoutPreferences.difficulty}
                onChange={handleInputChange}
                className="w-full rounded-md border p-2"
              >
                <option value="easy">Easy - For beginners or recovery days</option>
                <option value="moderate">Moderate - Challenging but manageable</option>
                <option value="hard">Hard - For experienced fitness enthusiasts</option>
                <option value="intense">Intense - Maximum effort required</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="equipment" className="block text-sm font-medium mb-1">
                Available Equipment
              </label>
              <select
                id="equipment"
                name="equipment"
                value={workoutPreferences.equipment}
                onChange={handleInputChange}
                className="w-full rounded-md border p-2"
              >
                <option value="none">No equipment (Bodyweight only)</option>
                <option value="minimal">Minimal (Resistance bands, light dumbbells)</option>
                <option value="standard">Standard (Dumbbells, kettlebells, bench)</option>
                <option value="full">Full gym access</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Focus Areas (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Upper Body', 'Lower Body', 'Core', 'Cardio', 'Flexibility', 'Balance', 'Full Body', 'Strength'].map((area) => (
                  <label key={area} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={area}
                      checked={workoutPreferences.focusAreas.includes(area)}
                      onChange={handleFocusAreaChange}
                      className="rounded border-gray-300"
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4 pt-2">
              <button
                type="submit"
                disabled={generating}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Generating...
                  </span>
                ) : (
                  "Generate Workout Plan"
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

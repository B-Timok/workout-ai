"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import NavigationHeader from "@/components/navigation-header";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";

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
        
        // Pre-fill workout duration from profile if available
        if (profile.workout_duration) {
          setWorkoutPreferences(prev => ({
            ...prev,
            duration: profile.workout_duration.toString()
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
  
  // Handle select changes
  const handleSelectChange = (value: string, name: string) => {
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
          age: profile?.age || null,
          gender: profile?.gender || "not_specified",
          height: profile?.height || null,
          weight: profile?.weight || null,
          fitness_goals: profile?.fitness_goals || "",
          workout_duration: profile?.workout_duration || 30,
          exercises_per_workout: profile?.exercises_per_workout || 5,
          workout_location: profile?.workout_location || "home",
          available_equipment: profile?.available_equipment || [],
          health_limitations: profile?.health_limitations || ""
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
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
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
        <div className="container max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Workout Plan</h1>
            <p className="text-muted-foreground">
              We'll use your profile information and preferences to generate a personalized workout plan.
            </p>
            
            {profile && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Using your profile information</CardTitle>
                  <CardDescription>
                    Your workout will be customized using your saved profile data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Personal Details:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Fitness level: <span className="font-medium">{profile.fitness_level || "Not specified"}</span></li>
                        {profile.age && <li>• Age: <span className="font-medium">{profile.age} years</span></li>}
                        {profile.gender && profile.gender !== "not_specified" && <li>• Gender: <span className="font-medium">{profile.gender}</span></li>}
                        {profile.height && <li>• Height: <span className="font-medium">{profile.height} inches</span></li>}
                        {profile.weight && <li>• Weight: <span className="font-medium">{profile.weight} lbs</span></li>}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">Workout Settings:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Location: <span className="font-medium">{profile.workout_location || "Home"}</span></li>
                        <li>• Duration: <span className="font-medium">{profile.workout_duration || 30} minutes</span></li>
                        <li>• Exercises per workout: <span className="font-medium">{profile.exercises_per_workout || 5}</span></li>
                        {profile.available_equipment && profile.available_equipment.length > 0 && (
                          <li>• Equipment: <span className="font-medium">{profile.available_equipment.join(", ")}</span></li>
                        )}
                        {profile.health_limitations && (
                          <li>• Health limitations: <span className="font-medium">Yes (considered in workout)</span></li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>You can update these details in your <Link href="/profile" className="text-primary underline">profile settings</Link>.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleGenerateWorkout} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goals">Specific Goals for This Workout</Label>
              <Textarea
                id="goals"
                name="goals"
                value={workoutPreferences.goals}
                onChange={handleInputChange}
                rows={3}
                placeholder="What do you want to achieve with this workout? (e.g., 'Build upper body strength', 'Improve endurance')"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Workout Duration (minutes)</Label>
              <Select
                value={workoutPreferences.duration}
                onValueChange={(value) => handleSelectChange(value, "duration")}
              >
                <SelectTrigger id="duration" className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes (Quick)</SelectItem>
                  <SelectItem value="30">30 minutes (Standard)</SelectItem>
                  <SelectItem value="45">45 minutes (Extended)</SelectItem>
                  <SelectItem value="60">60 minutes (Full)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Preferred Difficulty</Label>
              <Select
                value={workoutPreferences.difficulty}
                onValueChange={(value) => handleSelectChange(value, "difficulty")}
              >
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy - For beginners or recovery days</SelectItem>
                  <SelectItem value="moderate">Moderate - Challenging but manageable</SelectItem>
                  <SelectItem value="hard">Hard - For experienced fitness enthusiasts</SelectItem>
                  <SelectItem value="intense">Intense - Maximum effort required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Focus Areas (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {['Upper Body', 'Lower Body', 'Core', 'Cardio', 'Flexibility', 'Balance', 'Full Body', 'Strength'].map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`focus-${area}`}
                      checked={workoutPreferences.focusAreas.includes(area)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setWorkoutPreferences(prev => ({
                            ...prev,
                            focusAreas: [...prev.focusAreas, area]
                          }));
                        } else {
                          setWorkoutPreferences(prev => ({
                            ...prev,
                            focusAreas: prev.focusAreas.filter(a => a !== area)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`focus-${area}`} className="text-sm cursor-pointer">
                      {area}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={generating}
                className="flex-1"
              >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  "Generate Workout Plan"
                )}
              </Button>
              
              <Button
                type="button"
                onClick={() => router.push("/dashboard")}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

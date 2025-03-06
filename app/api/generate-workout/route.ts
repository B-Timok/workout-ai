import { NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// This function generates a workout plan using OpenAI
export async function POST(request: Request) {
  try {
    // Parse the request body
    const requestData = await request.json();
    const { profile_context, preferences } = requestData;
    
    // Get the user session for authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Ensure the user is only generating a workout for themselves
    if (requestData.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You can only create workouts for your own account" },
        { status: 403 }
      );
    }
    
    // Generate a name for the workout
    let workoutName = "Custom Workout";
    if (preferences.focusAreas && preferences.focusAreas.length > 0) {
      workoutName = `${preferences.focusAreas.join("/")} Workout`;
    } else if (preferences.goals) {
      // Extract a short name from goals
      const goalWords = preferences.goals.split(" ").slice(0, 3).join(" ");
      workoutName = `${goalWords} Workout`;
    }
    
    // Prepare context for the workout generation
    const fitnessLevel = profile_context.fitness_level || "beginner";
    const userContext = {
      fitnessLevel,
      height: profile_context.height || "not specified",
      weight: profile_context.weight || "not specified",
      fitnessGoals: profile_context.fitness_goals || "general fitness",
      workoutGoals: preferences.goals || "general fitness improvement",
      duration: preferences.duration || 30,
      difficulty: preferences.difficulty || "moderate",
      equipment: preferences.equipment || "minimal",
      focusAreas: preferences.focusAreas || ["Full Body"]
    };
    
    // Generate the workout plan using OpenAI
    const workout = await generateWorkoutWithOpenAI(userContext);
    
    return NextResponse.json({
      name: workoutName,
      description: workout.description,
      exercises: workout.exercises
    });
    
  } catch (error) {
    console.error("Error generating workout:", error);
    return NextResponse.json(
      { error: "Failed to generate workout" },
      { status: 500 }
    );
  }
}

// Generate a workout plan using OpenAI
async function generateWorkoutWithOpenAI(context: any) {
  // Create a prompt for OpenAI with the user's context
  const prompt = `
    Create a personalized workout plan with the following details:
    
    User Profile:
    - Fitness Level: ${context.fitnessLevel}
    - Height: ${context.height}
    - Weight: ${context.weight}
    - Fitness Goals: ${context.fitnessGoals}
    
    Workout Preferences:
    - Specific Workout Goals: ${context.workoutGoals}
    - Duration: ${context.duration} minutes
    - Difficulty: ${context.difficulty}
    - Available Equipment: ${context.equipment}
    - Focus Areas: ${context.focusAreas.join(", ")}
    
    Please format the response as a JSON object with the following structure:
    {
      "description": "A detailed description of the workout including its benefits and how it relates to the user's goals",
      "exercises": [
        {
          "name": "Exercise Name",
          "description": "Detailed instructions on how to perform the exercise",
          "sets": number (null if not applicable),
          "reps": "rep range as string" (null if not applicable),
          "duration": "duration as string (e.g., '30 seconds')" (null if not applicable)
        },
        // Additional exercises...
      ]
    }
    
    Ensure the workout is appropriate for the user's fitness level and goals. Include warm-up and cool-down exercises for workouts 30 minutes or longer.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional fitness trainer with expertise in creating personalized workout plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const workoutPlan = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      description: workoutPlan.description || "Custom workout plan",
      exercises: workoutPlan.exercises || []
    };
  } catch (error) {
    console.error("Error generating workout with OpenAI:", error);
    
    // Fallback to the default workout generator if OpenAI fails
    return generateFallbackWorkout(context);
  }
}

// Fallback workout generator in case OpenAI fails
function generateFallbackWorkout(context: any) {
  // This is a simplified version of your original workout generator
  const { fitnessLevel, duration, difficulty, focusAreas } = context;
  
  const description = `A ${duration}-minute ${difficulty} workout focusing on ${focusAreas.join(", ")} 
    designed for ${fitnessLevel} fitness level. This workout is tailored to help you achieve your goals: ${context.workoutGoals}.`;
  
  // Create some basic exercises
  const exercises = [
    { 
      name: "Warm-up",
      description: "5 minutes of light cardio and dynamic stretching",
      sets: null,
      reps: null,
      duration: "5 minutes"
    },
    {
      name: "Push-ups",
      description: "Standard push-ups with hands shoulder-width apart",
      sets: 3,
      reps: "10-12",
      duration: null
    },
    {
      name: "Bodyweight Squats",
      description: "Standard squats with feet shoulder-width apart",
      sets: 3,
      reps: "15-20",
      duration: null
    },
    {
      name: "Plank",
      description: "Hold a forearm plank position with core engaged",
      sets: 3,
      reps: null,
      duration: "30 seconds"
    },
    { 
      name: "Cool-down",
      description: "5 minutes of static stretching for all major muscle groups",
      sets: null,
      reps: null,
      duration: "5 minutes"
    }
  ];
  
  return {
    description,
    exercises
  };
}
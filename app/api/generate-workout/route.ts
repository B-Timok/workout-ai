import { NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 second global timeout for all requests
  maxRetries: 3    // Allow up to 3 retries if the request fails
});

// This function generates a workout plan using OpenAI
export async function POST(request: Request) {
  const requestStartTime = Date.now(); // Add this at the start of your function
  
  try {
    // Parse the request body
    const requestData = await request.json();
    const { profile_context, preferences } = requestData;
    
    // Get the user session for authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Modified auth check to avoid redirects in serverless functions
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;
    
    // Better error handling for auth issues
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
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

    const totalRequestTime = (Date.now() - requestStartTime) / 1000; // Convert to seconds
    console.log(`Total API request completed in ${totalRequestTime} seconds`); // Log total time
    
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
      "description": "A concise description of the workout",
      "exercises": [
        {
          "name": "Exercise Name",
          "description": "Simple instructions on how to perform the exercise",
          "sets": number (null if not applicable),
          "reps": "rep range as string" (null if not applicable),
          "duration": "duration as string (e.g., '30 seconds')" (null if not applicable)
        },
        // Additional exercises...
      ]
    }
    
    IMPORTANT: Include no more than 3 exercises total for the entire workout.
    Ensure the workout is appropriate for the user's fitness level and goals. Include warm-up and cool-down exercises as part of the 5-exercise limit.
  `;

  try {
    // First attempt with standard settings
    console.log("Starting OpenAI request with gpt-3.5-turbo...");
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`OpenAI request completed in ${duration} seconds`);
    
    // Parse the JSON response
    const workoutPlan = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Ensure there are no more than 5 exercises
    let exercises = workoutPlan.exercises || [];
    if (exercises.length > 5) {
      exercises = exercises.slice(0, 5);
    }
    
    return {
      description: workoutPlan.description || "Custom workout plan",
      exercises: exercises
    };
  } catch (error) {
    console.error("First attempt failed:", error);
    
    // If first attempt fails, try with simplified prompt
    try {
      console.log("Trying fallback with simplified prompt...");
      
      // Create a simpler prompt
      const simplifiedPrompt = `
        Create a basic ${context.difficulty} workout for ${context.fitnessLevel} focusing on ${context.focusAreas.join(", ")}.
        Duration: ${context.duration} minutes. 
        
        IMPORTANT: Include no more than 5 exercises in total.
        
        Return as JSON with:
        {
          "description": "Brief workout description",
          "exercises": [
            {
              "name": "Exercise name",
              "description": "Brief instruction",
              "sets": number,
              "reps": "rep range"
            }
          ]
        }
      `;
      
      // Try with a simpler model and prompt
      const fallbackCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", 
        messages: [
          { role: "system", content: "You are a fitness trainer. Keep responses brief and practical." },
          { role: "user", content: simplifiedPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000, // Limit token usage for faster response
      });
      
      // Parse the simplified response
      const fallbackPlan = JSON.parse(fallbackCompletion.choices[0].message.content || "{}");
      console.log("Fallback generation successful");
      
      // Ensure there are no more than 5 exercises
      let exercises = fallbackPlan.exercises || [];
      if (exercises.length > 5) {
        exercises = exercises.slice(0, 5);
      }
      
      return {
        description: fallbackPlan.description || "Custom workout plan",
        exercises: exercises
      };
    } catch (fallbackError) {
      console.error("Fallback attempt also failed:", fallbackError);
      // Now use the pre-defined fallback workout
      console.log("Using hardcoded fallback workout");
      return generateFallbackWorkout(context);
    }
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
import { NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";

// This function deletes a workout by ID
export async function DELETE(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const workoutId = url.searchParams.get("id");
    
    if (!workoutId) {
      return NextResponse.json(
        { error: "Workout ID is required" },
        { status: 400 }
      );
    }
    
    // Get the user session for authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // First, verify the workout belongs to the user
    const { data: workout, error: fetchError } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", workoutId)
      .single();
    
    if (fetchError || !workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }
    
    // Ensure the workout belongs to the current user
    if (workout.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this workout" },
        { status: 403 }
      );
    }
    
    // Delete the workout
    const { error: deleteError } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId);
    
    if (deleteError) {
      console.error("Error deleting workout:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete workout" },
        { status: 500 }
      );
    }
    
    // Return success
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error in delete-workout endpoint:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Dumbbell, LineChart, Plus, Target, Trash2, TrendingUp } from "lucide-react"
import Link from "next/link"
import NavigationHeader from "@/components/NavigationHeader";
import { createClient } from "@/lib/utils/supabase/client";

export default function DashboardPage() {
  // State for user data
  const [userData, setUserData] = useState({
    totalWorkouts: 0,
    weeklyWorkouts: 0,
    goalsCompleted: 0,
    goalSuccessRate: 0,
    activeStreak: 0,
    personalBest: 0,
    progressPercent: 0
  });
  const [userName, setUserName] = useState("User");
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Current date info for monthly calculations
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();

  // Fetch data when component mounts
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const supabase = createClient();
    
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
    
        if (!user) return;
    
        // 1. Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
    
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData?.full_name) {
          setUserName(profileData.full_name.split(' ')[0]);
        }
    
        // 2. Fetch COMPLETED workouts only
        const { data: completedWorkoutsData, error: workoutsError } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true) // Only get completed workouts
          .order('completed_at', { ascending: false });
    
        if (workoutsError) {
          console.error("Error fetching workouts:", workoutsError);
          return;
        }
    
        // Log for debugging
        console.log("Completed workouts:", completedWorkoutsData);
        
        // Get recent workouts for display (include both completed and in-progress)
        const { data: recentWorkoutsData } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setWorkouts(recentWorkoutsData || []);
        
        // 3. Fetch user_stats if available (or create default values)
        let userStats = {
          current_streak: 0,
          longest_streak: 0,
          monthly_goals_total: 0,
          monthly_goals_completed: 0
        };
        
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (!statsError && statsData) {
          userStats = statsData;
        }
        
        // 4. Fetch goals for the current month
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_date', firstDayOfMonth)
          .lte('end_date', lastDayOfMonth);
          
        if (goalsError) {
          console.error("Error fetching goals:", goalsError);
        }
        
        // Calculate monthly goal statistics
        const monthlyGoals = goalsData || [];
        const monthlyGoalsTotal = monthlyGoals.length;
        const monthlyGoalsCompleted = monthlyGoals.filter(goal => goal.completed).length;
        
        // Calculate completed workouts this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyWorkouts = completedWorkoutsData
          ? completedWorkoutsData.filter(w => new Date(w.completed_at) >= oneWeekAgo).length
          : 0;
          
        // Calculate active streak if not available from user_stats
        let activeStreak = userStats.current_streak;
        let personalBest = userStats.longest_streak;
        
        // If we don't have pre-calculated stats, calculate them on the fly
        if (activeStreak === 0 && completedWorkoutsData && completedWorkoutsData.length > 0) {
          let tempStreak = 0;
          let tempPersonalBest = 0;
          let lastWorkoutDate: Date | null = null;
          
          // Group workouts by date (to handle multiple workouts per day)
          const workoutsByDate = new Map<string, boolean>();
          completedWorkoutsData.forEach(workout => {
            if (workout.completed_at) {
              const dateKey = new Date(workout.completed_at).toISOString().split('T')[0];
              workoutsByDate.set(dateKey, true);
            }
          });
          
          // Convert to array of dates and sort
          const workoutDates = Array.from(workoutsByDate.keys())
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => b.getTime() - a.getTime()); // Sort descending
            
          if (workoutDates.length > 0) {
            tempStreak = 1; // Start with 1 for the most recent workout
            lastWorkoutDate = workoutDates[0];
            
            // Check if most recent workout is today or yesterday
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const mostRecentDate = new Date(lastWorkoutDate);
            mostRecentDate.setHours(0, 0, 0, 0);
            
            if (mostRecentDate.getTime() !== today.getTime() && 
                mostRecentDate.getTime() !== yesterday.getTime()) {
              // Streak is broken if most recent workout isn't today or yesterday
              tempStreak = 0;
            } else {
              // Calculate streak
              for (let i = 1; i < workoutDates.length; i++) {
                const currentDate = new Date(workoutDates[i]);
                currentDate.setHours(0, 0, 0, 0);
                
                const previousDate = new Date(workoutDates[i-1]);
                previousDate.setHours(0, 0, 0, 0);
                
                // Calculate difference in days
                const diffTime = previousDate.getTime() - currentDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                  // Consecutive day
                  tempStreak++;
                } else {
                  break; // Streak is broken
                }
              }
            }
            
            tempPersonalBest = Math.max(tempStreak, tempPersonalBest);
          }
          
          activeStreak = tempStreak;
          personalBest = tempPersonalBest;
        }
        
        // Set all the calculated data
        setUserData({
          totalWorkouts: completedWorkoutsData?.length || 0,
          weeklyWorkouts,
          goalsCompleted: monthlyGoalsCompleted,
          goalSuccessRate: monthlyGoalsTotal > 0 ? Math.round((monthlyGoalsCompleted / monthlyGoalsTotal) * 100) : 0,
          activeStreak,
          personalBest,
          progressPercent: monthlyGoalsTotal > 0 ? Math.round((monthlyGoalsCompleted / monthlyGoalsTotal) * 100) : 0
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [firstDayOfMonth, lastDayOfMonth]);

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format date with time helper
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric'
    }) + ' @ ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <NavigationHeader />
      <div className="flex flex-col gap-6 p-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}</h1>
          <p className="text-muted-foreground">Track your progress and create new workout routines</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Total Workouts</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted/50 rounded animate-pulse mt-2"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold mt-2">{userData.totalWorkouts}</p>
                  <p className="text-xs text-muted-foreground mt-1">+{userData.weeklyWorkouts} this week</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Goals Met</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted/50 rounded animate-pulse mt-2"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold mt-2">{userData.goalsCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-1">{userData.goalSuccessRate}% success rate</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Active Streak</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted/50 rounded animate-pulse mt-2"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold mt-2">{userData.activeStreak} days</p>
                  <p className="text-xs text-muted-foreground mt-1">Personal best: {userData.personalBest} days</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Progress</p>
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted/50 rounded animate-pulse mt-2"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold mt-2">{userData.progressPercent}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Monthly goal</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create New Workout Card */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle>Create New Workout</CardTitle>
              <CardDescription>Generate a customized workout plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="gap-2" asChild>
                <Link href="/workouts/new">
                  <Plus className="h-4 w-4" />
                  Get Started
                </Link>
              </Button>
              {/* Decorative background pattern */}
              <div className="absolute right-0 top-0 -z-10 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your latest training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 animate-pulse">
                      <div className="w-3/4 h-10 bg-muted/80 rounded"></div>
                      <div className="w-1/5 h-8 bg-muted/80 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : workouts.length > 0 ? (
                <div className="space-y-4">
                  {workouts.map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Dumbbell className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{workout.name || "Workout Plan"}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            <span>{formatDateTime(workout.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/workouts/${workout.id}`}>View Details</Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  You haven't created any workouts yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Weekly Schedule */}
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Your upcoming workouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card">
                {/* Add a calendar or schedule component here */}
                <div className="p-4 text-center text-muted-foreground">No upcoming workouts scheduled</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href="/workouts/new">
                  <Plus className="h-4 w-4" />
                  New Workout Plan
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Target className="h-4 w-4" />
                Set New Goal
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <LineChart className="h-4 w-4" />
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

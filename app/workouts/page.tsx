"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import NavigationHeader from "@/components/navigation-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  StarOff,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Mock data for demonstration
const mockWorkouts = [
  {
    id: "1",
    name: "Upper Body Strength",
    description: "Focus on chest, shoulders, and triceps with compound movements",
    type: "strength",
    difficulty: "intermediate",
    duration: 45,
    created_at: "2025-03-01T10:00:00Z",
    completed: true,
    completed_at: "2025-03-01T11:00:00Z",
    favorite: true,
  },
  {
    id: "2",
    name: "HIIT Cardio Blast",
    description: "High-intensity interval training to maximize calorie burn",
    type: "cardio",
    difficulty: "advanced",
    duration: 30,
    created_at: "2025-03-03T15:30:00Z",
    completed: true,
    completed_at: "2025-03-03T16:00:00Z",
    favorite: false,
  },
  {
    id: "3",
    name: "Lower Body Focus",
    description: "Squats, lunges, and deadlifts for leg strength and stability",
    type: "strength",
    difficulty: "intermediate",
    duration: 50,
    created_at: "2025-03-05T08:15:00Z",
    completed: false,
    completed_at: null,
    favorite: true,
  },
  {
    id: "4",
    name: "Core Stability",
    description: "Strengthen your core with planks, crunches, and rotational movements",
    type: "strength",
    difficulty: "beginner",
    duration: 25,
    created_at: "2025-03-07T17:00:00Z",
    completed: false,
    completed_at: null,
    favorite: false,
  },
  {
    id: "5",
    name: "Full Body Circuit",
    description: "Complete body workout combining strength and cardio elements",
    type: "circuit",
    difficulty: "intermediate",
    duration: 60,
    created_at: "2025-03-09T14:00:00Z",
    completed: true,
    completed_at: "2025-03-09T15:00:00Z",
    favorite: true,
  },
  {
    id: "6",
    name: "Mobility & Flexibility",
    description: "Improve range of motion and prevent injuries with dynamic stretches",
    type: "flexibility",
    difficulty: "beginner",
    duration: 35,
    created_at: "2025-03-11T07:30:00Z",
    completed: true,
    completed_at: "2025-03-11T08:05:00Z",
    favorite: false,
  },
  {
    id: "7",
    name: "Endurance Run",
    description: "Build cardiovascular endurance with steady-state running",
    type: "cardio",
    difficulty: "intermediate",
    duration: 40,
    created_at: "2025-03-13T16:45:00Z",
    completed: false,
    completed_at: null,
    favorite: false,
  },
  {
    id: "8",
    name: "Power Yoga Flow",
    description: "Combine strength and flexibility with dynamic yoga sequences",
    type: "flexibility",
    difficulty: "intermediate",
    duration: 55,
    created_at: "2025-03-15T09:00:00Z",
    completed: true,
    completed_at: "2025-03-15T09:55:00Z",
    favorite: true,
  },
]

// Types
type Workout = (typeof mockWorkouts)[0]
type WorkoutType = "all" | "strength" | "cardio" | "circuit" | "flexibility"
type DifficultyLevel = "all" | "beginner" | "intermediate" | "advanced"
type SortOption = "newest" | "oldest" | "duration-asc" | "duration-desc" | "alphabetical"

export default function WorkoutsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"history" | "saved">("history")
  const [searchQuery, setSearchQuery] = useState("")
  const [workoutType, setWorkoutType] = useState<WorkoutType>("all")
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>("all")
  const [sortOption, setSortOption] = useState<SortOption>("newest")
  const [isLoading, setIsLoading] = useState(false)

  // Filter workouts based on current filters
  const filteredWorkouts = mockWorkouts
    .filter((workout) => {
      // Filter by search query
      if (
        searchQuery &&
        !workout.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !workout.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Filter by workout type
      if (workoutType !== "all" && workout.type !== workoutType) {
        return false
      }

      // Filter by difficulty level
      if (difficultyLevel !== "all" && workout.difficulty !== difficultyLevel) {
        return false
      }

      // Filter by tab (history shows all, saved shows only favorites)
      if (activeTab === "saved" && !workout.favorite) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Sort based on selected option
      switch (sortOption) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "duration-asc":
          return a.duration - b.duration
        case "duration-desc":
          return b.duration - a.duration
        case "alphabetical":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const handleCreateWorkout = () => {
    // In a real app, this would navigate to a workout creation page
    router.push("/workouts/create")
  }

  const toggleFavorite = (id: string) => {
    // In a real app, this would update the database
    console.log(`Toggle favorite for workout ${id}`)
  }

  const deleteWorkout = (id: string) => {
    // In a real app, this would delete from the database
    console.log(`Delete workout ${id}`)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setWorkoutType("all")
    setDifficultyLevel("all")
    setSortOption("newest")
  }

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      case "intermediate":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      case "advanced":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    }
  }

  // Get workout type badge color
  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case "strength":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
      case "cardio":
        return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
      case "circuit":
        return "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20"
      case "flexibility":
        return "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationHeader />

      <main className="flex-1 container max-w-7xl py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Workouts</h1>
            <p className="text-muted-foreground mt-1">View your workout history and saved plans</p>
          </div>
          <Button onClick={handleCreateWorkout} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Workout
          </Button>
        </div>

        <Tabs
          defaultValue="history"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "history" | "saved")}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Workout History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Saved Plans</span>
                <span className="sm:hidden">Saved</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search workouts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="p-2 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Workout Type</label>
                      <Select value={workoutType} onValueChange={(value) => setWorkoutType(value as WorkoutType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="cardio">Cardio</SelectItem>
                          <SelectItem value="circuit">Circuit</SelectItem>
                          <SelectItem value="flexibility">Flexibility</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium">Difficulty</label>
                      <Select
                        value={difficultyLevel}
                        onValueChange={(value) => setDifficultyLevel(value as DifficultyLevel)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium">Sort By</label>
                      <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="duration-asc">Duration (Shortest)</SelectItem>
                          <SelectItem value="duration-desc">Duration (Longest)</SelectItem>
                          <SelectItem value="alphabetical">Alphabetical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="history" className="m-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredWorkouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteWorkout}
                    formatDate={formatDate}
                    getDifficultyColor={getDifficultyColor}
                    getWorkoutTypeColor={getWorkoutTypeColor}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Dumbbell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No workouts found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery || workoutType !== "all" || difficultyLevel !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "You haven't created any workouts yet. Create your first workout to get started."}
                </p>
                {searchQuery || workoutType !== "all" || difficultyLevel !== "all" ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={handleCreateWorkout}>Create Workout</Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="m-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredWorkouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteWorkout}
                    formatDate={formatDate}
                    getDifficultyColor={getDifficultyColor}
                    getWorkoutTypeColor={getWorkoutTypeColor}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No saved workouts</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery || workoutType !== "all" || difficultyLevel !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "You haven't saved any workouts yet. Star a workout to save it for later."}
                </p>
                {searchQuery || workoutType !== "all" || difficultyLevel !== "all" ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => setActiveTab("history")}>Browse Workouts</Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Workout Card Component
function WorkoutCard({
  workout,
  onToggleFavorite,
  onDelete,
  formatDate,
  getDifficultyColor,
  getWorkoutTypeColor,
}: {
  workout: Workout
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
  formatDate: (date: string) => string
  getDifficultyColor: (difficulty: string) => string
  getWorkoutTypeColor: (type: string) => string
}) {
  return (
    <Card className="overflow-hidden group">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{workout.name}</h3>
            <div className="flex items-center">
              <button
                onClick={() => onToggleFavorite(workout.id)}
                className="text-yellow-400 hover:text-yellow-500 transition-colors"
                aria-label={workout.favorite ? "Remove from favorites" : "Add to favorites"}
              >
                {workout.favorite ? <Star className="h-5 w-5 fill-current" /> : <StarOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{workout.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={getWorkoutTypeColor(workout.type)}>
              {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
            </Badge>
            <Badge variant="outline" className={getDifficultyColor(workout.difficulty)}>
              {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">
              <Clock className="h-3 w-3 mr-1" />
              {workout.duration} min
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(workout.created_at)}
            </div>

            <div className="flex items-center gap-2">
              {workout.completed && (
                <div
                  className="text-green-500 flex items-center"
                  title={`Completed on ${workout.completed_at ? formatDate(workout.completed_at) : "unknown date"}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/workouts/${workout.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleFavorite(workout.id)} className="flex items-center">
                    {workout.favorite ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Remove from Saved
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Save Workout
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(workout.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


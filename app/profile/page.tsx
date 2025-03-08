"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AvatarSelector from "@/components/avatar-selector"
import { getAvatarEmoji } from "@/lib/utils/avatar"
import NavigationHeader from "@/components/navigation-header"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const [fitnessLevel, setFitnessLevel] = useState("not_specified")
  
  // Personal details
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("not_specified")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  
  // Workout preferences
  const [fitnessGoals, setFitnessGoals] = useState("")
  const [workoutDuration, setWorkoutDuration] = useState("30")
  const [exercisesPerWorkout, setExercisesPerWorkout] = useState("5")
  const [workoutLocation, setWorkoutLocation] = useState("home")
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([])
  const [healthLimitations, setHealthLimitations] = useState("")

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = "/login"
          return
        }

        setUser(user)

        // Get profile data
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setProfile(data)
          setUsername(data.username || "")
          setFullName(data.full_name || "")
          setFitnessLevel(data.fitness_level || "not_specified")
          setAge(data.age?.toString() || "")
          setGender(data.gender || "not_specified")
          setHeight(data.height?.toString() || "")
          setWeight(data.weight?.toString() || "")
          setFitnessGoals(data.fitness_goals || "")
          setWorkoutDuration(data.workout_duration?.toString() || "30")
          setExercisesPerWorkout(data.exercises_per_workout?.toString() || "5")
          setWorkoutLocation(data.workout_location || "home")
          setAvailableEquipment(data.available_equipment || [])
          setHealthLimitations(data.health_limitations || "")
        } else {
          // Create a profile if it doesn't exist
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                username: user.email?.split("@")[0] || "",
                avatar_id: "dumbbell", // Default avatar
              },
            ])
            .select()
            .single()

          if (insertError) throw insertError

          if (newProfile) {
            setProfile(newProfile)
            setUsername(newProfile.username || "")
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [supabase])

  const updateProfile = async () => {
    try {
      setSaving(true)

      if (!user) return

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          full_name: fullName,
          updated_at: new Date().toISOString(),
          fitness_level: fitnessLevel,
          age: age ? parseInt(age) : null,
          gender,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          fitness_goals: fitnessGoals,
          workout_duration: workoutDuration ? parseInt(workoutDuration) : 30,
          exercises_per_workout: exercisesPerWorkout ? parseInt(exercisesPerWorkout) : 5,
          workout_location: workoutLocation,
          available_equipment: availableEquipment,
          health_limitations: healthLimitations,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarSelect = (avatarId: string) => {
    setProfile({ ...profile, avatar_id: avatarId })
  }

  const toggleEquipment = (equipment: string) => {
    if (availableEquipment.includes(equipment)) {
      setAvailableEquipment(availableEquipment.filter((item) => item !== equipment))
    } else {
      setAvailableEquipment([...availableEquipment, equipment])
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <NavigationHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavigationHeader />
      <main className="flex-1 container max-w-4xl py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        <Tabs defaultValue="info">
          <TabsList className="mb-6">
            <TabsTrigger value="info">Profile Info</TabsTrigger>
            <TabsTrigger value="workout">Workout Preferences</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Your email cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Username cannot be changed once set.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="99"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Enter your age"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified">Prefer not to say</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non_binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (inches)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="36"
                      max="96"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Enter your height"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="50"
                      max="500"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Enter your weight"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fitness Level</Label>
                  <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your fitness level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_specified">Not specified</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={updateProfile} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workout">
            <Card>
              <CardHeader>
                <CardTitle>Workout Preferences</CardTitle>
                <CardDescription>Customize your workout generation settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fitnessGoals">Fitness Goals</Label>
                  <Textarea
                    id="fitnessGoals"
                    value={fitnessGoals}
                    onChange={(e) => setFitnessGoals(e.target.value)}
                    placeholder="Describe your fitness goals (e.g. lose weight, build muscle, improve endurance)"
                    className="min-h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workoutDuration">Preferred Workout Duration (minutes)</Label>
                    <Input
                      id="workoutDuration"
                      type="number"
                      min="10"
                      max="120"
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exercisesPerWorkout">Exercises Per Workout</Label>
                    <Input
                      id="exercisesPerWorkout"
                      type="number"
                      min="3"
                      max="15"
                      value={exercisesPerWorkout}
                      onChange={(e) => setExercisesPerWorkout(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workoutLocation">Workout Location</Label>
                  <Select value={workoutLocation} onValueChange={setWorkoutLocation}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select workout location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="gym">Gym</SelectItem>
                      <SelectItem value="outdoors">Outdoors</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Available Equipment</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["Dumbbells", "Barbell", "Kettlebell", "Resistance Bands", "Pull-up Bar", "Bench", 
                      "Treadmill", "Exercise Bike", "Rowing Machine", "Medicine Ball", "Yoga Mat", "None"].map((equipment) => (
                      <div key={equipment} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`equipment-${equipment}`} 
                          checked={availableEquipment.includes(equipment)}
                          onCheckedChange={() => toggleEquipment(equipment)}
                        />
                        <Label 
                          htmlFor={`equipment-${equipment}`}
                          className="text-sm cursor-pointer"
                        >
                          {equipment}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="healthLimitations">Health Limitations or Injuries</Label>
                  <Textarea
                    id="healthLimitations"
                    value={healthLimitations}
                    onChange={(e) => setHealthLimitations(e.target.value)}
                    placeholder="Describe any health limitations or injuries we should consider when generating workouts"
                  />
                </div>

                <Button onClick={updateProfile} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Workout Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avatar">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Avatar</CardTitle>
                <CardDescription>Select an avatar to represent you.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center text-5xl mb-4">
                    {getAvatarEmoji(profile?.avatar_id)}
                  </div>
                  <p className="text-sm text-muted-foreground">Your current avatar</p>
                </div>

                <AvatarSelector userId={user.id} currentAvatar={profile?.avatar_id} onSelect={handleAvatarSelect} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

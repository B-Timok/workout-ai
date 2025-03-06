"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
import NavigationHeader from "@/components/NavigationHeader";
import Link from "next/link";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [fitnessGoals, setFitnessGoals] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get user profile data
    async function getProfile() {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      // Get the profile data
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (data) {
        setUsername(data.username || "");
        setFullName(data.full_name || "");
        setFitnessLevel(data.fitness_level || "");
        setFitnessGoals(data.fitness_goals || "");
        setHeight(data.height?.toString() || "");
        setWeight(data.weight?.toString() || "");
      }
      
      setLoading(false);
    }
    
    getProfile();
  }, [router, supabase]);

  async function updateProfile(e: { preventDefault: () => void; }) {
    e.preventDefault();
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return;
    }
    
    const updates = {
      id: user.id,
      username,
      full_name: fullName,
      fitness_level: fitnessLevel,
      fitness_goals: fitnessGoals,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      updated_at: new Date(),
    };
    
    const { error } = await supabase
    .from("profiles")
    .upsert(updates);
    
    if (error) {
      alert(`Error updating profile: ${error.message}`);
    } else {
      alert("Profile updated successfully!");
    }
    
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationHeader />
      
      <main className="flex-1">
        <div className="container py-8 max-w-md mx-auto">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="mr-4 p-2 rounded-full hover:bg-black"
              aria-label="Back to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-2xl font-bold">Your Profile</h1>
          </div>
          
          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </div>
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </div>
            
            <div>
              <label htmlFor="fitnessLevel" className="block text-sm font-medium">
                Fitness Level
              </label>
              <select
                id="fitnessLevel"
                value={fitnessLevel}
                onChange={(e) => setFitnessLevel(e.target.value)}
                className="mt-1 block w-full rounded-md border p-2"
              >
                <option value="">Select your fitness level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="fitnessGoals" className="block text-sm font-medium">
                Fitness Goals
              </label>
              <textarea
                id="fitnessGoals"
                value={fitnessGoals}
                onChange={(e) => setFitnessGoals(e.target.value)}
                className="mt-1 block w-full rounded-md border p-2"
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="height" className="block text-sm font-medium">
                Height (inches)
              </label>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium">
                Weight (lbs)
              </label>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-primary text-white rounded-md disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
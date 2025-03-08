"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { debounce } from "lodash";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"checking" | "available" | "taken" | "invalid" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Create a debounced function to check username availability
  const checkUsernameAvailability = debounce(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus("invalid");
      return;
    }

    // Username format validation - alphanumeric and underscores only
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");

    try {
      // Use the RPC function that bypasses RLS
      const { data, error } = await supabase.rpc(
        'check_username_exists', 
        { username_to_check: username }
      );
      
      console.log("Username exists check result:", data);

      if (error) {
        console.error("Error checking username:", error);
        
        // Fallback to original method if RPC fails (function might not exist yet)
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("username");
        
        if (profilesError) {
          console.error("Fallback also failed:", profilesError);
          setUsernameStatus(null);
          return;
        }
        
        // Manual case-insensitive check
        const taken = profilesData && profilesData.some(profile => 
          profile.username && 
          profile.username.toLowerCase() === username.toLowerCase()
        );
        
        console.log(`Username "${username}" taken (fallback method):`, taken);
        setUsernameStatus(taken ? "taken" : "available");
        return;
      }
      
      // data will be a boolean indicating if username exists
      setUsernameStatus(data === true ? "taken" : "available");
    } catch (err) {
      console.error("Error in username availability check:", err);
      setUsernameStatus(null);
    }
  }, 500);

  useEffect(() => {
    if (username) {
      checkUsernameAvailability(username);
    } else {
      setUsernameStatus(null);
    }

    // Cleanup function to cancel any pending debounced calls
    return () => {
      checkUsernameAvailability.cancel();
    };
  }, [username]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username first
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    // Double-check username availability before proceeding
    const { data: existingUsers, error: existingUsersError } = await supabase
      .from("profiles")
      .select("username");
      
    if (existingUsersError) {
      console.error("Error checking existing usernames:", existingUsersError);
      setError("Error checking username availability. Please try again.");
      return;
    }
    
    const usernameTaken = existingUsers && existingUsers.some(
      profile => profile.username && profile.username.toLowerCase() === username.toLowerCase()
    );
    
    if (usernameTaken) {
      setError("This username is already taken. Please choose another one.");
      return;
    }

    if (usernameStatus !== "available") {
      setError("Please choose an available username");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: username, // Store username in auth metadata
          }
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const user = authData.user;
      
      if (!user) {
        throw new Error("User creation failed");
      }

      // Now update the profile with the username
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username: username })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile with username:", profileError);
        // We'll continue anyway as the auth account was created
      }

      // Display success message for email confirmation
      setError("Success! Check your email for confirmation link.");
      
      // Reset form
      setUsername("");
      setEmail("");
      setPassword("");
      
    } catch (error) {
      console.error("Error signing up:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available":
        return <Check className="h-4 w-4 text-green-500" />;
      case "taken":
        return <X className="h-4 w-4 text-red-500" />;
      case "invalid":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case "checking":
        return "Checking availability...";
      case "available":
        return "Username is available";
      case "taken":
        return "Username is already taken";
      case "invalid":
        return "Username must be at least 3 characters and can only contain letters, numbers, and underscores";
      default:
        return "";
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-6">
      {error && (
        <div className={`p-3 ${error.includes("Success") ? "bg-green-100 border-green-400 text-green-700" : "bg-red-100 border-red-400 text-red-700"} border rounded`}>
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium">
          Username
        </label>
        <div className="relative mt-1">
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none pr-10 
              ${usernameStatus === "available" ? "border-green-500 focus:border-green-500" : 
                usernameStatus === "taken" || usernameStatus === "invalid" ? "border-red-500 focus:border-red-500" : 
                "border-gray-300 focus:border-primary"}`}
            placeholder="Choose a username"
            minLength={3}
            maxLength={30}
          />
          {username && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {getUsernameStatusIcon()}
            </div>
          )}
        </div>
        {username && (
          <p className={`mt-1 text-xs ${
            usernameStatus === "available" ? "text-green-600" : 
            usernameStatus === "taken" || usernameStatus === "invalid" ? "text-red-600" : 
            "text-muted-foreground"
          }`}>
            {getUsernameStatusText()}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Password must be at least 6 characters
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || usernameStatus === "checking" || usernameStatus === "taken" || usernameStatus === "invalid"}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </form>
  );
}
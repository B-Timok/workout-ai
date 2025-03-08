"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthListener } from "@/lib/hooks/useAuthListener";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check session status on mount
  const checkSession = async () => {
    try {
      setCheckingSession(true);
      // Just check the session status, no sign out
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // If already logged in, redirect to dashboard
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Session check error:", e);
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Listen for authentication changes (tab switching)
  useAuthListener(() => {
    console.log("Auth state changed in login form, checking session");
    checkSession();
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in without signing out first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (!data.session || !data.user) {
        setError("Authentication succeeded but no session was created. Please try again.");
        return;
      }

      // Verify user exists in the database before redirecting
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) {
        console.error("Profile verification error:", profileError);
        setError("Unable to verify your account. Please try again or contact support.");
        await supabase.auth.signOut();
        return;
      }

      // All checks passed, proceed with login
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing in:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-6">
      {checkingSession && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Preparing login form...</span>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
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
          disabled={checkingSession}
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none pr-10"
            disabled={checkingSession}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
            disabled={checkingSession}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || checkingSession}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {loading ? "Signing in..." : checkingSession ? "Please wait..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
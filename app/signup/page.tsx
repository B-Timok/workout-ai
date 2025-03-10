import { SignupForm } from "@/app/auth/signup-form";
import { createClient } from "@/lib/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import NavigationHeader from "@/components/navigation-header";
import Link from "next/link";

export default async function SignupPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Use getUser instead of getSession for proper authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  // If the user is already logged in, redirect to the dashboard
  if (user) {
    redirect("/dashboard");
  }
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationHeader />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 p-8 border rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create an Account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up to access personalized workout plans
            </p>
          </div>
          <SignupForm />
          <div className="text-center text-sm">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
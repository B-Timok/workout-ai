import { createClient } from "@/lib/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Sign out the user
  await supabase.auth.signOut();
  
  // Create a response that redirects to the home page instead of login
  // This helps break the redirect loop by avoiding the login page
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001")
  );
  
  // Explicitly clear all potential Supabase auth cookies
  const authCookies = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    '__session'
  ];
  
  for (const cookieName of authCookies) {
    response.cookies.delete(cookieName);
  }
  
  return response;
}
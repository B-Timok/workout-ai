import { createClient } from "@/lib/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Sign out the user
  await supabase.auth.signOut();
  
  // Get the base URL dynamically
  // const baseUrl = process.env.NEXT_PUBLIC_APP_URL || // If you ever define it manually
  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3001"; // Fallback for local dev

  // Construct absolute URL for redirection
  const redirectUrl = `${baseUrl}/home`;

  // Redirect user to login page
  const response = NextResponse.redirect(redirectUrl);

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
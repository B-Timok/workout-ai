import { createBrowserClient } from "@supabase/ssr";

// Custom event for session changes
export const SUPABASE_AUTH_CHANGE_EVENT = 'supabase-auth-change';

// Function to emit session change events that components can listen for
export const emitAuthChangeEvent = (eventDetail = {}) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(SUPABASE_AUTH_CHANGE_EVENT, { detail: eventDetail });
    console.log(`🔔 Emitting auth change event`, eventDetail);
    window.dispatchEvent(event);
  }
};

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  
  // Add visibility change listener to refresh session when switching tabs
  if (typeof window !== 'undefined') {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, refresh the session
        console.log('Tab became visible, refreshing auth session');
        try {
          // Refresh the session
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('Error refreshing session:', error);
          } else if (data.session) {
            console.log('Session refreshed successfully');
            // Emit custom event to notify components
            emitAuthChangeEvent({ type: 'VISIBILITY_REFRESH', source: 'visibility_change' });
          }
        } catch (err) {
          console.error('Error in visibility change handler:', err);
        }
      }
    };

    // Only add the listener once
    if (!window.__supabaseVisibilityListenerAdded) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.__supabaseVisibilityListenerAdded = true;
      console.log('Added visibility change listener');
    }
    
    // Also set up a global auth listener
    if (!window.__supabaseAuthListenerAdded) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth state changed: ${event}`);
        emitAuthChangeEvent({ type: event, session: session ? { id: session.user.id } : null });
      });
      
      window.__supabaseAuthListenerAdded = true;
      console.log('Added global auth state listener');
      
      // Add cleanup if needed
      window.__supabaseAuthCleanup = () => {
        subscription.unsubscribe();
      };
    }
  }
  
  supabaseInstance = supabase;
  return supabase;
};

// Add TypeScript declaration
declare global {
  interface Window {
    __supabaseVisibilityListenerAdded?: boolean;
    __supabaseAuthListenerAdded?: boolean;
    __supabaseAuthCleanup?: () => void;
  }
}

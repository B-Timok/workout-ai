import { useEffect } from 'react';
import { SUPABASE_AUTH_CHANGE_EVENT } from '@/lib/utils/supabase/client';

/**
 * A custom hook that listens for Supabase authentication changes,
 * including those caused by tab switching or session refreshes.
 * 
 * @param callback Function to be called when auth state changes
 */
export function useAuthListener(callback: () => void) {
  useEffect(() => {
    // Handler for the custom auth change event
    const handleAuthChange = () => {
      callback();
    };

    // Add event listener
    window.addEventListener(SUPABASE_AUTH_CHANGE_EVENT, handleAuthChange);

    // Clean up
    return () => {
      window.removeEventListener(SUPABASE_AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [callback]);
}

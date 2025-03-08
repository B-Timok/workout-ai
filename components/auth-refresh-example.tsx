'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { useAuthListener } from '@/lib/hooks/useAuthListener';

export default function ProfileComponent() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  // Function to fetch user profile data
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      // First verify the user is authenticated (uses the secure getUser method)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('Authentication error:', userError);
        setProfile(null);
        return;
      }
      
      // Now fetch the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }
      
      console.log('Profile loaded successfully');
      setProfile(profileData);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);
  
  // Initial profile fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Listen for auth changes (including tab visibility changes)
  useAuthListener(() => {
    console.log('Auth change detected, refreshing profile data');
    fetchProfile();
  });
  
  if (loading) {
    return <div>Loading profile...</div>;
  }
  
  if (!profile) {
    return <div>Not authenticated or profile not found</div>;
  }
  
  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">User Profile</h2>
      
      <div className="mb-4">
        <p className="font-medium">Email:</p>
        <p>{profile.email}</p>
      </div>
      
      <div className="mb-4">
        <p className="font-medium">Username:</p>
        <p>{profile.username}</p>
        {/* Username field is locked/disabled after initial creation */}
        <p className="text-xs text-gray-500">Username cannot be changed once set.</p>
      </div>
      
      <div className="mb-4">
        <p className="font-medium">Last Updated:</p>
        <p>{new Date().toISOString()}</p>
      </div>
      
      <button
        onClick={fetchProfile}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Profile
      </button>
    </div>
  );
}

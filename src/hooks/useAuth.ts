import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'editor' | 'viewer';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  granted_by: string | null;
}

interface UseAuthResult {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  role: AppRole | null;
  loading: boolean;
}

export const useAuth = (): UseAuthResult => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle token refresh errors by signing out
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, signing out');
          supabase.auth.signOut();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Handle invalid refresh token by clearing session
      if (error?.message?.includes('Refresh Token') || error?.message?.includes('refresh_token')) {
        console.warn('Invalid refresh token detected, clearing session');
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      // Catch any auth errors and clear stale session
      console.warn('Auth error, clearing session:', err);
      supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRole(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    // Guard: prevent queries with empty/invalid user_id
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.warn('fetchUserRole called with invalid userId:', userId);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid error when no row exists

      if (error) {
        console.error('Error fetching user role:', error.message);
        setRole(null);
      } else if (data) {
        setRole(data.role as AppRole);
      } else {
        // No role assigned yet - this is normal for new users
        console.log('No role found for user:', userId);
        setRole(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching user role:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    isAdmin: role === 'admin',
    role,
    loading,
  };
};

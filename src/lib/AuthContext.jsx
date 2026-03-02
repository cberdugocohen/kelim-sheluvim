import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { User } from '@/entities/User';

const AuthContext = createContext({});

/**
 * Ensure a row exists in the `users` table for the given auth user.
 * Called automatically on sign-in / sign-up so User.me() always works.
 */
async function ensureUserProfile(user) {
  if (!user) return;
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('users').insert({
        auth_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        role: 'user'
      });
    }
  } catch (err) {
    console.error('ensureUserProfile error:', err);
  }
}

export function AuthProvider({ children }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount — no need for a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        ensureUserProfile(session.user);
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigateToLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoadingAuth,
      authError,
      isAuthenticated,
      navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

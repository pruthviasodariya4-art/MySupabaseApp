import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useGetSessionQuery,
} from '../features/auth/authApi';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  // updated_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error?: any }>;
  updateProfile: (
    updates: Partial<Profile>,
  ) => Promise<{ data: any; error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: sessionData, isLoading: isSessionLoading } =
    useGetSessionQuery();

  // Set initial loading to false once session is loaded
  useEffect(() => {
    if (!isSessionLoading) {
      setLoading(false);
    }
  }, [isSessionLoading]);

  const [signUpMutation] = useSignUpMutation();
  const [signInMutation] = useSignInMutation();
  const [signOutMutation] = useSignOutMutation();

  // Update user and profile when session changes
  useEffect(() => {
    if (!isSessionLoading) {
      if (sessionData) {
        setUser(sessionData.user);
        setProfile(sessionData.profile);
      }
      setLoading(false);
    }
  }, [sessionData, isSessionLoading]);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        const result = await signUpMutation({
          email,
          password,
          fullName,
        }).unwrap();

        if (result.error) {
          return { data: null, error: result.error };
        }

        if (result.profile) {
          setProfile(result.profile);
          setUser(result.user);
          // Navigate to HomeScreen after successful signup
        }

        return { data: result, error: null };
      } catch (error: any) {
        console.error('Signup error:', error);
        return { data: null, error: error?.data?.error || error };
      }
    },
    [signUpMutation],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signInMutation({ email, password }).unwrap();

        if (result.error) {
          return { data: null, error: result.error };
        }

        if (result.user) {
          setUser(result.user);
          setProfile(result.profile || null);
        }

        return { data: result, error: null };
      } catch (error: any) {
        console.error('Sign in error:', error);
        return { data: null, error: error?.data?.error || error };
      }
    },
    [signInMutation],
  );

  const signOut = useCallback(async () => {
    try {
      await signOutMutation().unwrap();
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error: error?.data?.error || error };
    }
  }, [signOutMutation]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return { data: null, error: new Error('No user logged in') };

      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(prev => (prev ? { ...prev, ...updates } : null));
        return { data, error: null };
      } catch (error) {
        console.error('Update profile error:', error);
        return { data: null, error };
      }
    },
    [user],
  );

  const value = {
    user,
    profile,
    loading: loading || isSessionLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

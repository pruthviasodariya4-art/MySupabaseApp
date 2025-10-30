import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { User } from '@supabase/auth-js';
import { supabase } from '../lib/supabase';

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
  signOut: () => Promise<void>;
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

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // Create or update user profile
  // const createOrUpdateProfile = async (
  //   userId: string,
  //   email: string,
  //   fullName?: string,
  // ) => {
  //   try {
  //     const updates = {
  //       id: userId,
  //       email,
  //       full_name: fullName || email.split('@')[0],
  //       updated_at: new Date().toISOString(),
  //     };

  //     const { data, error } = await supabase
  //       .from('profiles')
  //       .upsert(updates, { onConflict: 'id' })
  //       .select()
  //       .single();

  //     if (error) throw error;
  //     setProfile(data);
  //     return { data, error: null };
  //   } catch (error) {
  //     console.error('Error updating profile:', error);
  //     return { data: null, error };
  //   }
  // };

  useEffect(() => {
    // Check active sessions and set the user
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Sign in error------------>:', error);
        return { data: null, error };
      }

      console.log('Sign in successful:', data);
      setUser(data.user);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred',
          details: error,
        },
      };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      // 1. Create the auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('Auth signup error:', error);
        return { data: null, error };
      }

      // 2. Create the user profile
      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: email,
          full_name: fullName || email.split('@')[0],
          avatar_url: '',
          created_at: new Date().toISOString(),
        };

        const { data: profileDataResponse, error: profileError } =
          await supabase.from('profiles').upsert(profileData).select().single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return { data: null, error: profileError };
        }

        setProfile(profileDataResponse);
        return {
          data: {
            user: data.user,
            profile: profileDataResponse,
          },
          error: null,
        };
      }

      return { data: null, error: new Error('User creation failed') };
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return { data: null, error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

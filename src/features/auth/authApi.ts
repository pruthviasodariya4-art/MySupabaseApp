import { createApi } from '@reduxjs/toolkit/query/react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type SignUpRequest = {
  email: string;
  password: string;
  fullName?: string;
};

type SignInRequest = {
  email: string;
  password: string;
};

type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
};

type AuthResponse = {
  user: User | null;
  profile: Profile | null;
  error?: any;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: async args => {
    try {
      const { data, error } = await (args as any);
      if (error) {
        return { error: { status: 'CUSTOM_ERROR', error } };
      }
      return { data };
    } catch (error: any) {
      return { error: { status: 'CUSTOM_ERROR', error: error.message } };
    }
  },
  endpoints: builder => ({
    signUp: builder.mutation<AuthResponse, SignUpRequest>({
      queryFn: async ({ email, password, fullName }) => {
        try {
          // 1. Create auth user
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName || email.split('@')[0],
              },
            },
          });

          //   if (error) {
          //     return { error: { status: 'CUSTOM_ERROR', error } };
          //   }

          // 2. Create profile
          if (data.user) {
            const profileData = {
              id: data.user.id,
              email,
              full_name: fullName || email.split('@')[0],
              avatar_url: '',
              created_at: new Date().toISOString(),
            };

            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .upsert(profileData)
              .select()
              .single();

            if (profileError) {
              return { error: { status: 'CUSTOM_ERROR', error: profileError } };
            }

            return {
              data: {
                user: data.user,
                profile,
              },
            };
          }

          return {
            error: { status: 'CUSTOM_ERROR', error: 'User creation failed' },
          };
        } catch (error: any) {
          //   return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
    }),
    signIn: builder.mutation<AuthResponse, SignInRequest>({
      queryFn: async ({ email, password }) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', error } };
          }

          if (data.user) {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              return { error: { status: 'CUSTOM_ERROR', error: profileError } };
            }

            return {
              data: {
                user: data.user,
                profile,
              },
            };
          }

          return { error: { status: 'CUSTOM_ERROR', error: 'Login failed' } };
        } catch (error: any) {
          //  return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
    }),
    signOut: builder.mutation<{ error: any }, void>({
      queryFn: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          return { error: { status: 'CUSTOM_ERROR', error } };
        }
        return { data: { error: null } };
      },
    }),
    getSession: builder.query<AuthResponse, void>({
      queryFn: async () => {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          return { data: { user: null, profile: null } };
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profileError) {
          return { data: { user: data.session.user, profile: null } };
        }

        return {
          data: {
            user: data.session.user,
            profile,
          },
        };
      },
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useGetSessionQuery,
} = authApi;

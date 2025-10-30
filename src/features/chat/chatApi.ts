import { createApi } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../lib/supabase';
import { BaseQueryFn } from '@reduxjs/toolkit/query';

type Message = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
};

type SendMessageRequest = {
  content: string;
  userId: string;
};

// Custom base query using Supabase
const supabaseBaseQuery: BaseQueryFn = async args => {
  try {
    const { data, error } = await (args as any);
    if (error) {
      return { error: { status: 'CUSTOM_ERROR', error } };
    }
    return { data };
  } catch (error: any) {
    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
  }
};

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: supabaseBaseQuery,
  tagTypes: ['Messages'],
  endpoints: builder => ({
    getMessages: builder.query<Message[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('messages')
          .select(
            `
            *,
            user:user_id (id, full_name, avatar_url)
          `,
          )
          .order('created_at', { ascending: true });

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', error } };
        }
        return { data: data || [] };
      },
      providesTags: ['Messages'],
    }),
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      queryFn: async ({ content, userId }) => {
        const { data, error } = await supabase
          .from('messages')
          .insert([{ content, user_id: userId }])
          .select(
            `
            *,
            user:user_id (id, full_name, avatar_url)
          `,
          )
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', error } };
        }
        return { data };
      },
      invalidatesTags: ['Messages'],
    }),
  }),
});

export const { useGetMessagesQuery, useSendMessageMutation } = chatApi;

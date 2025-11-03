import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AppSVGs } from '../assets/svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TypingIndicator } from '../components/TypingIndicator';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  room_id: string;
  is_read: boolean;
}

const ChatScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { user: otherUser } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<any>(null);

  // Set up real-time subscription with presence for typing indicator
  useEffect(() => {
    if (!roomId || !user?.id) return;

    // Create a channel for this room
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Subscribe to new messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      payload => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
      },
    );

    // Track presence changes for typing indicator
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();

      // Check if other user is typing
      const otherUserPresence = Object.values(presenceState).find(
        (presence: any) => {
          const presenceArray = presence as any[];
          return presenceArray.some(
            (p: any) => p.user_id === otherUser.id && p.typing === true,
          );
        },
      );

      setIsOtherUserTyping(!!otherUserPresence);
    });

    // Subscribe and track presence
    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          typing: false,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user?.id, otherUser.id]);

  // Get or create chat room
  useEffect(() => {
    const getOrCreateChatRoom = async () => {
      if (!user?.id) return;

      try {
        // Create a unique room ID by combining both user IDs in a consistent order
        const userIds = [user.id, otherUser.id].sort();
        const generatedRoomId = `${userIds[0]}_${userIds[1]}`;

        // First, try to get the existing room
        const { data: existingRoom, error: fetchError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', generatedRoomId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is "not found" error
          console.error('Error fetching room:', fetchError);
          return;
          y;
        }

        // If room doesn't exist, create it
        if (!existingRoom) {
          const { data: newRoom, error: createError } = await supabase
            .from('chat_rooms')
            .insert({
              id: generatedRoomId,
              user1_id: userIds[0],
              user2_id: userIds[1],
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating room:', createError);
            return;
          }
          console.log('Created new room:', newRoom);
        }

        setRoomId(generatedRoomId);

        // // Fetch existing messages
        const { data: existingMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', generatedRoomId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        if (existingMessages) {
          setMessages(existingMessages);
        }
      } catch (error) {
        console.error('Error in getOrCreateChatRoom:', error);
      }
    };

    getOrCreateChatRoom();
  }, [user?.id, otherUser.id]);

  // Update typing status
  const updateTypingStatus = async (isTyping: boolean) => {
    if (channelRef.current && user?.id) {
      await channelRef.current.track({
        user_id: user.id,
        typing: isTyping,
        online_at: new Date().toISOString(),
      });
    }
  };

  // Handle text input change with typing indicator
  const handleTextChange = (text: string) => {
    setMessage(text);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true
    if (text.length > 0) {
      updateTypingStatus(true);

      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
      }, 2000);
    } else {
      updateTypingStatus(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !user?.id || !roomId) {
      console.log('Missing required fields:', {
        message: message.trim(),
        userId: user?.id,
        roomId,
      });
      return;
    }

    const newMessage = {
      content: message.trim(),
      room_id: roomId,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    const { error } = await supabase.from('messages').insert([newMessage]);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // Stop typing indicator and clear the input field
    updateTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <Text
          style={isCurrentUser ? styles.currentUserText : styles.otherUserText}
        >
          {item.content}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppSVGs.Back width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
          {otherUser.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avtarBackground}>
              <AppSVGs.Person width={30} height={30} />
            </View>
          )}
        </View>
        <Text style={styles.headerTitle}>{otherUser.full_name || 'Chat'}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
      />

      {/* Typing Indicator */}
      {isOtherUserTyping && <TypingIndicator />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={90}
      >
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  avatarContainer: {},
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 2,
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
    borderBottomLeftRadius: 2,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 120,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  avtarBackground: {
    backgroundColor: '#ddddddff',
    borderRadius: 25,
    padding: 5,
  },
});

export default ChatScreen;

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AppSVGs } from '../assets/svg';

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

  // Get or create chat room
  useEffect(() => {
    const getOrCreateChatRoom = async () => {
      if (!user?.id) return;

      try {
        // Create a unique room ID by combining both user IDs in a consistent order
        const userIds = [user.id, otherUser.id].sort();
        const roomId = `${userIds[0]}_${userIds[1]}`;

        // First, try to get the existing room
        const { data: existingRoom, error: fetchError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is "not found" error
          console.error('Error fetching room:', fetchError);
          return;
        }

        // If room doesn't exist, create it
        if (!existingRoom) {
          const { data: newRoom, error: createError } = await supabase
            .from('chat_rooms')
            .insert({
              id: roomId,
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

        setRoomId(roomId);

        // // Fetch existing messages
        const { data: existingMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
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

  // const fetchMessages = async () => {
  //   const { data: existingMessages, error: messagesError } = await supabase
  //     .from('messages')
  //     .select('*')
  //     .eq('room_id', roomId)
  //     .order('created_at', { ascending: true });
  //   if (messagesError) {
  //     console.error('Error fetching messages:', messagesError);
  //     return;
  //   }
  //   if (existingMessages) {
  //     setMessages(existingMessages);
  //   }
  // };

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

    const { data: existingMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return;
    }

    if (existingMessages) {
      setMessages(existingMessages);
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
          <AppSVGs.Person width={25} height={25} />
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={90}
      >
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
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
  avatarContainer: {
    // marginBottom: 10,
    padding: 5,
    backgroundColor: '#ddddddff',
    borderRadius: 25,
  },
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
});

export default ChatScreen;

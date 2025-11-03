import { useEffect, useState } from 'react';
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Profile } from '../types';
import { AppSVGs } from '../assets/svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ConversionComponent = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [chatUsers, setChatUsers] = useState<Profile[]>([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*'); // You can also select specific columns e.g. 'id, full_name, email'

    if (error) {
      console.log('Error fetching users:', error);
      return [];
    }
    setChatUsers(data);
    return data;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        selectionColor="#007AFF"
        placeholderTextColor="#999"
        backgroundColor="#ddddddff"
      />
      <FlatList
        data={chatUsers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          console.log('🚀 ~ ConversionComponent ~ item:', item);
          if (item?.id === user?.id) {
            return null;
          }
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                navigation.navigate('Chat', { user: item });
              }}
            >
              <View style={styles.avatarContainer}>
                {item.avatar_url ? (
                  <Image
                    source={{ uri: item.avatar_url }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avtarBackground}>
                    <AppSVGs.Person width={30} height={30} />
                  </View>
                )}
                {/* <AppSVGs.Person width={30} height={30} /> */}
              </View>
              <Text>{item.full_name}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default ConversionComponent;

const styles = StyleSheet.create({
  container: {},
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddddddff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddddddff',
  },
  avatarContainer: {
    marginBottom: 10,
    // margin: 10,
    padding: 5,
    // backgroundColor: '#ddddddff',
    borderRadius: 25,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avtarBackground: {
    backgroundColor: '#ddddddff',
    borderRadius: 25,
    padding: 5,
  },
});

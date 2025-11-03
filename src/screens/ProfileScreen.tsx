import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AppSVGs } from '../assets/svg';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToSupabase } from '../utils/imageUpload';

const ProfileScreen = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const email = user?.email || '';
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  console.log('🚀 ~ ProfileScreen ~ selectedImage:', selectedImage);

  const hasChanges =
    fullName !== (profile?.full_name || '') || selectedImage !== null;

  const handleSave = async () => {
    try {
      setIsUploading(true);
      let avatarUrl = profile?.avatar_url;

      // Upload image if a new one was selected
      if (selectedImage && user?.id) {
        avatarUrl = await uploadImageToSupabase(selectedImage, user.id);
      }

      await updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl,
      });

      setSelectedImage(null);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        'Failed to update profile. ' + (error as Error).message,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const pickImage = async () => {
    const options = {
      mediaType: 'photo', // 'photo', 'video', or 'mixed'
      quality: 1, // 0 to 1, where 1 is the highest quality
    };
    setIsEditing(true);
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorCode);
        Alert.alert('Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        if (uri) {
          setSelectedImage(uri);
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {selectedImage || profile?.avatar_url ? (
              <Image
                source={{ uri: selectedImage || profile?.avatar_url || '' }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {isUploading ? (
              <View style={styles.editIcon}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => pickImage()}
              >
                <AppSVGs.Edit width={20} height={20} color="#000" />
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <TextInput
              style={[styles.name, styles.input]}
              value={fullName}
              onChangeText={setFullName}
              autoFocus
            />
          ) : (
            <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          )}
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <AppSVGs.Edit width={20} height={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.infoValue, styles.input]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
              />
            ) : (
              <Text style={styles.infoValue}>{fullName}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(user?.created_at || '').toLocaleDateString()}
            </Text>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (!hasChanges || isUploading) && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={!hasChanges || isUploading}
            >
              {isUploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.buttonText, styles.uploadingText]}>
                    Uploading...
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    !hasChanges && styles.disabledButtonText,
                  ]}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setFullName(profile?.full_name || '');
                setSelectedImage(null);
                setIsEditing(false);
              }}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e4e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    minHeight: 30,
    textAlignVertical: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  signOutButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#6c757d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#999',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginLeft: 10,
  },
});

export default ProfileScreen;

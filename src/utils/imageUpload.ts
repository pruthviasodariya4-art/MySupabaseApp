import { supabase } from '../lib/supabase';

export interface ImageAsset {
  uri?: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

/**
 * Upload image to Supabase Storage and return public URL
 * @param imageUri - Local image URI from image picker
 * @param userId - User ID for organizing files
 * @param bucket - Storage bucket name (default: 'avatars')
 * @returns Public URL of uploaded image
 */
export const uploadImageToSupabase = async (
  imageUri: string | undefined,
  userId: string,
  bucket: string = 'avatars',
): Promise<string> => {
  if (!imageUri) {
    throw new Error('No image URI provided');
  }

  try {
    // Generate unique filename
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Fetch the image as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Convert blob to ArrayBuffer for Supabase
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Delete image from Supabase Storage
 * @param imageUrl - Public URL of the image
 * @param bucket - Storage bucket name (default: 'avatars')
 */
export const deleteImageFromSupabase = async (
  imageUrl: string,
  bucket: string = 'avatars',
): Promise<void> => {
  try {
    // Extract file path from public URL
    const pathParts = imageUrl.split(`/storage/v1/object/public/${bucket}/`);
    if (pathParts.length < 2) {
      throw new Error('Invalid image URL');
    }
    const filePath = pathParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

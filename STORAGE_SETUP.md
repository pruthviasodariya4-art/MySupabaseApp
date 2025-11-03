# Supabase Storage Setup Guide

## Create the Avatars Bucket

You need to create a storage bucket in Supabase to store user profile images.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://zjeyyryirpsiugngyqll.supabase.co
   - Login to your project

2. **Create Storage Bucket**
   - Click on "Storage" in the left sidebar
   - Click "New bucket"
   - Bucket name: `avatars`
   - Make it **Public** (check the "Public bucket" option)
   - Click "Create bucket"

3. **Set Bucket Policies (Important!)**
   
   After creating the bucket, you need to set up policies to allow users to upload and read images.

   Go to Storage > Policies and add these policies for the `avatars` bucket:

   **Policy 1: Allow authenticated users to upload their own avatars**
   ```sql
   CREATE POLICY "Users can upload their own avatar"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'avatars' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Policy 2: Allow public read access to all avatars**
   ```sql
   CREATE POLICY "Public avatar access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'avatars');
   ```

   **Policy 3: Allow users to update their own avatars**
   ```sql
   CREATE POLICY "Users can update their own avatar"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'avatars' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Policy 4: Allow users to delete their own avatars**
   ```sql
   CREATE POLICY "Users can delete their own avatar"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'avatars' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

4. **Verify Setup**
   - The bucket should now appear in your Storage section
   - It should be marked as "Public"
   - The policies should be active

## How It Works

- When a user uploads an avatar, it's stored in: `avatars/{user_id}/{timestamp}.{ext}`
- The public URL will be: `https://zjeyyryirpsiugngyqll.supabase.co/storage/v1/object/public/avatars/{user_id}/{filename}`
- This URL is stored in the `profiles` table `avatar_url` column
- The URL works across all platforms (iOS, Android, Web) because it's a public HTTP URL

## Testing

After setup, test by:
1. Opening the app on any device
2. Going to Profile screen
3. Clicking the edit icon on the avatar
4. Selecting an image
5. Clicking "Save Changes"
6. The image should upload and display correctly
7. Test on another device - the same image should appear

/**
 * Centralized avatar storage utility
 * Handles uploading images to Supabase Storage and returns URLs instead of base64
 */

import { supabase } from '../lib/supabase';

interface UploadAvatarResult {
  url: string;
  error?: string;
}

interface UploadOptions {
  userId: string;
  file: File;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Upload an avatar image to Supabase Storage and return the URL
 */
export async function uploadAvatar(options: UploadOptions): Promise<UploadAvatarResult> {
  const {
    userId,
    file,
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES
  } = options;

  try {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return {
        url: '',
        error: `Invalid file type. Please select one of: ${allowedTypes.join(', ')}`
      };
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      return {
        url: '',
        error: `File too large. Maximum size is ${maxSizeMB}MB`
      };
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('storage')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return {
        url: '',
        error: 'Failed to upload image. Please try again.'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('storage')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      error: undefined
    };

  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      url: '',
      error: 'An unexpected error occurred while uploading.'
    };
  }
}

/**
 * Update user profile with new avatar URL
 */
export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      console.error('Profile avatar update error:', error);
      return { error: 'Failed to update profile with new avatar' };
    }

    return {};
  } catch (error) {
    console.error('Profile avatar update error:', error);
    return { error: 'An unexpected error occurred while updating profile' };
  }
}

/**
 * Upload avatar and update profile in one operation
 */
export async function uploadAndUpdateAvatar(options: UploadOptions): Promise<UploadAvatarResult> {
  const uploadResult = await uploadAvatar(options);
  
  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  const updateResult = await updateProfileAvatar(options.userId, uploadResult.url);
  
  if (updateResult.error) {
    return {
      url: uploadResult.url,
      error: updateResult.error
    };
  }

  return uploadResult;
}

/**
 * Convert base64 data URL to File object
 */
export function base64ToFile(base64String: string, filename: string = 'avatar.png'): File {
  // Extract the base64 data and mime type
  const [header, data] = base64String.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
  
  // Convert base64 to binary
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  // Create file object
  return new File([bytes], filename, { type: mimeType });
}

/**
 * Check if a string is a base64 data URL
 */
export function isBase64DataURL(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * Convert existing base64 avatar to storage URL
 */
export async function migrateBase64Avatar(userId: string, base64Avatar: string): Promise<UploadAvatarResult> {
  if (!isBase64DataURL(base64Avatar)) {
    return { url: base64Avatar }; // Already a URL, no migration needed
  }

  try {
    // Convert base64 to file
    const file = base64ToFile(base64Avatar, `migrated-avatar-${userId}.png`);
    
    // Upload to storage
    const result = await uploadAndUpdateAvatar({ userId, file });
    
    return result;
  } catch (error) {
    console.error('Base64 avatar migration error:', error);
    return {
      url: '',
      error: 'Failed to migrate avatar to storage'
    };
  }
} 
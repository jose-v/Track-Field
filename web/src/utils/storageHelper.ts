/**
 * Helper functions for working with Supabase storage
 */

// Import libraries
import { supabase } from '../lib/supabase';

/**
 * Get a public URL for a file in Supabase storage
 * This is useful for accessing files that have been uploaded
 */
export const getPublicUrl = (bucketName: string, filePath: string): string => {
  if (!bucketName || !filePath) {
    console.error('Invalid bucket name or file path', { bucketName, filePath });
    return '';
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Parse a Supabase public URL to extract bucket name and file path
 */
export const parseStorageUrl = (url: string): { bucketName: string; filePath: string } | null => {
  try {
    // Check if URL is valid
    if (!url || !url.includes('supabase')) return null;

    // Extract path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Typical format: /storage/v1/object/public/storage/workouts/user_id/file.ext
    // Find index of "public" and then the bucket name follows
    const publicIndex = pathParts.indexOf('public');
    if (publicIndex === -1 || publicIndex >= pathParts.length - 1) return null;

    const bucketName = pathParts[publicIndex + 1];
    const filePath = pathParts.slice(publicIndex + 2).join('/');

    return {
      bucketName,
      filePath
    };
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
}; 
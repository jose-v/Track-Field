import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadAndUpdateAvatar } from '../utils/avatarStorage';
import { getUserAvatarUrl } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface UseAvatarReturn {
  uploading: boolean;
  uploadAvatar: (file: File) => Promise<string | null>;
  getAvatarUrl: (userId?: string) => Promise<string | null>;
}

/**
 * Hook for managing avatar uploads and retrieval
 */
export function useAvatar(): UseAvatarReturn {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    setUploading(true);

    try {
      const result = await uploadAndUpdateAvatar({
        userId: user.id,
        file
      });

      if (result.error) {
        toast({
          title: 'Upload Error',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return null;
      }

      // Invalidate profile cache to refetch with new avatar URL
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return result.url;

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const getAvatarUrl = async (userId?: string): Promise<string | null> => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return null;

    try {
      return await getUserAvatarUrl(targetUserId);
    } catch (error) {
      console.error('Error fetching avatar URL:', error);
      return null;
    }
  };

  return {
    uploading,
    uploadAvatar,
    getAvatarUrl
  };
} 
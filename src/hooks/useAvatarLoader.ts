import { useState, useEffect } from 'react';
import { getUserAvatarUrl } from '../services/authService';

/**
 * Simple avatar loader hook that doesn't cause infinite loops
 */
export function useAvatarLoader(userId?: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    getUserAvatarUrl(userId)
      .then(url => {
        if (!isCancelled) {
          setAvatarUrl(url);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          console.error('Failed to load avatar:', error);
          setAvatarUrl(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const refresh = () => {
    if (userId) {
      setLoading(true);
      getUserAvatarUrl(userId)
        .then(setAvatarUrl)
        .catch(error => {
          console.error('Failed to refresh avatar:', error);
          setAvatarUrl(null);
        })
        .finally(() => setLoading(false));
    }
  };

  return { avatarUrl, loading, refresh };
} 
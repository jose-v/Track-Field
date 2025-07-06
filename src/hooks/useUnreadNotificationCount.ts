import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useUnreadNotificationCount = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch unread count (stable reference)
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread notification count:', error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
        console.log('🔔 Updated notification count:', count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Debounced refresh function to prevent too many calls
  const debouncedRefresh = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchUnreadCount();
    }, 500); // 500ms debounce
  }, [fetchUnreadCount]);

  // Function to manually refresh the count
  const refreshCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Function to decrease count (when notifications are marked as read)
  const decreaseCount = useCallback((amount: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  // Function to reset count to zero
  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    // Use unique channel name per user to avoid conflicts
    const channelName = `notifications_count_${user.id}`;
    
    console.log('🔔 Setting up notification subscription for user:', user.id);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Notification change detected:', payload.eventType, payload.new);
          // Use debounced refresh to prevent too many calls
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });

    return () => {
      console.log('🔔 Cleaning up notification subscription');
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id, debouncedRefresh]);

  return {
    unreadCount,
    isLoading,
    refreshCount,
    decreaseCount,
    resetCount,
  };
}; 
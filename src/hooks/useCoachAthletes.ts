import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useCoachAthletes() {
  const { user } = useAuth();

  const {
    data: athletes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['coach-athletes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await api.athletes.getByCoach(user.id);
    },
    enabled: !!user?.id,
  });

  return { athletes, isLoading, isError, error };
} 
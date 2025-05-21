import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Spinner, Flex } from '@chakra-ui/react';

const LoopRouteWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const redirectBasedOnRole = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Check the user's role from the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        // Default to athlete if there's an error
        navigate('/athlete/loop');
        return;
      }

      // Redirect based on role
      if (data && data.role === 'coach') {
        navigate('/coach/loop');
      } else {
        navigate('/athlete/loop');
      }
    };

    redirectBasedOnRole();
  }, [navigate, user]);

  return (
    <Flex justify="center" align="center" height="100vh">
      <Spinner size="xl" color="blue.500" />
    </Flex>
  );
};

export default LoopRouteWrapper; 
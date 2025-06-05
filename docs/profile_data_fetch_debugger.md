# Profile Data Fetch Debugger Components

This document contains the debug components we created to troubleshoot and fix the profile data fetching issue where the application was showing fallback data ("User") instead of real database data.

## Issue Summary

**Problem**: The application was displaying "User" as the first name and null as the last name everywhere in the app (sidebar, home page, avatars) despite the correct data being stored in the database.

**Root Cause**: The `useProfile` hook was prioritizing timeout fallback data over real database data due to aggressive fallback logic.

**Solution**: Modified the `useProfile` hook to prioritize real data and clear timeout fallbacks when real data becomes available.

## Debug Components Created

### 1. ProfileDebugger Component

Shows detailed profile information for debugging purposes.

```tsx
// src/components/ProfileDebugger.tsx
import React from 'react';
import { Box, Text, Code, VStack, Heading, Badge } from '@chakra-ui/react';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

export const ProfileDebugger: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading, isError, error } = useProfile();

  return (
    <Box p={6} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
      <Heading size="md" mb={4}>Profile Debug Information</Heading>
      
      <VStack align="stretch" spacing={3}>
        <Box>
          <Text fontWeight="bold">Authentication Status:</Text>
          <Badge colorScheme={user ? 'green' : 'red'}>
            {user ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
          {user && (
            <Box mt={2}>
              <Text fontSize="sm">User ID: <Code>{user.id}</Code></Text>
              <Text fontSize="sm">Email: <Code>{user.email}</Code></Text>
            </Box>
          )}
        </Box>

        <Box>
          <Text fontWeight="bold">Profile Query Status:</Text>
          <Badge colorScheme={isLoading ? 'yellow' : isError ? 'red' : 'green'}>
            {isLoading ? 'Loading' : isError ? 'Error' : 'Success'}
          </Badge>
          {isError && error && (
            <Box mt={2}>
              <Text fontSize="sm" color="red.500">Error: <Code>{error.message}</Code></Text>
            </Box>
          )}
        </Box>

        <Box>
          <Text fontWeight="bold">Profile Data:</Text>
          {profile ? (
            <Box mt={2}>
              <Text fontSize="sm">ID: <Code>{profile.id}</Code></Text>
              <Text fontSize="sm">Email: <Code>{profile.email}</Code></Text>
              <Text fontSize="sm">First Name: <Code>{profile.first_name || 'null'}</Code></Text>
              <Text fontSize="sm">Last Name: <Code>{profile.last_name || 'null'}</Code></Text>
              <Text fontSize="sm">Role: <Code>{profile.role || 'null'}</Code></Text>
              <Text fontSize="sm">Created: <Code>{profile.created_at}</Code></Text>
              <Text fontSize="sm">Has Role Data: <Code>{profile.roleData ? 'Yes' : 'No'}</Code></Text>
            </Box>
          ) : (
            <Text fontSize="sm" color="gray.500">No profile data</Text>
          )}
        </Box>

        <Box>
          <Text fontWeight="bold">Full Profile Object:</Text>
          <Code display="block" whiteSpace="pre" fontSize="xs" p={2} bg="gray.100">
            {JSON.stringify(profile, null, 2)}
          </Code>
        </Box>

        <Box>
          <Text fontWeight="bold">User Metadata:</Text>
          <Code display="block" whiteSpace="pre" fontSize="xs" p={2} bg="gray.100">
            {JSON.stringify(user?.user_metadata, null, 2)}
          </Code>
        </Box>
      </VStack>
    </Box>
  );
};
```

### 2. ProfileNameFixer Component

Allows manual profile name updates with enhanced logging.

```tsx
// src/components/ProfileNameFixer.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Input, 
  VStack, 
  Heading, 
  Text, 
  useToast,
  HStack,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { useProfile } from '../hooks/useProfile';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

export const ProfileNameFixer: React.FC = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleUpdate = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both first and last name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdating(true);
    console.log('🔧 PROFILE UPDATE: Starting update process...');
    console.log('🔧 Current user ID:', user?.id);
    console.log('🔧 Update data:', { first_name: firstName.trim(), last_name: lastName.trim() });
    
    try {
      console.log('🔧 Calling api.profile.update...');
      const updatedProfile = await api.profile.update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      console.log('🔧 API response received:', updatedProfile);
      console.log('🔧 Updated profile first_name:', updatedProfile?.first_name);
      console.log('🔧 Updated profile last_name:', updatedProfile?.last_name);

      if (!updatedProfile) {
        throw new Error('API returned no data');
      }

      if (updatedProfile.first_name !== firstName.trim() || updatedProfile.last_name !== lastName.trim()) {
        console.warn('🔧 WARNING: API returned different data than expected!');
        console.warn('Expected:', { first_name: firstName.trim(), last_name: lastName.trim() });
        console.warn('Received:', { first_name: updatedProfile.first_name, last_name: updatedProfile.last_name });
      }

      console.log('🔧 Updating React Query cache...');
      queryClient.setQueryData(['profile', user?.id], updatedProfile);
      
      console.log('🔧 Invalidating cache to trigger refetch...');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      
      toast({
        title: 'Success!',
        description: `Profile updated to: ${updatedProfile.first_name} ${updatedProfile.last_name}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setFirstName('');
      setLastName('');

      setTimeout(() => {
        console.log('🔧 Checking if data persisted after 2 seconds...');
        const currentCacheData = queryClient.getQueryData(['profile', user?.id]);
        console.log('🔧 Current cache data:', currentCacheData);
      }, 2000);

    } catch (error) {
      console.error('🔧 Failed to update profile:', error);
      console.error('🔧 Error details:', error.message, error.code, error.details);
      toast({
        title: 'Error',
        description: `Failed to update profile: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box p={6} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
      <Heading size="md" mb={4} color="blue.700">Fix Your Profile Name</Heading>
      
      <VStack align="stretch" spacing={4}>
        <Text fontSize="sm" color="blue.600">
          Current profile shows: <strong>{profile?.first_name || 'Unknown'} {profile?.last_name || ''}</strong>
        </Text>
        
        <Text fontSize="sm" color="blue.600">
          Enter your correct name below to update your profile:
        </Text>
        
        <HStack spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">First Name</FormLabel>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              bg="white"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Last Name</FormLabel>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              bg="white"
            />
          </FormControl>
        </HStack>
        
        <Button
          colorScheme="blue"
          onClick={handleUpdate}
          isLoading={isUpdating}
          loadingText="Updating..."
          size="sm"
        >
          Update Profile Name
        </Button>
      </VStack>
    </Box>
  );
};
```

### 3. DirectProfileTest Component

Tests direct database access bypassing React Query and fallback logic.

```tsx
// src/components/DirectProfileTest.tsx
import React, { useState } from 'react';
import { Box, Button, Text, Code, VStack, Heading } from '@chakra-ui/react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const DirectProfileTest: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testDirectFetch = async () => {
    setIsLoading(true);
    console.log('🧪 DIRECT PROFILE TEST: Starting direct fetch...');
    
    try {
      const result = await api.profile.get();
      console.log('🧪 Direct fetch result:', result);
      setTestResult({ success: true, data: result });
    } catch (error) {
      console.error('🧪 Direct fetch error:', error);
      setTestResult({ success: false, error: error.message, errorDetails: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
      <Heading size="md" mb={4} color="orange.700">Direct Profile Database Test</Heading>
      
      <VStack align="stretch" spacing={4}>
        <Text fontSize="sm" color="orange.600">
          User ID: <Code>{user?.id}</Code>
        </Text>
        
        <Button
          colorScheme="orange"
          onClick={testDirectFetch}
          isLoading={isLoading}
          loadingText="Testing..."
          size="sm"
        >
          Test Direct Database Fetch
        </Button>
        
        {testResult && (
          <Box>
            <Text fontWeight="bold" color={testResult.success ? 'green.600' : 'red.600'}>
              Result: {testResult.success ? 'SUCCESS' : 'ERROR'}
            </Text>
            <Code display="block" whiteSpace="pre" fontSize="xs" p={3} bg="gray.100" maxH="200px" overflow="auto">
              {JSON.stringify(testResult, null, 2)}
            </Code>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
```

## The Fix Applied

### Original problematic code in `useProfile.ts`:

```typescript
// This prioritized fallback over real data
const effectiveProfile = timeoutFallback || profileQuery.data;
```

### Fixed code:

```typescript
// This prioritizes real data over fallback
const effectiveProfile = profileQuery.data || timeoutFallback;

// Clear timeout fallback when real data is available
useEffect(() => {
  if (profileQuery.data && timeoutFallback) {
    console.log('🔄 Real profile data received, clearing timeout fallback');
    setTimeoutFallback(null);
  }
}, [profileQuery.data, timeoutFallback]);
```

## Key Debugging Insights

1. **Database had correct data**: The issue wasn't with data storage
2. **API could fetch correct data**: Direct API calls returned the right information
3. **React Query cache was stale**: The useProfile hook was stuck with fallback data
4. **Fallback logic was too aggressive**: Once a timeout fallback was created, it never cleared

## Usage Instructions

To use these debug components in the future:

1. Add any of the components to a page
2. Import them in your page component
3. Use them to diagnose profile-related issues
4. Remove them after debugging is complete

## Prevention

To prevent similar issues:
- Monitor timeout fallback usage in development
- Ensure fallback data is clearly marked as temporary
- Prioritize real data over fallback data in all data fetching hooks
- Clear fallback states when real data becomes available 
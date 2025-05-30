import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  useColorModeValue,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { CalendarIcon, EmailIcon, AtSignIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';

const AccountDetails: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Unknown';

  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    'User';

  const email = user?.email || '';
  const role = profile?.role || 'user';

  return (
    <Card bg={cardBg} shadow="sm">
      <CardHeader>
        <Heading size="md">Account Information</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Profile Section */}
          <HStack spacing={4}>
            <Avatar
              size="lg"
              name={fullName}
              src={profile?.avatar_url}
              bg="blue.500"
            />
            <VStack align="start" spacing={1}>
              <Heading size="sm">{fullName || email}</Heading>
              <Badge colorScheme={role === 'coach' ? 'blue' : 'green'} textTransform="capitalize">
                {role}
              </Badge>
            </VStack>
          </HStack>

          <Divider />

          {/* Account Details */}
          <VStack spacing={4} align="stretch">
            <HStack spacing={3}>
              <Box color={iconColor}>
                <EmailIcon />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold">Email Address</Text>
                <Text fontSize="sm" color={textColor}>{email}</Text>
              </VStack>
            </HStack>

            <HStack spacing={3}>
              <Box color={iconColor}>
                <CalendarIcon />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold">Member Since</Text>
                <Text fontSize="sm" color={textColor}>{memberSince}</Text>
              </VStack>
            </HStack>

            <HStack spacing={3}>
              <Box color={iconColor}>
                <AtSignIcon />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold">Account Type</Text>
                <Text fontSize="sm" color={textColor} textTransform="capitalize">{role} Account</Text>
              </VStack>
            </HStack>
          </VStack>

          <Divider />

          {/* Actions */}
          <HStack spacing={3}>
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AccountDetails; 
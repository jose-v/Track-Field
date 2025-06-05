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
  Badge,
  Button,
  useColorModeValue,
  Progress,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { CheckCircleIcon, TimeIcon, WarningIcon } from '@chakra-ui/icons';

const MembershipStatus: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('green.500', 'green.300');

  // Mock membership data - in real app, this would come from API
  const membershipData = {
    plan: 'Pro',
    status: 'active',
    nextBilling: '2024-02-15',
    daysUntilRenewal: 28,
    usageLimit: 1000,
    currentUsage: 750,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'expired': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'pending': return <TimeIcon />;
      case 'expired': return <WarningIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const usagePercentage = (membershipData.currentUsage / membershipData.usageLimit) * 100;

  return (
    <Card bg={cardBg} shadow="sm">
      <CardHeader>
        <Heading size="md">Membership Status</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Current Plan */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color={textColor}>Current Plan</Text>
              <HStack spacing={2}>
                <Heading size="lg">{membershipData.plan}</Heading>
                <Badge colorScheme={getStatusColor(membershipData.status)} textTransform="capitalize">
                  {membershipData.status}
                </Badge>
              </HStack>
            </VStack>
            <Box color={iconColor}>
              {getStatusIcon(membershipData.status)}
            </Box>
          </HStack>

          <Divider />

          {/* Billing Information */}
          <HStack spacing={8}>
            <Stat>
              <StatLabel>Next Billing Date</StatLabel>
              <StatNumber fontSize="md">{membershipData.nextBilling}</StatNumber>
              <StatHelpText>in {membershipData.daysUntilRenewal} days</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Monthly Cost</StatLabel>
              <StatNumber fontSize="md">$29.99</StatNumber>
              <StatHelpText>per month</StatHelpText>
            </Stat>
          </HStack>

          <Divider />

          {/* Usage Stats */}
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="semibold">Monthly Usage</Text>
              <Text fontSize="sm" color={textColor}>
                {membershipData.currentUsage} / {membershipData.usageLimit}
              </Text>
            </HStack>
            <Progress 
              value={usagePercentage} 
              colorScheme={usagePercentage > 80 ? 'red' : usagePercentage > 60 ? 'yellow' : 'green'}
              size="md"
              borderRadius="md"
            />
            <Text fontSize="xs" color={textColor}>
              Workouts created this month
            </Text>
          </VStack>

          <Divider />

          {/* Actions */}
          <HStack spacing={3}>
            <Button colorScheme="blue" size="sm">
              Upgrade Plan
            </Button>
            <Button variant="outline" size="sm">
              View Billing History
            </Button>
            <Button variant="outline" size="sm" colorScheme="red">
              Cancel Plan
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default MembershipStatus; 
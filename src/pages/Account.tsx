import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';
import AccountDetails from '../components/account/AccountDetails';
import MembershipStatus from '../components/account/MembershipStatus';
import BillingInformation from '../components/account/BillingInformation';
import PaymentMethods from '../components/account/PaymentMethods';
import UpgradeOptions from '../components/account/UpgradeOptions';
import { usePageHeader } from '../hooks/usePageHeader';

const Account: React.FC = () => {
  usePageHeader({
    title: 'Account & Billing',
    subtitle: 'Manage your subscription, payments, and account details',
  });
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          {/* Page Header */}
          <Box display={{ base: 'none', md: 'block' }}>
            <Heading size="xl" mb={2}>
              Account & Billing
            </Heading>
          </Box>

          {/* Account Details Section */}
          <AccountDetails />

          {/* Membership Status Section */}
          <MembershipStatus />

          {/* Billing Information Section */}
          <BillingInformation />

          {/* Payment Methods Section */}
          <PaymentMethods />

          {/* Upgrade Options Section */}
          <UpgradeOptions />
        </VStack>
      </Container>
    </Box>
  );
};

export default Account; 
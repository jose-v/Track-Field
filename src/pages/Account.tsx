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

const Account: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          {/* Page Header */}
          <Box>
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
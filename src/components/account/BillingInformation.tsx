import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { EditIcon, DownloadIcon } from '@chakra-ui/icons';

const BillingInformation: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const tableStripedBg = useColorModeValue('gray.50', 'gray.700');

  // Mock billing data
  const billingAddress = {
    name: 'John Doe',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'United States',
  };

  const billingHistory = [
    { id: '1', date: '2024-01-15', amount: '$29.99', status: 'paid', invoice: 'INV-001' },
    { id: '2', date: '2023-12-15', amount: '$29.99', status: 'paid', invoice: 'INV-002' },
    { id: '3', date: '2023-11-15', amount: '$29.99', status: 'paid', invoice: 'INV-003' },
    { id: '4', date: '2023-10-15', amount: '$29.99', status: 'failed', invoice: 'INV-004' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <>
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Heading size="md">Billing Information</Heading>
            <Button leftIcon={<EditIcon />} size="sm" variant="outline" onClick={onOpen}>
              Edit
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Billing Address */}
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" fontWeight="semibold">Billing Address</Text>
              <Box p={4} bg={tableStripedBg} borderRadius="md">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm">{billingAddress.name}</Text>
                  <Text fontSize="sm" color={textColor}>{billingAddress.address}</Text>
                  <Text fontSize="sm" color={textColor}>
                    {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}
                  </Text>
                  <Text fontSize="sm" color={textColor}>{billingAddress.country}</Text>
                </VStack>
              </Box>
            </VStack>

            <Divider />

            {/* Billing History */}
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="semibold">Recent Transactions</Text>
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </HStack>
              
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Invoice</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {billingHistory.map((transaction) => (
                      <Tr key={transaction.id}>
                        <Td>{transaction.date}</Td>
                        <Td fontWeight="semibold">{transaction.amount}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(transaction.status)} textTransform="capitalize">
                            {transaction.status}
                          </Badge>
                        </Td>
                        <Td>{transaction.invoice}</Td>
                        <Td>
                          <Button leftIcon={<DownloadIcon />} size="xs" variant="ghost">
                            Download
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Edit Billing Address Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Billing Address</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input defaultValue={billingAddress.name} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Address</FormLabel>
                <Input defaultValue={billingAddress.address} />
              </FormControl>
              <HStack spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel>City</FormLabel>
                  <Input defaultValue={billingAddress.city} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>State</FormLabel>
                  <Select defaultValue={billingAddress.state}>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    {/* Add more states */}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>ZIP Code</FormLabel>
                  <Input defaultValue={billingAddress.zipCode} />
                </FormControl>
              </HStack>
              <FormControl isRequired>
                <FormLabel>Country</FormLabel>
                <Select defaultValue="US">
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  {/* Add more countries */}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onClose}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BillingInformation; 
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
  Button,
  useColorModeValue,
  Badge,
  List,
  ListItem,
  ListIcon,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { CheckIcon, StarIcon } from '@chakra-ui/icons';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const UpgradeOptions: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const popularBg = useColorModeValue('blue.50', 'blue.900');
  const popularBorder = useColorModeValue('blue.200', 'blue.600');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      period: 'month',
      description: 'Perfect for getting started',
      features: [
        '5 workouts per month',
        'Basic exercise library',
        'Email support',
        'Mobile app access',
      ],
      current: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      period: 'month',
      description: 'Most popular choice for coaches',
      features: [
        'Unlimited workouts',
        'Full exercise library',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'Athlete progress tracking',
      ],
      popular: true,
      current: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      period: 'month',
      description: 'For large teams and organizations',
      features: [
        'Everything in Pro',
        'Team management',
        'White-label solution',
        'API access',
        'Dedicated support',
        'Custom integrations',
        'Advanced reporting',
      ],
      current: false,
    },
  ];

  return (
    <Card bg={cardBg} shadow="sm">
      <CardHeader>
        <Heading size="md">Upgrade Options</Heading>
        <Text fontSize="sm" color={textColor} mt={2}>
          Choose the plan that best fits your needs
        </Text>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {plans.map((plan) => (
            <Box
              key={plan.id}
              p={6}
              border="2px"
              borderColor={plan.popular ? popularBorder : borderColor}
              borderRadius="lg"
              bg={plan.popular ? popularBg : 'transparent'}
              position="relative"
            >
              {plan.popular && (
                <Badge
                  colorScheme="blue"
                  position="absolute"
                  top="-10px"
                  left="50%"
                  transform="translateX(-50%)"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  <HStack spacing={1}>
                    <StarIcon boxSize={3} />
                    <Text>Most Popular</Text>
                  </HStack>
                </Badge>
              )}

              <VStack spacing={4} align="stretch">
                <VStack spacing={2} align="center">
                  <Heading size="lg">{plan.name}</Heading>
                  <Text fontSize="sm" color={textColor} textAlign="center">
                    {plan.description}
                  </Text>
                  <HStack align="baseline">
                    <Text fontSize="3xl" fontWeight="bold">
                      ${plan.price}
                    </Text>
                    <Text fontSize="md" color={textColor}>
                      /{plan.period}
                    </Text>
                  </HStack>
                </VStack>

                <Divider />

                <List spacing={3}>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index}>
                      <HStack>
                        <ListIcon as={CheckIcon} color="green.500" />
                        <Text fontSize="sm">{feature}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>

                <Button
                  colorScheme={plan.popular ? 'blue' : 'gray'}
                  variant={plan.current ? 'outline' : 'solid'}
                  size="md"
                  isDisabled={plan.current}
                  mt={4}
                >
                  {plan.current ? 'Current Plan' : 
                   plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>

        <Divider my={8} />

        {/* Additional Options */}
        <VStack spacing={4} align="stretch">
          <Heading size="sm">Need Something Different?</Heading>
          <Text fontSize="sm" color={textColor}>
            We offer custom solutions for educational institutions, large organizations, 
            and enterprise customers. Contact our sales team to discuss your specific needs.
          </Text>
          <HStack spacing={3}>
            <Button variant="outline" size="sm">
              Contact Sales
            </Button>
            <Button variant="outline" size="sm">
              View All Features
            </Button>
            <Button variant="outline" size="sm">
              Calculate Savings
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default UpgradeOptions; 
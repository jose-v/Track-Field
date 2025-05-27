import {
  Box,
  VStack,
  Heading,
  Text,
  Divider,
  SimpleGrid,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import Feature from './Feature';
import { FaChartLine, FaUsers, FaTrophy } from 'react-icons/fa';

const FeaturesSection = () => {
  const textColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = 'var(--accent)';

  return (
    <Box py={{ base: 16, md: 24 }} bg={useColorModeValue('white', 'gray.900')} width="100vw">
      <Box maxW={{ base: "95%", md: "90%" }} mx="auto" px={{ base: 4, md: 8 }}>
        <VStack spacing={{ base: 12, md: 16 }}>
          <VStack spacing={4} textAlign="center" maxW="800px" mx="auto">
            <Heading
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              fontWeight="bold"
              color={textColor}
              letterSpacing="tight"
            >
              Why Athletes Choose Our Platform
            </Heading>
            <Text fontSize={{ base: "md", md: "lg", lg: "xl" }} color={subtitleColor} maxW="3xl">
              Innovative tools designed to transform your training experience and elevate your performance
            </Text>
            <Divider maxW="100px" borderColor={accentColor} borderWidth={2} my={4} />
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 8, md: 12 }} w="full">
            <Feature
              icon={<Icon as={FaChartLine} w={10} h={10} color="primary.500" />}
              title="Advanced Analytics"
              text="Track your performance metrics with intuitive visualizations. Identify trends and opportunities for improvement in your training."
            />
            <Feature
              icon={<Icon as={FaUsers} w={10} h={10} color="primary.500" />}
              title="Expert Coaching"
              text="Connect directly with professional coaches who provide personalized feedback and customized training programs."
            />
            <Feature
              icon={<Icon as={FaTrophy} w={10} h={10} color="primary.500" />}
              title="Competition Ready"
              text="Prepare for competitions with specialized training plans and performance tracking tools designed for peak performance."
            />
          </SimpleGrid>
        </VStack>
      </Box>
    </Box>
  );
};

export default FeaturesSection;

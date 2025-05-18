import {
  Box,
  Stack,
  VStack,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';

const CTASection = () => {
  return (
    <Box py={{ base: 16, md: 24 }} bg="accent.400" width="100vw">
      <Box maxW={{ base: "95%", md: "90%" }} mx="auto" px={{ base: 4, md: 8 }}>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={10} align="center" justify="space-between">
          <VStack spacing={4} align={{ base: 'center', md: 'start' }} maxW="600px">
            <Heading
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              color="primary.500"
            >
              Ready to Transform Your Athletic Performance?
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.900" maxW="2xl">
              Join thousands of athletes who are already breaking personal records with our platform.
            </Text>
          </VStack>
          <Button
            as={RouterLink}
            to="/signup"
            size="lg"
            variant="solid"
            colorScheme="primary"
            px={10}
            py={7}
            fontSize="md"
            fontWeight="bold"
            borderRadius="md"
            rightIcon={<FaChevronRight />}
            transition="all 0.3s"
            className="btn-primary"
          >
            Start Your Free Trial
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default CTASection;

import {
  Box,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react';
import TestimonialCard from './TestimonialCard';

const TestimonialsSection = () => {
  const textColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box py={{ base: 16, md: 24 }} bg="background" width="100vw">
      <Box maxW={{ base: "95%", md: "90%" }} mx="auto" px={{ base: 4, md: 8 }}>
        <VStack spacing={10} textAlign="center">
          <Heading
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="bold"
            color={textColor}
          >
            Success Stories
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color={subtitleColor} maxW="2xl">
            Hear from athletes who have transformed their performance using our platform
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} w="full" pt={6}>
            <TestimonialCard 
              name="Michael Johnson"
              role="Sprinter"
              image="/images/testimonial1.jpg"
              content="The analytics helped me identify weaknesses in my sprint technique. After three months, I improved my 100m time by 0.5 seconds."
            />
            <TestimonialCard 
              name="Sarah Williams"
              role="High Jumper"
              image="/images/testimonial2.jpg"
              content="The connection with coaches has been invaluable. My technique has completely transformed thanks to the personalized feedback."
            />
            <TestimonialCard 
              name="David Rodriguez"
              role="Distance Runner"
              image="/images/testimonial3.jpg"
              content="The training plans are excellent. I've been able to train more efficiently and reduce my marathon time by 12 minutes."
            />
          </SimpleGrid>
        </VStack>
      </Box>
    </Box>
  );
};

export default TestimonialsSection;

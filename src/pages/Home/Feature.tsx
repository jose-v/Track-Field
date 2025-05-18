import { Box, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';

const Feature = ({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <VStack
      p={8}
      bg={cardBg}
      borderRadius="lg"
      boxShadow="md"
      align="flex-start"
      spacing={5}
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)', 
        boxShadow: 'lg',
        bg: hoverBg,
      }}
      height="100%"
      className="card"
    >
      <Box 
        bg="blue.50" 
        p={3} 
        borderRadius="lg"
        color="blue.500"
      >
        {icon}
      </Box>
      <Heading size="md" color={textColor}>{title}</Heading>
      <Text color={subtitleColor}>{text}</Text>
    </VStack>
  );
};

export default Feature;

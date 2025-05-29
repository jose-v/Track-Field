import React from 'react';
import { VStack, Text, Divider, useColorModeValue, HStack, Icon } from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';

interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  name, 
  role, 
  content 
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  
  return (
    <VStack
      className="card"
      p={8}
      bg={cardBg}
      borderRadius="lg"
      align="center"
      spacing={5}
      position="relative"
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)'
      }}
    >
      <HStack spacing={1}>
        {[...Array(5)].map((_, i) => (
          <Icon key={i} as={FaStar} color="yellow.400" boxSize={5} />
        ))}
      </HStack>
      <Text fontSize="lg" fontStyle="italic" textAlign="center" color={textColor}>
        "{content}"
      </Text>
      <Divider />
      <VStack spacing={1}>
        <Text fontWeight="bold" color={textColor}>{name}</Text>
        <Text fontSize="sm" color="gray.500">{role}</Text>
      </VStack>
    </VStack>
  );
};

export default TestimonialCard;

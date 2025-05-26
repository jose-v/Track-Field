import { VStack, Text, Divider, HStack, Image, useColorModeValue } from '@chakra-ui/react';

// Local fallback image
const LOCAL_FALLBACK_IMAGE = './images/athlete-avatar.jpg';

const TestimonialCard = ({ 
  name, 
  role, 
  image, 
  content 
}: { 
  name: string; 
  role: string; 
  image: string; 
  content: string 
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  
  return (
    <VStack
      className="card"
      p={8}
      bg={cardBg}
      borderRadius="lg"
      boxShadow="md"
      align="center"
      spacing={5}
      position="relative"
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)', 
        boxShadow: 'lg' 
      }}
    >
      <Text fontSize="lg" fontStyle="italic" textAlign="center" color={textColor}>
        "{content}"
      </Text>
      <Divider />
      <HStack spacing={4}>
        <Image
          src={image || LOCAL_FALLBACK_IMAGE}
          alt={name}
          borderRadius="full"
          boxSize="50px"
          objectFit="cover"
          fallbackSrc={LOCAL_FALLBACK_IMAGE}
        />
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" color={textColor}>{name}</Text>
          <Text fontSize="sm" color="gray.500">{role}</Text>
        </VStack>
      </HStack>
    </VStack>
  );
};

export default TestimonialCard;

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
  Divider
} from '@chakra-ui/react';

interface SettingCardProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  isLoading?: boolean;
}

export const SettingCard: React.FC<SettingCardProps> = ({
  title,
  description,
  icon,
  children,
  isLoading = false
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="sm"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-1px)',
      }}
      transition="all 0.2s"
      opacity={isLoading ? 0.6 : 1}
      pointerEvents={isLoading ? 'none' : 'auto'}
    >
      {title && (
        <>
          <CardHeader pb={3}>
            <HStack spacing={3} align="center">
              {icon && (
                <Icon
                  as={icon}
                  boxSize={5}
                  color={iconColor}
                />
              )}
              <VStack align="start" spacing={1} flex="1">
                <Heading size="md" color={headerTextColor}>
                  {title}
                </Heading>
                {description && (
                  <Text fontSize="sm" color={descriptionColor}>
                    {description}
                  </Text>
                )}
              </VStack>
            </HStack>
          </CardHeader>
          
          <Divider />
        </>
      )}
      
      <CardBody pt={title ? 4 : 6}>
        {children}
      </CardBody>
    </Card>
  );
}; 
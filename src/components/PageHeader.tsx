import React from 'react';
import { Box, Heading, Text, Icon, useColorModeValue, VStack, HStack } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: IconType;
  showOnDesktop?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  icon,
  showOnDesktop = true 
}) => {
  const headerSubtextColor = useColorModeValue('gray.600', 'gray.300');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  if (!showOnDesktop) {
    return null;
  }

  return (
    <Box display={{ base: "none", md: "block" }} px={{ base: 4, md: 6 }} pt={6}>
      <VStack spacing={2} align="start" w="100%" mb={4}>
        <HStack spacing={3} align="center">
          {icon && (
            <Icon
              as={icon}
              boxSize={6}
              color={iconColor}
            />
          )}
          <Heading size="lg" color={headerTextColor}>
            {title}
          </Heading>
        </HStack>
        <Text color={headerSubtextColor} fontSize="md">
          {subtitle}
        </Text>
      </VStack>
    </Box>
  );
};

export default PageHeader; 
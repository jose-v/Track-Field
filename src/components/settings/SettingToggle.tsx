import React from 'react';
import {
  FormControl,
  FormLabel,
  Switch,
  Text,
  VStack,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';

interface SettingToggleProps {
  label: string;
  description?: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  isChecked,
  onChange,
  isDisabled = false,
  size = 'md'
}) => {
  const labelColor = useColorModeValue('gray.800', 'white');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <FormControl>
      <HStack justify="space-between" align="start" spacing={4}>
        <VStack align="start" spacing={1} flex="1">
          <FormLabel
            htmlFor={`toggle-${label.replace(/\s+/g, '-').toLowerCase()}`}
            mb={0}
            fontSize={size === 'sm' ? 'sm' : 'md'}
            fontWeight="medium"
            color={labelColor}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
          >
            {label}
          </FormLabel>
          {description && (
            <Text
              fontSize="sm"
              color={descriptionColor}
              lineHeight="short"
            >
              {description}
            </Text>
          )}
        </VStack>
        
        <Switch
          id={`toggle-${label.replace(/\s+/g, '-').toLowerCase()}`}
          isChecked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          isDisabled={isDisabled}
          size={size}
          colorScheme="blue"
        />
      </HStack>
    </FormControl>
  );
}; 
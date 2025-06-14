import React from 'react';
import {
  FormControl,
  FormLabel,
  Select,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';

interface SettingSelectOption {
  value: string;
  label: string;
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: SettingSelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SettingSelect: React.FC<SettingSelectProps> = ({
  label,
  description,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  isDisabled = false,
  size = 'md'
}) => {
  const labelColor = useColorModeValue('gray.800', 'white');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');
  const selectBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <FormControl>
      <VStack align="start" spacing={2}>
        <VStack align="start" spacing={1}>
          <FormLabel
            mb={0}
            fontSize={size === 'sm' ? 'sm' : 'md'}
            fontWeight="medium"
            color={labelColor}
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
        
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          isDisabled={isDisabled}
          size={size}
          bg={selectBg}
          borderColor={borderColor}
          _hover={{
            borderColor: useColorModeValue('gray.300', 'gray.500')
          }}
          _focus={{
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px blue.500'
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </VStack>
    </FormControl>
  );
}; 
import React from 'react';
import TimePicker from 'react-time-picker';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { useTimeFormat } from '../contexts/TimeFormatContext';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

interface TimePickerInputProps {
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  isInvalid?: boolean;
}

export const TimePickerInput: React.FC<TimePickerInputProps> = ({
  value,
  onChange,
  placeholder,
  size = 'md',
  isDisabled = false,
  isInvalid = false,
}) => {
  const { timeFormat } = useTimeFormat();
  
  // Color mode values to match Chakra UI styling
  const borderColor = useColorModeValue('gray.300', 'gray.500');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.400');
  const invalidBorderColor = useColorModeValue('red.500', 'red.400');
  const bg = useColorModeValue('white', 'gray.600');
  const textColor = useColorModeValue('gray.900', 'white');
  
  // Size mappings
  const sizeMap = {
    sm: { height: '32px', fontSize: '14px', padding: '4px 8px' },
    md: { height: '40px', fontSize: '16px', padding: '8px 12px' },
    lg: { height: '48px', fontSize: '18px', padding: '12px 16px' }
  };
  
  const sizeStyle = sizeMap[size];
  
  return (
    <Box
      className="chakra-time-picker"
      sx={{
        '& .react-time-picker': {
          width: '100%',
          border: `2px solid ${isInvalid ? invalidBorderColor : borderColor}`,
          borderRadius: '6px',
          backgroundColor: bg,
          color: textColor,
          height: sizeStyle.height,
          fontSize: sizeStyle.fontSize,
          transition: 'border-color 0.2s',
          '&:hover': {
            borderColor: focusBorderColor,
          },
          '&:focus-within': {
            borderColor: focusBorderColor,
            boxShadow: `0 0 0 1px ${focusBorderColor}`,
          },
        },
        '& .react-time-picker__wrapper': {
          border: 'none',
          padding: sizeStyle.padding,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        },
        '& .react-time-picker__inputGroup': {
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        },
        '& .react-time-picker__inputGroup__input': {
          border: 'none',
          backgroundColor: 'transparent',
          color: 'inherit',
          fontSize: 'inherit',
          padding: '0',
          margin: '0',
          width: 'auto',
          minWidth: '25px',
          textAlign: 'center',
          cursor: 'text',
          '&:focus': {
            outline: 'none',
            backgroundColor: useColorModeValue('blue.50', 'blue.900'),
            borderRadius: '2px',
          },
          '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
          '&[type=number]': {
            MozAppearance: 'textfield',
          },
        },
        '& .react-time-picker__inputGroup__divider': {
          color: 'inherit',
          padding: '0 2px',
        },
        '& .react-time-picker__inputGroup__amPm': {
          backgroundColor: useColorModeValue('gray.100', 'gray.700'),
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
          padding: '2px 6px',
          marginLeft: '8px',
          fontSize: '12px',
          fontWeight: '500',
        },
        '& .react-time-picker__button': {
          border: 'none',
          backgroundColor: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: useColorModeValue('gray.100', 'gray.700'),
          },
        },
      }}
    >
      <TimePicker
        onChange={onChange}
        value={value}
        disabled={isDisabled}
        clearIcon={null}
        clockIcon={null}
        disableClock={true}
        format={timeFormat === '24' ? 'HH:mm' : 'h:mm a'}
        locale="en-US"
        maxDetail="minute"
        autoFocus={false}
        required={false}
        nativeInputAriaLabel="Time"
      />
    </Box>
  );
}; 
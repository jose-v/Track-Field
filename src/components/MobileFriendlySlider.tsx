import React from 'react';
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderProps,
} from '@chakra-ui/react';

interface MobileFriendlySliderProps extends SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  colorScheme?: string;
}

export const MobileFriendlySlider: React.FC<MobileFriendlySliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  colorScheme = 'blue',
  ...props
}) => {
  return (
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        colorScheme={colorScheme}
        {...props}
      // Optimize for touch interactions
      focusThumbOnChange={false}
      // Smooth touch handling
      style={{
        touchAction: 'manipulation', // Allow slider dragging
        userSelect: 'none',   // Prevent text selection
      }}
      >
      <SliderTrack h={3} borderRadius="full">
        <SliderFilledTrack borderRadius="full" />
        </SliderTrack>
        <SliderThumb 
        boxSize={7}
        borderRadius="full"
        boxShadow="lg"
        // Better touch target
        _active={{
          transform: 'scale(1.1)',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
          style={{
          touchAction: 'manipulation',
          cursor: 'grab',
          }}
        />
      </Slider>
  );
}; 
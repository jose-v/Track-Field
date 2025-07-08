import React, { useRef, useState, useCallback } from 'react';
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return value;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + percentage * (max - min);
      
      // Round to nearest step
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, value]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    const newValue = calculateValueFromPosition(touch.clientX);
    onChange(newValue);
  }, [calculateValueFromPosition, onChange]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newValue = calculateValueFromPosition(touch.clientX);
    onChange(newValue);
  }, [isDragging, calculateValueFromPosition, onChange]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const newValue = calculateValueFromPosition(e.clientX);
    onChange(newValue);
  }, [calculateValueFromPosition, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newValue = calculateValueFromPosition(e.clientX);
    onChange(newValue);
  }, [isDragging, calculateValueFromPosition, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={sliderRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{
        touchAction: 'none', // Prevent default touch behaviors
        userSelect: 'none',   // Prevent text selection
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        colorScheme={colorScheme}
        {...props}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb 
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        />
      </Slider>
    </div>
  );
}; 
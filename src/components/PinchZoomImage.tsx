import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';

interface PinchZoomImageProps {
  src: string;
  alt: string;
  maxW?: string | number;
  maxH?: string | number;
  borderRadius?: string;
  shadow?: string;
}

export const PinchZoomImage: React.FC<PinchZoomImageProps> = ({
  src,
  alt,
  maxW = "90%",
  maxH = "80vh",
  borderRadius = "md",
  shadow = "lg",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const bg = useColorModeValue('white', 'gray.800');

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Reset transform to initial state
  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  // Constrain translation to keep image within bounds
  const constrainTranslation = useCallback((x: number, y: number, currentScale: number) => {
    if (!containerRef.current || !imageRef.current) return { x, y };

    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    const scaledWidth = imageRect.width * currentScale;
    const scaledHeight = imageRect.height * currentScale;
    
    const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
    
    return {
      x: Math.max(-maxTranslateX, Math.min(maxTranslateX, x)),
      y: Math.max(-maxTranslateY, Math.min(maxTranslateY, y)),
    };
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - start drag
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - translateX,
        y: e.touches[0].clientY - translateY,
      });
    } else if (e.touches.length === 2) {
      // Two touches - start pinch
      setIsDragging(false);
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    }
  }, [translateX, translateY]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging && scale > 1) {
      // Single touch drag (only when zoomed in)
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      const constrained = constrainTranslation(newX, newY, scale);
      setTranslateX(constrained.x);
      setTranslateY(constrained.y);
    } else if (e.touches.length === 2) {
      // Two touch pinch
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      if (lastTouchDistance > 0) {
        const scaleFactor = distance / lastTouchDistance;
        const newScale = Math.max(0.5, Math.min(4, scale * scaleFactor));
        
        setScale(newScale);
        setLastTouchDistance(distance);
      }
    }
  }, [isDragging, scale, dragStart, lastTouchDistance, constrainTranslation]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLastTouchDistance(0);
    
    // If zoomed out beyond normal, reset to 1x
    if (scale < 1) {
      resetTransform();
    }
  }, [scale, resetTransform]);

  // Handle mouse wheel for desktop zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(4, scale * scaleFactor));
    
    setScale(newScale);
    
    // Reset position if zooming out to 1x or less
    if (newScale <= 1) {
      setTranslateX(0);
      setTranslateY(0);
    }
  }, [scale]);

  // Handle mouse drag for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - translateX,
        y: e.clientY - translateY,
      });
    }
  }, [scale, translateX, translateY]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const constrained = constrainTranslation(newX, newY, scale);
      setTranslateX(constrained.x);
      setTranslateY(constrained.y);
    }
  }, [isDragging, scale, dragStart, constrainTranslation]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Double tap to zoom (mobile)
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      if (scale === 1) {
        setScale(2);
      } else {
        resetTransform();
      }
    }
    setLastTap(now);
  }, [lastTap, scale, resetTransform]);

  // Double click to zoom (desktop)
  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetTransform();
    }
  }, [scale, resetTransform]);

  return (
    <Box
      ref={containerRef}
      w="100%"
      h="100%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
      bg={bg}
      borderRadius={borderRadius}
      position="relative"
      userSelect="none"
      cursor={scale > 1 ? 'grab' : 'zoom-in'}
      _active={{
        cursor: scale > 1 && isDragging ? 'grabbing' : undefined,
      }}
    >
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        maxW={maxW}
        maxH={maxH}
        objectFit="contain"
        borderRadius={borderRadius}
        shadow={shadow}
        transform={`scale(${scale}) translate(${translateX}px, ${translateY}px)`}
        transformOrigin="center"
        transition={isDragging ? 'none' : 'transform 0.2s ease-out'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleDoubleTap}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        draggable={false}
        style={{
          touchAction: 'none',
        }}
      />
      
      {/* Reset button when zoomed */}
      {scale !== 1 && (
        <Box
          position="absolute"
          top={4}
          right={4}
          bg="blackAlpha.700"
          color="white"
          px={3}
          py={1}
          borderRadius="md"
          fontSize="sm"
          cursor="pointer"
          onClick={resetTransform}
          _hover={{ bg: 'blackAlpha.800' }}
        >
          Reset Zoom
        </Box>
      )}
    </Box>
  );
}; 
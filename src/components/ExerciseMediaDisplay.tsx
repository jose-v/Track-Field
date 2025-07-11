import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  IconButton,
  Icon,
  Text,
  Skeleton,
  useColorModeValue,
  AspectRatio,
  HStack,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { FaPlay, FaVideo, FaImage, FaSpinner } from 'react-icons/fa';
import { getBestExerciseMedia } from '../services/exerciseMediaService';

interface ExerciseMediaDisplayProps {
  exerciseName: string;
  onVideoClick?: (videoUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
  priority?: 'image' | 'animation' | 'video';
}

export const ExerciseMediaDisplay: React.FC<ExerciseMediaDisplayProps> = ({
  exerciseName,
  onVideoClick,
  size = 'md',
  showControls = true,
  priority = 'image'
}) => {
  const [mediaData, setMediaData] = useState<{
    type: 'image' | 'animation' | 'video' | 'none';
    url: string | null;
    source: 'database' | 'local' | 'legacy' | 'none';
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Theme colors
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const overlayBg = useColorModeValue('blackAlpha.600', 'blackAlpha.700');

  // Size configurations with responsive height
  const sizeConfig = {
    sm: { height: { base: '100px', md: '120px' }, iconSize: 'sm' as const },
    md: { height: { base: '150px', md: '200px' }, iconSize: 'md' as const },
    lg: { height: { base: '200px', md: '300px' }, iconSize: 'lg' as const }
  };

  useEffect(() => {
    const loadMedia = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const media = await getBestExerciseMedia(exerciseName);
        setMediaData(media);
      } catch (error) {
        console.error('Error loading exercise media:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (exerciseName) {
      loadMedia();
    }
  }, [exerciseName]);

  const handleImageError = () => {
    setHasError(true);
  };

  const handleVideoPlay = () => {
    if (mediaData?.url && onVideoClick) {
      onVideoClick(mediaData.url);
    }
    setIsPlaying(true);
  };

  const getMediaIcon = () => {
    if (!mediaData || mediaData.type === 'none') return FaImage;
    
    switch (mediaData.type) {
      case 'video':
        return FaVideo;
      case 'animation':
        return FaSpinner;
      case 'image':
      default:
        return FaImage;
    }
  };

  const getSourceBadge = () => {
    // Hide source badges in production for cleaner UI
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <Box position="relative">
        <AspectRatio ratio={16/9} width="100%">
          <Skeleton 
            height={sizeConfig[size].height}
            borderRadius="lg"
            startColor={bgColor}
            endColor={borderColor}
          />
        </AspectRatio>
      </Box>
    );
  }

  // No media available
  if (!mediaData || mediaData.type === 'none' || hasError || !mediaData.url) {
    return (
      <Box 
        position="relative"
        width="100%"
        height={sizeConfig[size].height}
        bg={bgColor}
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <Icon as={FaImage} boxSize={8} color="gray.400" mb={2} />
        <Text fontSize="sm" color="gray.500" textAlign="center">
          No media available
        </Text>
        <Text fontSize="xs" color="gray.400" textAlign="center">
          {exerciseName}
        </Text>
      </Box>
    );
  }

  // Video content
  if (mediaData.type === 'video') {
    return (
      <Box position="relative" width="100%">
        <AspectRatio ratio={16/9} width="100%">
          <Box
            bg={bgColor}
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            cursor="pointer"
            onClick={handleVideoPlay}
            _hover={{ transform: 'scale(1.02)' }}
            transition="transform 0.2s"
          >
            {/* Video thumbnail placeholder */}
            <Box
              position="absolute"
              inset={0}
              bg="gray.900"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FaVideo} boxSize={12} color="white" opacity={0.7} />
            </Box>
            
            {/* Play button overlay */}
            <Box
              position="absolute"
              inset={0}
              bg={overlayBg}
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={isPlaying ? 0 : 1}
              transition="opacity 0.2s"
            >
              <IconButton
                aria-label="Play video"
                icon={<Icon as={FaPlay} />}
                size={sizeConfig[size].iconSize}
                colorScheme="blue"
                variant="solid"
                borderRadius="full"
                _hover={{ transform: 'scale(1.1)' }}
              />
            </Box>
            
            {getSourceBadge()}
          </Box>
        </AspectRatio>
        
        {showControls && (
          <HStack mt={2} justify="center">
            <Tooltip label="Play video tutorial">
              <IconButton
                aria-label="Play video"
                icon={<Icon as={FaPlay} />}
                size="sm"
                variant="outline"
                onClick={handleVideoPlay}
              />
            </Tooltip>
          </HStack>
        )}
      </Box>
    );
  }

  // Image or Animation content
  return (
    <Box position="relative" width="100%">
      <AspectRatio ratio={16/9} width="100%">
        <Box position="relative">
          <Image
            src={mediaData.url}
            alt={`${exerciseName} demonstration`}
            objectFit="contain"
            width="100%"
            height="100%"
            borderRadius="lg"
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Media type indicator */}
          {mediaData.type === 'animation' && (
            <Badge
              colorScheme="purple"
              position="absolute"
              bottom={2}
              left={2}
              size="xs"
            >
              GIF
            </Badge>
          )}
          
          {getSourceBadge()}
        </Box>
      </AspectRatio>
    </Box>
  );
}; 
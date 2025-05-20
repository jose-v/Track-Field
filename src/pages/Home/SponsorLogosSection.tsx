import { Box, Flex, Text, Image, useBreakpointValue, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { useRef, useState } from 'react';

// List of sponsor logos with their names and local image paths
const sponsorLogos = [
  { name: 'Nike', image: './images/sponsors/nike.png' },
  { name: 'Adidas', image: './images/sponsors/adidas.png' },
  { name: 'Under Armour', image: './images/sponsors/under-armour.png' },
  { name: 'New Balance', image: './images/sponsors/new-balance.png' },
  { name: 'Puma', image: './images/sponsors/puma.png' },
  { name: 'Asics', image: './images/sponsors/asics.png' },
  { name: 'Brooks', image: './images/sponsors/brooks.png' },
  { name: 'Reebok', image: './images/sponsors/reebok.png' },
  { name: 'Mizuno', image: './images/sponsors/mizuno.png' },
  { name: 'Gatorade', image: './images/sponsors/gatorade.png' },
  { name: 'Harvard University', image: './images/sponsors/harvard.png' },
  { name: 'Stanford University', image: './images/sponsors/stanford.png' },
  { name: 'UCLA', image: './images/sponsors/ucla.png' },
  { name: 'USA Track & Field', image: './images/sponsors/usatf.png' },
  { name: 'NCAA', image: './images/sponsors/ncaa.png' }
];

// Fallback image path
const FALLBACK_IMAGE = './images/placeholder-logo.png';

const SponsorLogosSection = () => {
  const { colorMode } = useColorMode();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [imgLoadErrors, setImgLoadErrors] = useState<Record<string, boolean>>({});
  
  // Calculate how many logos to show based on screen size
  const logosToShow = useBreakpointValue({ base: 3, md: 5, lg: 6 }) || 5;
  const logoSize = useBreakpointValue({ base: "90px", md: "110px", lg: "130px" }) || "110px";
  
  // Dynamic color values based on color mode
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const logoOpacity = useColorModeValue(0.65, 0.7); // Lower opacity to make logos lighter
  const hoverOpacity = useColorModeValue(0.9, 0.9); // Also adjust hover opacity
  
  // Calculate animation duration based on the number of logos
  const animationDuration = `${sponsorLogos.length * 3}s`;

  // Create a uniform filter for consistent appearance
  const getImageFilter = () => {
    if (colorMode === 'dark') {
      return 'grayscale(90%) brightness(2.2) contrast(0.7) invert(1)';
    }
    return 'grayscale(90%) brightness(0.95) contrast(0.8)';
  };

  // Handle image load errors
  const handleImageError = (logoName: string) => {
    setImgLoadErrors(prev => ({
      ...prev,
      [logoName]: true
    }));
    console.warn(`Failed to load logo for ${logoName}, using fallback`);
  };

  // Get image source with fallback
  const getImageSrc = (logo: { name: string, image: string }) => {
    return imgLoadErrors[logo.name] ? FALLBACK_IMAGE : logo.image;
  };

  return (
    <Box 
      py={12} 
      bg={bgColor}
      w="100%"
      borderTop="1px solid" 
      borderBottom="1px solid" 
      borderColor={borderColor}
    >
      <Box maxW="1200px" mx="auto" px={4}>
        <Text 
          textAlign="center" 
          fontSize="sm" 
          fontWeight="medium" 
          color={textColor}
          textTransform="uppercase" 
          letterSpacing="wider"
          mb={6}
        >
          Trusted by Athletes and Universities Worldwide
        </Text>
        
        <Box 
          position="relative" 
          overflow="hidden" 
          w="100%" 
          h="150px"
          sx={{
            maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          }}
        >
          <Flex 
            position="absolute"
            w="max-content"
            h="100%"
            alignItems="center"
            px={4}
            sx={{
              animation: `scrollLogos ${animationDuration} linear infinite`,
              '@keyframes scrollLogos': {
                '0%': { transform: 'translateX(0)' },
                '100%': { transform: `translateX(-${sponsorLogos.length * 176}px)` } // 176px = logo width (160px) + margin (8px*2)
              }
            }}
          >
            {/* Original logos */}
            {sponsorLogos.map((logo, index) => (
              <Box 
                key={`${logo.name}-${index}`}
                mx={8}
                h="130px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minW="160px"
                p={3}
              >
                <Image
                  src={getImageSrc(logo)}
                  alt={`${logo.name} logo`}
                  boxSize={logoSize}
                  objectFit="contain"
                  filter={getImageFilter()}
                  opacity={logoOpacity}
                  onError={() => handleImageError(logo.name)}
                  fallbackSrc={FALLBACK_IMAGE}
                  _hover={{
                    opacity: hoverOpacity,
                    transform: "scale(1.1)",
                    transition: "all 0.3s ease",
                  }}
                  transition="all 0.3s ease"
                  userSelect="none"
                  loading="eager"
                />
              </Box>
            ))}
            
            {/* Duplicated logos for seamless looping */}
            {sponsorLogos.map((logo, index) => (
              <Box 
                key={`${logo.name}-dup-${index}`}
                mx={8}
                h="130px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                minW="160px"
                p={3}
              >
                <Image
                  src={getImageSrc(logo)}
                  alt={`${logo.name} logo`}
                  boxSize={logoSize}
                  objectFit="contain"
                  filter={getImageFilter()}
                  opacity={logoOpacity}
                  onError={() => handleImageError(logo.name)}
                  fallbackSrc={FALLBACK_IMAGE}
                  _hover={{
                    opacity: hoverOpacity,
                    transform: "scale(1.1)",
                    transition: "all 0.3s ease",
                  }}
                  transition="all 0.3s ease"
                  userSelect="none"
                  loading="eager"
                />
              </Box>
            ))}
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default SponsorLogosSection; 
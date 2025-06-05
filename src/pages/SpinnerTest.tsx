import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Switch,
  FormControl,
  FormLabel,
  Select,
  Code,
  Grid,
  GridItem,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { LuArrowLeft, LuPlay, LuPause } from 'react-icons/lu';
import '../styles/olympic-spinner.css';

type SpinnerVariation = 'sliding' | 'logo' | 'rotation' | 'pulse' | 'bounce' | 'morph';

interface OlympicSpinnerProps {
  variation: SpinnerVariation;
  darkMode?: boolean;
  speed?: 'slow' | 'normal' | 'fast';
}

const OlympicSpinner: React.FC<OlympicSpinnerProps> = ({ 
  variation, 
  darkMode = false, 
  speed = 'normal' 
}) => {
  const getColors = () => {
    if (darkMode) {
      return [
        '#4A9EFF', // Lighter blue
        '#FFD700', // Gold
        '#50C878', // Emerald green
        '#FF6B6B', // Coral red
        '#E2E8F0'  // Light gray instead of black
      ];
    }
    return [
      '#0081C8', // Olympic blue
      '#F4C300', // Olympic yellow
      '#009F3D', // Olympic green
      '#DF0024', // Olympic red
      '#000000'  // Olympic black
    ];
  };

  const getSpeedClass = () => {
    const speedMap = {
      slow: 'olympic-slow',
      normal: '',
      fast: 'olympic-fast'
    };
    return speedMap[speed];
  };

  const colors = getColors();
  const speedClass = getSpeedClass();
  const containerClass = `olympic-loader-${variation} ${speedClass}`;
  const ringClass = `olympic-ring-${variation}`;

  return (
    <div className={containerClass}>
      {colors.map((color, index) => (
        <span
          key={index}
          className={ringClass}
          style={{
            borderColor: color,
          }}
        />
      ))}
    </div>
  );
};

const SpinnerTest: React.FC = () => {
  const [selectedVariation, setSelectedVariation] = useState<SpinnerVariation>('sliding');
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentDemo, setCurrentDemo] = useState(0);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const isDarkMode = useColorModeValue(false, true);

  const spinnerVariations = [
    {
      key: 'sliding' as SpinnerVariation,
      name: 'Sliding Rings',
      description: 'Rings slide left and right from center position',
      isNew: true
    },
    {
      key: 'logo' as SpinnerVariation,
      name: 'Olympic Logo Formation',
      description: 'Rings form the actual Olympic logo layout',
      isNew: true
    },
    {
      key: 'rotation' as SpinnerVariation,
      name: 'Orbital Rotation',
      description: 'Rings rotate around a central point',
      isNew: true
    },
    {
      key: 'pulse' as SpinnerVariation,
      name: 'Pulsing Wave',
      description: 'Rings pulse in sequence like a wave',
      isNew: true
    },
    {
      key: 'bounce' as SpinnerVariation,
      name: 'Bouncing Rings',
      description: 'Classic bouncing animation (original)',
      isNew: false
    },
    {
      key: 'morph' as SpinnerVariation,
      name: 'Morphing Circles',
      description: 'Rings appear, scale, and disappear in sequence',
      isNew: true
    }
  ];

  // Auto-cycling demo
  React.useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % spinnerVariations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoPlay, spinnerVariations.length]);

  const currentVariation = spinnerVariations[currentDemo];

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="6xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Button
              as={RouterLink}
              to="/"
              leftIcon={<LuArrowLeft size="18px" />}
              variant="ghost"
              size="sm"
            >
              Back to Home
            </Button>
            
            <HStack>
              <Text fontSize="sm">Auto Demo:</Text>
              <Switch 
                isChecked={autoPlay} 
                onChange={(e) => setAutoPlay(e.target.checked)}
                colorScheme="blue"
              />
              <Button
                leftIcon={autoPlay ? <LuPause size="16px" /> : <LuPlay size="16px" />}
                size="sm"
                variant="ghost"
                onClick={() => setAutoPlay(!autoPlay)}
              >
                {autoPlay ? 'Pause' : 'Play'}
              </Button>
            </HStack>
          </HStack>

          <VStack spacing={4} align="center">
            <Heading color="blue.500">Olympic Spinner Variations</Heading>
            <Text color="gray.600" textAlign="center" maxW="2xl">
              Explore different Olympic-themed loading animations. From the classic bouncing rings to 
              the actual Olympic logo formation and creative sliding effects.
            </Text>
          </VStack>

          {/* Featured Demo */}
          <Card bg={cardBg} borderWidth="2px" borderColor="blue.200">
            <CardHeader>
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Heading size="lg">{currentVariation.name}</Heading>
                    {currentVariation.isNew && (
                      <Badge colorScheme="green" variant="solid">NEW</Badge>
                    )}
                  </HStack>
                  <Text color="gray.600">{currentVariation.description}</Text>
                </VStack>
                
                <HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentDemo((prev) => 
                      prev === 0 ? spinnerVariations.length - 1 : prev - 1
                    )}
                  >
                    ← Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentDemo((prev) => 
                      (prev + 1) % spinnerVariations.length
                    )}
                  >
                    Next →
                  </Button>
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody>
              <Box 
                border="1px" 
                borderColor="gray.200" 
                borderRadius="md" 
                p={12} 
                bg={useColorModeValue('gray.25', 'gray.750')}
                textAlign="center"
              >
                <OlympicSpinner 
                  variation={currentVariation.key}
                  darkMode={isDarkMode}
                />
              </Box>
              
              <HStack mt={4} justify="center" spacing={2}>
                {spinnerVariations.map((_, index) => (
                  <Box
                    key={index}
                    w={3}
                    h={3}
                    borderRadius="full"
                    bg={index === currentDemo ? 'blue.500' : 'gray.300'}
                    cursor="pointer"
                    onClick={() => setCurrentDemo(index)}
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.2)' }}
                  />
                ))}
              </HStack>
            </CardBody>
          </Card>

          {/* All Variations Grid */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">All Variations</Heading>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Click on any spinner to see it in action
              </Text>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
                {spinnerVariations.map((variant) => (
                  <GridItem key={variant.key}>
                    <Card 
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      cursor="pointer"
                      borderWidth="2px"
                      borderColor={selectedVariation === variant.key ? 'blue.300' : 'transparent'}
                      transition="all 0.2s"
                      _hover={{ 
                        borderColor: 'blue.200',
                        transform: 'translateY(-2px)',
                        shadow: 'md'
                      }}
                      onClick={() => setSelectedVariation(variant.key)}
                    >
                      <CardHeader pb={2}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">{variant.name}</Text>
                            {variant.isNew && (
                              <Badge size="sm" colorScheme="green">NEW</Badge>
                            )}
                          </VStack>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Box 
                          border="1px" 
                          borderColor="gray.200" 
                          borderRadius="md" 
                          p={6} 
                          bg="white"
                          h="120px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <OlympicSpinner 
                            variation={variant.key}
                            darkMode={false} // Always light in grid for consistency
                          />
                        </Box>
                        <Text fontSize="xs" color="gray.600" mt={2} textAlign="center">
                          {variant.description}
                        </Text>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            </CardBody>
          </Card>

          {/* Interactive Playground */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Interactive Playground</Heading>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Customize the selected spinner variation
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={6}>
                <HStack spacing={8} wrap="wrap">
                  <FormControl maxW="250px">
                    <FormLabel>Variation</FormLabel>
                    <Select 
                      value={selectedVariation} 
                      onChange={(e) => setSelectedVariation(e.target.value as SpinnerVariation)}
                    >
                      {spinnerVariations.map((variant) => (
                        <option key={variant.key} value={variant.key}>
                          {variant.name} {variant.isNew ? '(NEW)' : ''}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl maxW="200px">
                    <FormLabel>Theme</FormLabel>
                    <Select defaultValue={isDarkMode ? 'dark' : 'light'}>
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </Select>
                  </FormControl>
                </HStack>

                <Box 
                  border="1px" 
                  borderColor="gray.200" 
                  borderRadius="md" 
                  p={12} 
                  w="100%"
                  bg={useColorModeValue('gray.25', 'gray.750')}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  minH="140px"
                >
                  <OlympicSpinner 
                    variation={selectedVariation}
                    darkMode={isDarkMode}
                  />
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Usage Code */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Usage Code</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Text fontWeight="semibold">HTML Structure:</Text>
                <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap">
{`<div class="olympic-loader-${selectedVariation}">
  <span class="olympic-ring-${selectedVariation}"></span>
  <span class="olympic-ring-${selectedVariation}"></span>
  <span class="olympic-ring-${selectedVariation}"></span>
  <span class="olympic-ring-${selectedVariation}"></span>
  <span class="olympic-ring-${selectedVariation}"></span>
</div>`}
                </Code>

                <Text fontWeight="semibold">React Component:</Text>
                <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap">
{`<OlympicSpinner 
  variation="${selectedVariation}" 
  darkMode={${isDarkMode}} 
/>`}
                </Code>
              </VStack>
            </CardBody>
          </Card>

          {/* Animation Details */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Animation Highlights</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                <Box>
                  <Text fontWeight="bold" mb={2}>🎯 Sliding Rings</Text>
                  <Text fontSize="sm" color="gray.600">
                    Rings start from center and slide to left/right positions with staggered timing, 
                    creating a dynamic spreading effect.
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>🏅 Olympic Logo Formation</Text>
                  <Text fontSize="sm" color="gray.600">
                    Rings emerge from center and move to their authentic Olympic logo positions, 
                    creating the iconic interlocked pattern.
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>🌀 Orbital Rotation</Text>
                  <Text fontSize="sm" color="gray.600">
                    Rings orbit around a central point with different timing, 
                    creating a mesmerizing planetary motion effect.
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>💫 Morphing Circles</Text>
                  <Text fontSize="sm" color="gray.600">
                    Rings appear, scale up with rotation, then disappear in sequence, 
                    creating a magical transformation effect.
                  </Text>
                </Box>
              </Grid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default SpinnerTest; 
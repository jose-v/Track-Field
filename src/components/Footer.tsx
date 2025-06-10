import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link,
  VisuallyHidden,
  chakra,
  useColorModeValue,
  Image,
  Flex,
  Divider,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const SocialButton = ({
  children,
  label,
  href,
}: {
  children: React.ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <chakra.button
      bg={useColorModeValue('gray.100', 'whiteAlpha.100')}
      rounded={'full'}
      w={10}
      h={10}
      cursor={'pointer'}
      as={'a'}
      href={href}
      display={'inline-flex'}
      alignItems={'center'}
      justifyContent={'center'}
      transition={'background 0.3s ease, transform 0.2s ease'}
      _hover={{
        bg: useColorModeValue('gray.200', 'whiteAlpha.200'),
        transform: 'translateY(-2px)',
      }}
      target="_blank"
      rel="noopener noreferrer"
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </chakra.button>
  );
};

const ListHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text fontWeight={'600'} fontSize={'sm'} mb={4} color={useColorModeValue('gray.700', 'gray.400')} textTransform="uppercase" letterSpacing="wide">
      {children}
    </Text>
  );
};

export function Footer() {
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  
  return (
    <Box
      bg={bgColor}
      color={textColor}
      borderTop={1}
      borderStyle={'solid'}
      borderColor={borderColor}
    >
      <Container as={Stack} maxW={'container.lg'} py={10}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }}
          spacing={12}
        >
          <VStack spacing={6} align="flex-start">
            <Box>
              <Image 
                src="/images/olympr-logo-white.png" 
                alt="Track & Field"
                h="40px"
                w="auto"
                objectFit="contain"
                mb={2}
              />
              <Text fontSize="sm" maxW="xs">
                The ultimate platform for track and field athletes to improve their performance.
              </Text>
            </Box>
            <HStack spacing={5}>
              <SocialButton label={'Twitter'} href={'https://twitter.com'}>
                <FaTwitter size={18} />
              </SocialButton>
              <SocialButton label={'Facebook'} href={'https://facebook.com'}>
                <FaFacebook size={18} />
              </SocialButton>
              <SocialButton label={'Instagram'} href={'https://instagram.com'}>
                <FaInstagram size={18} />
              </SocialButton>
              <SocialButton label={'LinkedIn'} href={'https://linkedin.com'}>
                <FaLinkedin size={18} />
              </SocialButton>
            </HStack>
          </VStack>
          
          <VStack align={'flex-start'} spacing={3}>
            <ListHeader>Company</ListHeader>
            <Link as={RouterLink} to={'/about'} fontSize="sm" _hover={{ color: 'blue.500' }}>About</Link>
            <Link as={RouterLink} to={'/contact'} fontSize="sm" _hover={{ color: 'blue.500' }}>Contact</Link>
            <Link as={RouterLink} to={'/privacy'} fontSize="sm" _hover={{ color: 'blue.500' }}>Privacy</Link>
            <Link as={RouterLink} to={'/terms'} fontSize="sm" _hover={{ color: 'blue.500' }}>Terms of Service</Link>
          </VStack>
          
          <VStack align={'flex-start'} spacing={3}>
            <ListHeader>Platform</ListHeader>
            <Link as={RouterLink} to={'/features'} fontSize="sm" _hover={{ color: 'blue.500' }}>Features</Link>
            <Link as={RouterLink} to={'/pricing'} fontSize="sm" _hover={{ color: 'blue.500' }}>Pricing</Link>
            <Link href={'#'} fontSize="sm" _hover={{ color: 'blue.500' }}>Resources</Link>
            <Link href={'#'} fontSize="sm" _hover={{ color: 'blue.500' }}>Blog</Link>
          </VStack>
          
          <VStack align={'flex-start'} spacing={3}>
            <ListHeader>Download</ListHeader>
            <Link 
              href={'https://apps.apple.com'} 
              isExternal
              _hover={{ opacity: 0.8 }}
            >
              <Image 
                src="/images/app-store-badge.svg" 
                alt="Download on the App Store" 
                h="36px"
              />
            </Link>
            <Link 
              href={'https://play.google.com'} 
              isExternal
              _hover={{ opacity: 0.8 }}
              mt={2}
            >
              <Image 
                src="/images/google-play-badge.png" 
                alt="Get it on Google Play" 
                h="40px"
              />
            </Link>
          </VStack>
        </SimpleGrid>
        
        <Divider my={8} borderColor={borderColor} />
        
        <Text fontSize={'sm'} textAlign="center">
          © {new Date().getFullYear()} Track & Field. All rights reserved
        </Text>
      </Container>
    </Box>
  );
} 
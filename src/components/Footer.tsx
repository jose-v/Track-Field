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
      bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
      rounded={'full'}
      w={8}
      h={8}
      cursor={'pointer'}
      as={'a'}
      href={href}
      display={'inline-flex'}
      alignItems={'center'}
      justifyContent={'center'}
      transition={'background 0.3s ease'}
      _hover={{
        bg: useColorModeValue('blackAlpha.200', 'whiteAlpha.200'),
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
    <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
      {children}
    </Text>
  );
};

export function Footer() {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
      borderTop={1}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container as={Stack} maxW={'100%'} py={10} px={8}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }}
          spacing={8}
        >
          <Stack spacing={6}>
            <Box>
              <Text fontWeight="bold" fontSize="xl" color="blue.500">
                Track & Field
              </Text>
            </Box>
            <Text fontSize={'sm'}>
              © {new Date().getFullYear()} Track & Field. All rights reserved
            </Text>
            <Stack direction={'row'} spacing={6}>
              <SocialButton label={'Twitter'} href={'https://twitter.com'}>
                <FaTwitter />
              </SocialButton>
              <SocialButton label={'Facebook'} href={'https://facebook.com'}>
                <FaFacebook />
              </SocialButton>
              <SocialButton label={'Instagram'} href={'https://instagram.com'}>
                <FaInstagram />
              </SocialButton>
              <SocialButton label={'LinkedIn'} href={'https://linkedin.com'}>
                <FaLinkedin />
              </SocialButton>
            </Stack>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Company</ListHeader>
            <Link as={RouterLink} to={'/about'}>About</Link>
            <Link as={RouterLink} to={'/contact'}>Contact</Link>
            <Link as={RouterLink} to={'/privacy'}>Privacy</Link>
            <Link as={RouterLink} to={'/terms'}>Terms of Service</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Platform</ListHeader>
            <Link as={RouterLink} to={'/features'}>Features</Link>
            <Link as={RouterLink} to={'/pricing'}>Pricing</Link>
            <Link href={'#'}>Resources</Link>
            <Link href={'#'}>Blog</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Download Our App</ListHeader>
            <Flex direction="column" gap={3}>
              <Link 
                href={'https://apps.apple.com'} 
                isExternal
                _hover={{ opacity: 0.8 }}
              >
                <Image 
                  src="/images/app-store-badge.svg" 
                  alt="Download on the App Store" 
                  h="40px"
                />
              </Link>
              <Link 
                href={'https://play.google.com'} 
                isExternal
                _hover={{ opacity: 0.8 }}
              >
                <Image 
                  src="/images/google-play-badge.png" 
                  alt="Get it on Google Play" 
                  h="45px"
                />
              </Link>
            </Flex>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
} 
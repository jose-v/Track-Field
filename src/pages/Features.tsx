import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { FaChartLine, FaUsers, FaCalendarAlt, FaVideo, FaTrophy, FaBell } from 'react-icons/fa'

const Feature = ({ title, text, icon }: { title: string; text: string; icon: any }) => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={6}
      rounded="lg"
      shadow="md"
      spacing={4}
      _hover={{ transform: 'translateY(-5px)', transition: 'all 0.3s ease' }}
    >
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        color="white"
        rounded="full"
        bg="brand.500"
        mb={1}
      >
        <Icon as={icon} w={10} h={10} />
      </Flex>
      <Text fontWeight={600}>{title}</Text>
      <Text color={useColorModeValue('gray.600', 'gray.400')}>{text}</Text>
    </Stack>
  )
}

const Features = () => {
  const features = [
    {
      title: 'Advanced Analytics',
      text: 'Track your performance metrics, analyze your progress, and get insights to improve your training.',
      icon: FaChartLine,
    },
    {
      title: 'Team Collaboration',
      text: 'Connect with your team, share updates, and stay motivated together.',
      icon: FaUsers,
    },
    {
      title: 'Training Plans',
      text: 'Access personalized training plans designed by professional coaches.',
      icon: FaCalendarAlt,
    },
    {
      title: 'Video Analysis',
      text: 'Record and analyze your technique with our video analysis tools.',
      icon: FaVideo,
    },
    {
      title: 'Competition Tracking',
      text: 'Keep track of your competitions, results, and achievements.',
      icon: FaTrophy,
    },
    {
      title: 'Smart Notifications',
      text: 'Get timely reminders for workouts, competitions, and team events.',
      icon: FaBell,
    },
  ]

  return (
    <Box py={20} bg={useColorModeValue('gray.50', 'gray.900')} w="100%">
      <Container maxW="100%" px={8}>
        <Stack spacing={4} as={Container} maxW="3xl" textAlign="center" mb={16}>
          <Heading size="2xl">Everything You Need to Excel</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="xl">
            Our platform provides all the tools and features you need to take your track & field performance to the next level.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
          {features.map((feature, index) => (
            <Feature
              key={index}
              title={feature.title}
              text={feature.text}
              icon={feature.icon}
            />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}

export { Features } 